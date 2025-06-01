import React from 'react';

const FriendList = ({ friends, setSelectedFriend, setIsChatVisible, setFriendsVisible, handleUnfriend }) => {
  return (
    <div className="popup-overlay" onClick={() => setFriendsVisible(false)}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={() => setFriendsVisible(false)}>×</button>
        <h2 className="popup-header">Friends</h2>
        <div className="friends-list">
          {friends.length > 0 ? (
            friends.map((friend) => (
              <div key={friend._id} className="friend-item">
                <div className="friend-info">
                  <img
                    src={friend.profilePicture
                      ? `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${friend.profilePicture}`
                      : '/images/default.jpg'}
                    alt={friend.name}
                    className="friend-avatar"
                  />
                  <div className="friend-details">
                    <h4>{friend.name}</h4>
                    <p>{friend.statusMessage || "No status"}</p>
                  </div>
                </div>
                <div className="friend-actions">
                  <button
                    className="message-friend-btn"
                    onClick={() => {
                      setSelectedFriend(friend._id);
                      setIsChatVisible(true);
                      setFriendsVisible(false);
                    }}
                  >
                    Message
                  </button>
                  <button
                    className="unfriend-btn"
                    onClick={() => handleUnfriend(friend._id)}
                  >
                    Unfriend
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-friends-message">No friends yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendList;