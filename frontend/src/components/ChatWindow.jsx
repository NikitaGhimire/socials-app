import React from 'react';

const ChatWindow = ({
  user,
  API_URL,
  isChatVisible,
  isChatMinimized,
  setIsChatVisible,
  setIsChatMinimized,
  selectedFriend,
  setSelectedFriend,
  selectedConversation,
  setSelectedConversation,
  friends,
  conversations,
  messages,
  setMessages,
  newMessage,
  setNewMessage,
  fetchMessages,
  handleSendMessage,
  deleteMessage,
  deleteConversation
}) => {
  if (!isChatVisible) return null;

  const getOtherParticipant = (conv) =>
    conv.participants?.find((p) => p._id !== user._id);

  return (
    <div className="popup-overlay chat-overlay" onClick={() => setIsChatVisible(false)}>
      <div
        className={`popup-content chat-popup ${isChatMinimized ? 'minimized' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="chat-header">
          <h3>Messages</h3>
          <div className="chat-controls">
            <button
              className="minimize-button"
              onClick={(e) => {
                e.stopPropagation();
                setIsChatMinimized(!isChatMinimized);
              }}
            >
              {isChatMinimized ? '▲' : '▼'}
            </button>
            <button
              className="close-button"
              onClick={(e) => {
                e.stopPropagation();
                setIsChatVisible(false);
              }}
            >
              ×
            </button>
          </div>
        </div>

        {!isChatMinimized && (
          <div className="chat-container">
            {/* Conversation list + new message dropdown */}
            <div className="conversations-list">
              <div className="new-message-section">
                <h4>New Message</h4>
                <select
                  value={selectedFriend || ""}
                  onChange={(e) => setSelectedFriend(e.target.value)}
                  className="friend-select"
                >
                  <option value="">Select a Friend</option>
                  {friends.map((friend) => (
                    <option key={friend._id} value={friend._id}>
                      {friend.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="conversations">
                {conversations.length > 0 ? (
                  <ul>
                    {conversations.map((conv) => {
                      const other = getOtherParticipant(conv);
                      return (
                        <li key={conv._id} className="conversation-item">
                          <div
                            className="conversation-info"
                            onClick={() => {
                              setSelectedConversation(conv);
                              setSelectedFriend(null);
                              fetchMessages(conv._id);
                            }}
                          >
                            <img
                              src={
                                other?.profilePicture
                                  ? `${API_URL}${other.profilePicture}`
                                  : "/images/default.jpg"
                              }
                              alt={other?.name}
                              className="participant-avatar"
                            />
                            <div className="participant-details">
                              <span className="participant-name">{other?.name}</span>
                              <span className="last-message">{conv.lastMessage || "No messages"}</span>
                            </div>
                          </div>
                          <button
                            className="delete-conversation-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv._id);
                            }}
                          >
                            <img src="/images/delete-icon.png" alt="Delete" className="delete-icon" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p>No conversations yet</p>
                )}
              </div>
            </div>

            {/* Messages Area */}
            {(selectedConversation || selectedFriend) && (
              <div className="messages-container">
                <div className="messages-list">
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={`message ${message.sender._id === user._id ? 'sent' : 'received'}`}
                    >
                      <p>{message.content}</p>
                      {message.sender._id === user._id && (
                        <button className="delete-message" onClick={() => deleteMessage(message._id)}>
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="message-input-container">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="send-message-btn"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;