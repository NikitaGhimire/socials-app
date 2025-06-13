import '../styles/components/SearchResults.css';

const SearchResults = ({ 
    searchResults, 
    setShowSearchOverlay, 
    API_URL, 
    isFriend,
    isPendingRequest,
    sendFriendRequest,
    cancelFriendRequest, 
    unfriendUser 
}) => {
    // Helper function to get button state
    const getFriendButtonState = (userId) => {
        if (isFriend(userId)) {
            return { 
                text: 'Unfriend', 
                className: 'friend-status-btn unfriend',
                action: () => unfriendUser(userId)
            };
        }
        if (isPendingRequest(userId)) {
            return { 
                text: 'Cancel Request', 
                className: 'friend-status-btn cancel',
                action: () => cancelFriendRequest(userId)
            };
        }
        return { 
            text: 'Add Friend', 
            className: 'friend-status-btn add',
            action: () => sendFriendRequest(userId)
        };
    };

    // Helper function for profile picture URL
    const getProfilePicUrl = (profilePicture) => {
        try {
            // Return default image if no profile picture
            if (!profilePicture) {
                return '/images/default.jpg';
            }

            // Handle Cloudinary URLs
            if (profilePicture.includes('cloudinary.com')) {
                return profilePicture;
            }

            // Handle external URLs
            if (profilePicture.startsWith('http')) {
                return profilePicture;
            }

            // Handle local uploads
            if (API_URL) {
                return `${API_URL}/uploads/${profilePicture}`;
            }

            // Fallback to default image
            return '/images/default.jpg';
        } catch (error) {
            console.error('Error processing profile picture URL:', error);
            return '/images/default.jpg';
        }
    };

    if (searchResults.length === 0) {
        return (
            <div className="popup-overlay" onClick={() => setShowSearchOverlay(false)}>
                <div className="popup-content" onClick={e => e.stopPropagation()}>
                    <button className="close-button" onClick={() => setShowSearchOverlay(false)}>×</button>
                    <h2 className="popup-header">Search Results</h2>
                    <div className="no-results">No users found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="popup-overlay" onClick={() => setShowSearchOverlay(false)}>
            <div className="popup-content" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={() => setShowSearchOverlay(false)}>×</button>
                <h2 className="popup-header">Search Results</h2>
                <div className="search-results">
                    {searchResults.map((searchedUser) => {
                        const buttonState = getFriendButtonState(searchedUser._id);
                        
                        return (
                            <div key={searchedUser._id} className="search-result-item">
                                <div className="user-info">
                                    <img 
                                        src={getProfilePicUrl(searchedUser.profilePicture)}
                                        alt={searchedUser.name} 
                                        className="user-avatar"
                                        onError={(e) => {
                                            console.log('Image failed to load:', e.target.src);
                                            e.target.onerror = null;
                                            e.target.src = '/images/default.jpg';
                                        }}
                                        loading="lazy"
                                    />
                                    <div className="user-details">
                                        <h4>{searchedUser.name}</h4>
                                        <p>{searchedUser.statusMessage || "No status"}</p>
                                    </div>
                                </div>
                                <button 
                                    className={buttonState.className}
                                    onClick={buttonState.action}
                                >
                                    {buttonState.text}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SearchResults;