import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import '../styles/components/ChatWindow.css';

// Lazy load emoji picker to avoid initialization issues
const EmojiPicker = lazy(() => import('emoji-picker-react'));

const ChatWindow = ({
  user,
  API_URL,
  isChatVisible,
  setIsChatVisible,
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newMessage]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    setSearchTerm('');
  };

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv);
    return other?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prevMessage => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const isConversationOpen = selectedConversation || selectedFriend;

  return (
    <div className="chat-wrapper">
      <div className="chat-popup">
        {/* Header */}
        <div className="chat-header">
          {isConversationOpen ? (
            <div className="chat-header-content">
              <button className="back-button" onClick={handleBackToList} title="Back to conversations">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>
              <div className="chat-header-info">
                <img
                  src={getProfilePicUrl(
                    selectedConversation 
                      ? getOtherParticipant(selectedConversation)?.profilePicture
                      : friends.find(f => f._id === selectedFriend)?.profilePicture
                  )}
                  alt="Profile"
                  className="header-avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/default.jpg';
                  }}
                />
                <div className="header-text">
                  <h3>
                    {selectedConversation 
                      ? getOtherParticipant(selectedConversation)?.name 
                      : friends.find(f => f._id === selectedFriend)?.name}
                  </h3>
                  <span className="online-status">Online</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="chat-header-content">
              <div className="header-text">
                <h3>Messages</h3>
                <span className="conversation-count">{conversations.length} conversations</span>
              </div>
            </div>
          )}
          <div className="chat-controls">
            <button
              className="control-button close-button"
              onClick={() => setIsChatVisible(false)}
              title="Close chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="chat-container">
            {!isConversationOpen ? (
              // Conversations List View
              <div className="conversations-list">
                <div className="search-section">
                  <div className="search-input-wrapper">
                    <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                    {searchTerm && (
                      <button 
                        className="clear-search"
                        onClick={() => setSearchTerm('')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="conversations">
                  <div className="conversations-header">
                    <h4 className="section-title">Conversations</h4>
                    <button 
                      className="new-chat-button"
                      onClick={() => setShowNewChatModal(true)}
                      title="Start new conversation"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                    </button>
                  </div>
                  {filteredConversations.length > 0 ? (
                    <div className="conversations-scroll">
                      {filteredConversations.map((conv) => {
                        const other = getOtherParticipant(conv);
                        return (
                          <div
                            key={conv._id}
                            className="conversation-item"
                            onClick={() => {
                              setSelectedConversation(conv);
                              setSelectedFriend(null);
                              fetchMessages(conv._id);
                            }}
                          >
                            <div className="conversation-left">
                              <div className="avatar-wrapper">
                                <img
                                  src={getProfilePicUrl(other?.profilePicture)}
                                  alt={other?.name}
                                  className="participant-avatar"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/images/default.jpg';
                                  }}
                                />
                                <div className="online-indicator"></div>
                              </div>
                              <div className="participant-details">
                                <span className="participant-name">{other?.name}</span>
                                <span className="last-message">
                                  {conv.lastMessage || 
                                   conv.latestMessage?.content || 
                                   "No messages yet"}
                                </span>
                              </div>
                            </div>
                            <div className="conversation-right">
                              <span className="message-time">
                                {(conv.lastMessageTime || conv.updatedAt) && 
                                 formatTime(conv.lastMessageTime || conv.updatedAt)}
                              </span>
                              <button
                                className="delete-conversation-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Delete this conversation?')) {
                                    deleteConversation(conv._id);
                                  }
                                }}
                                title="Delete conversation"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                      </svg>
                      <p>No conversations found</p>
                      <span>Start a new conversation by selecting a friend above</span>
                    </div>
                  )}
                </div>
                
                {/* New Chat Modal */}
                {showNewChatModal && (
                  <div className="new-chat-modal-overlay" onClick={() => setShowNewChatModal(false)}>
                    <div className="new-chat-modal" onClick={(e) => e.stopPropagation()}>
                      <div className="modal-header">
                        <h3>Start New Conversation</h3>
                        <button 
                          className="modal-close-btn"
                          onClick={() => setShowNewChatModal(false)}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                          </svg>
                        </button>
                      </div>
                      <div className="modal-content">
                        <p>Select a friend to start chatting:</p>
                        <div className="friends-grid">
                          {friends.map((friend) => (
                            <div
                              key={friend._id}
                              className="friend-item"
                              onClick={() => {
                                setSelectedFriend(friend._id);
                                setShowNewChatModal(false);
                              }}
                            >
                              <img
                                src={getProfilePicUrl(friend.profilePicture)}
                                alt={friend.name}
                                className="friend-avatar"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/default.jpg';
                                }}
                              />
                              <span className="friend-name">{friend.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Messages View
              <div className="messages-container">
                <div className="messages-list">
                  {messages.length === 0 ? (
                    <div className="empty-messages">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                      </svg>
                      <p>No messages yet</p>
                      <span>Start the conversation by sending a message</span>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={message._id}
                        className={`message ${message.sender._id === user._id ? 'sent' : 'received'}`}
                      >
                        <div className="message-content">
                          <p>{message.content}</p>
                          <div className="message-meta">
                            <span className="message-time">
                              {formatTime(message.createdAt)}
                            </span>
                            {message.sender._id === user._id && (
                              <span className="message-status">✓</span>
                            )}
                          </div>
                        </div>
                        {message.sender._id === user._id && (
                          <button 
                            className="delete-message" 
                            onClick={() => {
                              if (window.confirm('Delete this message?')) {
                                deleteMessage(message._id);
                              }
                            }}
                            title="Delete message"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="message-input-container">
                  <div className="input-wrapper">
                    <textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyPress={handleKeyPress}
                      className="message-input"
                      rows="1"
                      maxLength="1000"
                    />
                    <div className="input-actions">
                      <div className="emoji-picker-container" ref={emojiPickerRef}>
                        <button
                          className="emoji-button"
                          title="Add emoji"
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                          😊
                        </button>
                        {showEmojiPicker && (
                          <div className="emoji-picker-wrapper">
                            <Suspense fallback={<div>Loading emojis...</div>}>
                              <EmojiPicker
                                onEmojiClick={onEmojiClick}
                                width={300}
                                height={400}
                                searchDisabled={false}
                                skinTonesDisabled={true}
                                previewConfig={{
                                  showPreview: false
                                }}
                              />
                            </Suspense>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="send-message-btn"
                        title="Send message"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="typing-indicator">
                    <span className="char-count">{newMessage.length}/1000</span>
                  </div>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default ChatWindow;
