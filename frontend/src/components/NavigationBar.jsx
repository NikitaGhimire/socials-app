import React from 'react';
import '../styles/navigationBar.css';

const NavigationBar = ({ 
    onProfileClick, 
    onSearchClick,
    onFriendsClick,
    onRequestsClick,
    onConversationsClick,
    userProfile,
    searchQuery,
    onSearchChange,
    handleSearch
}) => {
    return (
        <nav className="navigation-bar">
            <div className="nav-left">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search for users..."
                        value={searchQuery}
                        onChange={onSearchChange}
                        className="nav-search-input"
                    />
                    <button onClick={handleSearch} className="nav-search-button">
                        <img src="/images/search-icon.png" alt="Search" />
                    </button>
                </div>
            </div>

            <div className="nav-right">
                <button className="nav-icon-button" onClick={onFriendsClick}>
                    <img src="/images/friend.png" alt="Friends" className="nav-icon" />
                </button>
                <button className="nav-icon-button" onClick={onRequestsClick}>
                    <img src="/images/request.png" alt="Requests" className="nav-icon" />
                </button>
                <button className="nav-icon-button" onClick={onConversationsClick}>
                    <img src="/images/inbox.png" alt="Messages" className="nav-icon" />
                </button>
                <div className="profile-section" onClick={onProfileClick}>
                    <img 
                        src={userProfile?.profilePicture ? 
                            `http://localhost:5000${userProfile.profilePicture}` : 
                            '/images/default.jpg'
                        }
                        alt="Profile"
                        className="nav-profile-pic"
                    />
                </div>
            </div>
        </nav>
    );
};

export default NavigationBar;