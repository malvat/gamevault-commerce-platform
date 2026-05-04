import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

const userPayload = (user) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  name: user.name,
  email: user.email,
  role: user.role,
  token: generateToken(user._id)
});

export const registerUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const firstName = req.body.firstName?.trim();
  const lastName = req.body.lastName?.trim();
  const fallbackName = req.body.name?.trim();
  const name = [firstName, lastName].filter(Boolean).join(" ") || fallbackName;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide first name, last name, email, and password");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(409);
    throw new Error("A user with that email already exists");
  }

  const user = await User.create({ firstName, lastName, name, email, password });
  res.status(201).json(userPayload(user));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    return res.json(userPayload(user));
  }

  res.status(401);
  throw new Error("Invalid email or password");
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const firstName = req.body.firstName?.trim();
  const lastName = req.body.lastName?.trim();

  if (!firstName || !lastName) {
    res.status(400);
    throw new Error("Please provide first name and last name");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.firstName = firstName;
  user.lastName = lastName;
  user.name = `${firstName} ${lastName}`;

  const updatedUser = await user.save();
  res.json(userPayload(updatedUser));
});
