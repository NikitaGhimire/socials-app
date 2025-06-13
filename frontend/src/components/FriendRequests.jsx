import React from 'react';
import '../styles/components/FriendRequests.css';

const FriendRequests = ({ friendRequests, handleFriendRequest, setFriendRequestsVisible }) => {
    // Helper function for profile picture URL
    const getProfilePicUrl = (profilePicture) => {
        if (!profilePicture) return '/images/default.jpg';
        return profilePicture.includes('cloudinary.com') 
            ? profilePicture 
            : '/images/default.jpg';
    };

    return (
        <div className="popup-overlay" onClick={() => setFriendRequestsVisible(false)}>
            <div className="popup-content" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={() => setFriendRequestsVisible(false)}>×</button>
                <h2 className="popup-header">Friend Requests</h2>
                {friendRequests.length === 0 ? (
                    <div className="no-requests">No pending friend requests</div>
                ) : (
                    <div className="friend-requests-list">
                        {friendRequests.map((request) => (
                            <div key={request._id} className="friend-request-item">
                                <div className="user-info">
                                    <img 
                                        src={getProfilePicUrl(request.sender.profilePicture)}
                                        alt={request.sender.name}
                                        className="user-avatar"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/images/default.jpg';
                                        }}
                                    />
                                    <div className="user-details">
                                        <h4>{request.sender.name}</h4>
                                        <p>{request.sender.statusMessage || "No status"}</p>
                                    </div>
                                </div>
                                <div className="request-actions">
                                    <button 
                                        className="accept-btn"
                                        onClick={() => handleFriendRequest(request._id, 'accept')}
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        className="reject-btn"
                                        onClick={() => handleFriendRequest(request._id, 'reject')}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FriendRequests;