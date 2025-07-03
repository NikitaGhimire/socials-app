import '../styles/components/ChatWindow.css';

const ChatWindow = ({
  user,
  API_URL,
  isChatVisible,
  setIsChatVisible,  // Remove isChatMinimized and setIsChatMinimized
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

  // Helper function for profile picture URL
  const getProfilePicUrl = (profilePicture) => {
    if (!profilePicture) return '/images/default.jpg';
    return profilePicture.includes('cloudinary.com') 
      ? profilePicture 
      : '/images/default.jpg';
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setSelectedFriend(null);
    setMessages([]);
    setNewMessage('');
  };

  const isConversationOpen = selectedConversation || selectedFriend;

  return (
    <div className="popup-overlay chat-overlay" onClick={() => setIsChatVisible(false)}>
      <div
        className="popup-content chat-popup"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="chat-header">
          {isConversationOpen ? (
            <div className="chat-header-content">
              <button className="back-button" onClick={handleBackToList}>
                ←
              </button>
              <h3>
                {selectedConversation 
                  ? getOtherParticipant(selectedConversation)?.name 
                  : friends.find(f => f._id === selectedFriend)?.name}
              </h3>
            </div>
          ) : (
            <h3>Messages</h3>
          )}
          <div className="chat-controls">
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

        <div className="chat-container">
          {!isConversationOpen ? (
            // Conversations List View
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
                        <li key={conv._id} className="conversation-item"
    onClick={() => {
      setSelectedConversation(conv);
      setSelectedFriend(null);
      fetchMessages(conv._id);
    }}
  >
    <div className="conversation-info">                      <img
                        src={getProfilePicUrl(other?.profilePicture)}
                        alt={other?.name}
                        className="participant-avatar"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/default.jpg';
                        }}
                      />
      <div className="participant-details">
        <span className="participant-name">{other?.name}</span>
        <span className="last-message">{conv.lastMessage || "No messages"}</span>
      </div>
    </div>
    <button
      className="delete-conversation-btn"
      onClick={(e) => {
        e.stopPropagation(); // Add this to prevent the conversation from opening when deleting
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
          ) : (
            // Messages View
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
      </div>
    </div>
  );
};

export default ChatWindow;