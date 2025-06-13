import '../styles/components/FriendList.css';

const FriendList = ({ 
    friends, 
    setSelectedFriend, 
    setIsChatVisible, 
    setFriendsVisible,
    handleUnfriend 
}) => {
    // Helper function for profile picture URL
    const getProfilePicUrl = (profilePicture) => {
        if (!profilePicture) return '/images/default.jpg';
        return profilePicture.includes('cloudinary.com') 
            ? profilePicture 
            : '/images/default.jpg';
    };

    const handleChatClick = (friendId) => {
        setSelectedFriend(friendId);
        setIsChatVisible(true);
        setFriendsVisible(false);
    };

    return (
        <div className="popup-overlay" onClick={() => setFriendsVisible(false)}>
            <div className="popup-content" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={() => setFriendsVisible(false)}>×</button>
                <h2 className="popup-header">Friends</h2>
                {friends.length === 0 ? (
                    <div className="no-friends">No friends yet</div>
                ) : (
                    <div className="friends-list">
                        {friends.map((friend) => (
                            <div key={friend._id} className="friend-item">
                                <div className="user-info">
                                    <img 
                                        src={getProfilePicUrl(friend.profilePicture)}
                                        alt={friend.name}
                                        className="user-avatar"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/images/default.jpg';
                                        }}
                                    />
                                    <div className="user-details">
                                        <h4>{friend.name}</h4>
                                        <p>{friend.statusMessage || "No status"}</p>
                                    </div>
                                </div>
                                <div className="friend-actions">
                                    <button 
                                        className="chat-btn"
                                        onClick={() => handleChatClick(friend._id)}
                                    >
                                        Chat
                                    </button>
                                    <button 
                                        className="unfriend-btn"
                                        onClick={() => handleUnfriend(friend._id)}
                                    >
                                        Unfriend
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

export default FriendList;