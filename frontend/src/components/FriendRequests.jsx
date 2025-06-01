import React from 'react';

const FriendRequests = ({ friendRequests, handleFriendRequest, setFriendRequestsVisible }) => {
  return (
    <div className="popup-overlay" onClick={() => setFriendRequestsVisible(false)}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={() => setFriendRequestsVisible(false)}>×</button>
        <h2 className="popup-header">Friend Requests</h2>
        <div className="requests-list">
          {friendRequests.length > 0 ? (
            friendRequests.map((request) => (
              <div key={request._id} className="request-item">
                <div className="request-info">
                  <img
                    src={request.sender?.profilePicture
                      ? `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${request.sender.profilePicture}`
                      : '/images/default.jpg'}
                    alt={request.sender?.name}
                    className="request-avatar"
                  />
                  <div className="request-details">
                    <h4>{request.sender?.name}</h4>
                    <p>{request.sender?.statusMessage || "No status"}</p>
                  </div>
                </div>
                <div className="request-actions">
                  <button
                    className="accept-button"
                    onClick={() => handleFriendRequest(request._id, 'accept')}
                  >
                    Accept
                  </button>
                  <button
                    className="reject-button"
                    onClick={() => handleFriendRequest(request._id, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-requests-message">No friend requests</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendRequests;