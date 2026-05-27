import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import FriendRequest from "../models/FriendRequest.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

const userFields = "_id firstName lastName name email";

const asId = (value) => value.toString();

const publicUser = (user) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  name: user.name,
  email: user.email
});

const emitToUser = (req, userId, event, payload) => {
  req.app.get("io")?.to(`user:${asId(userId)}`).emit(event, payload);
};

export const areFriends = async (userId, friendId) => {
  const user = await User.findOne({ _id: userId, friends: friendId }).select("_id");
  return Boolean(user);
};

export const getOrCreateConversation = async (userId, friendId) => {
  let conversation = await Conversation.findOne({
    participants: { $all: [userId, friendId], $size: 2 }
  });

  if (!conversation) {
    conversation = await Conversation.create({ participants: [userId, friendId] });
  }

  return conversation;
};

export const createChatMessage = async (senderId, recipientId, body) => {
  const text = body?.trim();

  if (!text) {
    const error = new Error("Message cannot be empty");
    error.statusCode = 400;
    throw error;
  }

  if (!(await areFriends(senderId, recipientId))) {
    const error = new Error("You can only message friends");
    error.statusCode = 403;
    throw error;
  }

  const conversation = await getOrCreateConversation(senderId, recipientId);
  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    recipient: recipientId,
    body: text
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  return message.populate("sender recipient", userFields);
};

export const getFriendsDashboard = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("friends", userFields);
  const [incomingRequests, outgoingRequests, conversations] = await Promise.all([
    FriendRequest.find({ recipient: req.user._id, status: "pending" })
      .populate("requester", userFields)
      .sort({ createdAt: -1 }),
    FriendRequest.find({ requester: req.user._id, status: "pending" })
      .populate("recipient", userFields)
      .sort({ createdAt: -1 }),
    Conversation.find({ participants: req.user._id })
      .populate("participants", userFields)
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
  ]);

  res.json({
    friends: user.friends.map(publicUser),
    incomingRequests,
    outgoingRequests,
    conversations
  });
});

export const searchUserByEmail = asyncHandler(async (req, res) => {
  const email = req.query.email?.trim().toLowerCase();

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const foundUser = await User.findOne({ email }).select(userFields);

  if (!foundUser) {
    res.status(404);
    throw new Error("No user found with that email");
  }

  let status = "none";
  const currentUser = await User.findById(req.user._id).select("friends");
  const pendingRequest = await FriendRequest.findOne({
    status: "pending",
    $or: [
      { requester: req.user._id, recipient: foundUser._id },
      { requester: foundUser._id, recipient: req.user._id }
    ]
  });

  if (asId(foundUser._id) === asId(req.user._id)) {
    status = "self";
  } else if (currentUser.friends.some((friendId) => asId(friendId) === asId(foundUser._id))) {
    status = "friend";
  } else if (pendingRequest?.requester.toString() === asId(req.user._id)) {
    status = "outgoing_request";
  } else if (pendingRequest) {
    status = "incoming_request";
  }

  res.json({ user: publicUser(foundUser), status });
});

export const sendFriendRequest = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const recipient = await User.findOne({ email }).select(userFields);

  if (!recipient) {
    res.status(404);
    throw new Error("No user found with that email");
  }

  if (asId(recipient._id) === asId(req.user._id)) {
    res.status(400);
    throw new Error("You cannot add yourself as a friend");
  }

  if (await areFriends(req.user._id, recipient._id)) {
    res.status(409);
    throw new Error("You are already friends");
  }

  const existingPending = await FriendRequest.findOne({
    status: "pending",
    $or: [
      { requester: req.user._id, recipient: recipient._id },
      { requester: recipient._id, recipient: req.user._id }
    ]
  });

  if (existingPending) {
    res.status(409);
    throw new Error("A friend request is already pending");
  }

  const request = await FriendRequest.findOneAndUpdate(
    { requester: req.user._id, recipient: recipient._id },
    { requester: req.user._id, recipient: recipient._id, status: "pending" },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).populate("requester recipient", userFields);

  emitToUser(req, recipient._id, "friend:request", request);
  res.status(201).json(request);
});

export const acceptFriendRequest = asyncHandler(async (req, res) => {
  const request = await FriendRequest.findOne({
    _id: req.params.requestId,
    recipient: req.user._id,
    status: "pending"
  });

  if (!request) {
    res.status(404);
    throw new Error("Friend request not found");
  }

  request.status = "accepted";
  await Promise.all([
    request.save(),
    User.updateOne({ _id: request.requester }, { $addToSet: { friends: request.recipient } }),
    User.updateOne({ _id: request.recipient }, { $addToSet: { friends: request.requester } }),
    getOrCreateConversation(request.requester, request.recipient)
  ]);

  const populatedRequest = await request.populate("requester recipient", userFields);
  emitToUser(req, request.requester, "friend:accepted", populatedRequest);
  emitToUser(req, request.recipient, "friend:accepted", populatedRequest);
  res.json(populatedRequest);
});

export const rejectFriendRequest = asyncHandler(async (req, res) => {
  const request = await FriendRequest.findOne({
    _id: req.params.requestId,
    recipient: req.user._id,
    status: "pending"
  });

  if (!request) {
    res.status(404);
    throw new Error("Friend request not found");
  }

  request.status = "rejected";
  await request.save();

  const populatedRequest = await request.populate("requester recipient", userFields);
  emitToUser(req, request.requester, "friend:rejected", populatedRequest);
  res.json(populatedRequest);
});

export const getMessages = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.friendId)) {
    res.status(400);
    throw new Error("Invalid friend id");
  }

  if (!(await areFriends(req.user._id, req.params.friendId))) {
    res.status(403);
    throw new Error("You can only view messages with friends");
  }

  const conversation = await getOrCreateConversation(req.user._id, req.params.friendId);
  const messages = await Message.find({ conversation: conversation._id })
    .populate("sender recipient", userFields)
    .sort({ createdAt: 1 })
    .limit(100);

  res.json({ conversation, messages });
});

export const sendMessage = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.friendId)) {
    res.status(400);
    throw new Error("Invalid friend id");
  }

  try {
    const message = await createChatMessage(req.user._id, req.params.friendId, req.body.body);
    emitToUser(req, req.user._id, "chat:message", message);
    emitToUser(req, req.params.friendId, "chat:message", message);
    res.status(201).json(message);
  } catch (err) {
    res.status(err.statusCode || 500);
    throw err;
  }
});
