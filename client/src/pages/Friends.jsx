import React, { useEffect, useMemo, useState } from "react";
import { Check, MailPlus, MessageCircle, Search, Send, X } from "lucide-react";
import { apiRequest } from "../services/api.js";
import { disconnectSocket, getSocket } from "../services/socket.js";
import { useAuth } from "../context/AuthContext.jsx";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const isConversationMessage = (message, userId, friendId) => {
  const senderId = message.sender?._id || message.sender;
  const recipientId = message.recipient?._id || message.recipient;
  return (
    (senderId === userId && recipientId === friendId) ||
    (senderId === friendId && recipientId === userId)
  );
};

const statusCopy = {
  self: "That is your account.",
  friend: "You are already friends.",
  incoming_request: "This person already sent you a request.",
  outgoing_request: "Friend request pending.",
  none: ""
};

const Friends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [email, setEmail] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const socket = useMemo(() => getSocket(user?.token), [user?.token]);

  const loadDashboard = () =>
    apiRequest("/friends").then((data) => {
      setFriends(data.friends);
      setIncomingRequests(data.incomingRequests);
      setOutgoingRequests(data.outgoingRequests);
      setSelectedFriend((current) => current || data.friends[0] || null);
    });

  useEffect(() => {
    loadDashboard().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedFriend) {
      setMessages([]);
      return;
    }

    apiRequest(`/friends/${selectedFriend._id}/messages`)
      .then((data) => setMessages(data.messages))
      .catch((err) => setError(err.message));
  }, [selectedFriend]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const refreshFriends = () => {
      loadDashboard().catch((err) => setError(err.message));
    };

    const receiveMessage = (message) => {
      if (selectedFriend && isConversationMessage(message, user._id, selectedFriend._id)) {
        setMessages((current) =>
          current.some((existing) => existing._id === message._id) ? current : [...current, message]
        );
      }
      refreshFriends();
    };

    socket.on("friend:request", refreshFriends);
    socket.on("friend:accepted", refreshFriends);
    socket.on("friend:rejected", refreshFriends);
    socket.on("chat:message", receiveMessage);

    return () => {
      socket.off("friend:request", refreshFriends);
      socket.off("friend:accepted", refreshFriends);
      socket.off("friend:rejected", refreshFriends);
      socket.off("chat:message", receiveMessage);
    };
  }, [selectedFriend, socket, user._id]);

  useEffect(() => () => disconnectSocket(), []);

  const handleSearch = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");
    setSearchResult(null);

    try {
      const result = await apiRequest(`/friends/search?email=${encodeURIComponent(email)}`);
      setSearchResult(result);
      setStatus(statusCopy[result.status] || "");
    } catch (err) {
      setError(err.message);
    }
  };

  const sendFriendRequest = async () => {
    setError("");
    setStatus("");

    try {
      await apiRequest("/friends/requests", {
        method: "POST",
        body: JSON.stringify({ email: searchResult.user.email })
      });
      setSearchResult((current) => ({ ...current, status: "outgoing_request" }));
      setStatus("Friend request sent.");
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  const respondToRequest = async (requestId, action) => {
    setError("");
    setStatus("");

    try {
      await apiRequest(`/friends/requests/${requestId}/${action}`, { method: "POST" });
      setStatus(action === "accept" ? "Friend added." : "Request declined.");
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const body = messageText.trim();

    if (!body || !selectedFriend) {
      return;
    }

    setError("");
    setMessageText("");

    if (socket?.connected) {
      socket.emit("chat:send", { recipientId: selectedFriend._id, body }, (response) => {
        if (!response?.ok) {
          setError(response?.message || "Message failed");
        }
      });
      return;
    }

    try {
      const message = await apiRequest(`/friends/${selectedFriend._id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body })
      });
      setMessages((current) => [...current, message]);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page friends-page">
      <section className="friends-main">
        <div>
          <span className="eyebrow">Social hub</span>
          <h1>Friends</h1>
        </div>

        <form className="friend-search" onSubmit={handleSearch}>
          <label>
            Search by email
            <span>
              <Search size={18} aria-hidden />
              <input
                onChange={(event) => setEmail(event.target.value)}
                placeholder="friend@example.com"
                type="email"
                value={email}
              />
            </span>
          </label>
          <button type="submit">
            <Search size={18} aria-hidden />
            Search
          </button>
        </form>

        {error && <p className="form-error">{error}</p>}
        {status && <p className="success">{status}</p>}

        {searchResult && (
          <article className="friend-result">
            <div className="friend-avatar">{getInitials(searchResult.user.name)}</div>
            <div>
              <h2>{searchResult.user.name}</h2>
              <p>{searchResult.user.email}</p>
            </div>
            {searchResult.status === "none" ? (
              <button onClick={sendFriendRequest} type="button">
                <MailPlus size={18} aria-hidden />
                Add
              </button>
            ) : (
              <span>{statusCopy[searchResult.status]}</span>
            )}
          </article>
        )}

        <section className="friend-panels">
          <div>
            <h2>Requests</h2>
            {incomingRequests.length === 0 ? (
              <p className="status">No incoming requests.</p>
            ) : (
              <div className="request-list">
                {incomingRequests.map((request) => (
                  <article className="friend-row" key={request._id}>
                    <div className="friend-avatar">{getInitials(request.requester.name)}</div>
                    <div>
                      <strong>{request.requester.name}</strong>
                      <span>{request.requester.email}</span>
                    </div>
                    <button
                      aria-label={`Accept ${request.requester.name}`}
                      onClick={() => respondToRequest(request._id, "accept")}
                      title="Accept request"
                      type="button"
                    >
                      <Check size={18} aria-hidden />
                    </button>
                    <button
                      aria-label={`Decline ${request.requester.name}`}
                      className="icon-danger"
                      onClick={() => respondToRequest(request._id, "reject")}
                      title="Decline request"
                      type="button"
                    >
                      <X size={18} aria-hidden />
                    </button>
                  </article>
                ))}
              </div>
            )}

            {outgoingRequests.length > 0 && (
              <div className="outgoing-requests">
                <h2>Sent</h2>
                {outgoingRequests.map((request) => (
                  <p key={request._id}>{request.recipient.email}</p>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2>Your Friends</h2>
            {friends.length === 0 ? (
              <p className="status">Search by email to add your first friend.</p>
            ) : (
              <div className="friends-list">
                {friends.map((friend) => (
                  <button
                    className={selectedFriend?._id === friend._id ? "active" : ""}
                    key={friend._id}
                    onClick={() => setSelectedFriend(friend)}
                    type="button"
                  >
                    <span className="friend-avatar">{getInitials(friend.name)}</span>
                    <span>
                      <strong>{friend.name}</strong>
                      <small>{friend.email}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>

      <aside className="chat-panel">
        {selectedFriend ? (
          <>
            <div className="chat-header">
              <div className="friend-avatar">{getInitials(selectedFriend.name)}</div>
              <div>
                <h2>{selectedFriend.name}</h2>
                <p>{selectedFriend.email}</p>
              </div>
              <MessageCircle size={22} aria-hidden />
            </div>

            <div className="messages-list">
              {messages.length === 0 ? (
                <p className="status">No messages yet.</p>
              ) : (
                messages.map((message) => {
                  const mine = (message.sender?._id || message.sender) === user._id;
                  return (
                    <div className={mine ? "message-bubble sent" : "message-bubble received"} key={message._id}>
                      <p>{message.body}</p>
                      <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  );
                })
              )}
            </div>

            <form className="message-form" onSubmit={sendMessage}>
              <input
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="Write a message"
                value={messageText}
              />
              <button aria-label="Send message" title="Send message" type="submit">
                <Send size={18} aria-hidden />
              </button>
            </form>
          </>
        ) : (
          <div className="empty-chat">
            <MessageCircle size={34} aria-hidden />
            <h2>No chat selected</h2>
            <p>Add a friend to start a conversation.</p>
          </div>
        )}
      </aside>
    </div>
  );
};

export default Friends;
