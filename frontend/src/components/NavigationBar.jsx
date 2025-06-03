import React, { useState, useEffect } from 'react';
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMenuOpen && !event.target.closest('.nav-right') && !event.target.closest('.menu-toggle')) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

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

            <button 
                className="menu-toggle"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
                <div className="hamburger-icon">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </button>

            <div className={`nav-right ${isMenuOpen ? 'show' : ''}`}>
                <button className="profile-section" onClick={onProfileClick}>
                    <img 
                        src={userProfile?.profilePicture ? 
                            `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '')}${userProfile.profilePicture}` : 
                            '/images/default.jpg'
                        }
                        alt="Profile"
                        className="nav-profile-pic"
                        loading="lazy"
                        width="36"
                        height="36"
                    />
                    <div className="profile-info">
                        <span className="user-name">{userProfile?.name || 'User'}</span>
                        <span className="nav-label">Profile</span>
                    </div>
                </button>

                <button className="nav-icon-button" onClick={onFriendsClick}>
                    <img src="/images/friend.png" alt="Friends" className="nav-icon" />
                    <span className="nav-label">Friends</span>
                </button>
                <button className="nav-icon-button" onClick={onRequestsClick}>
                    <img src="/images/request.png" alt="Requests" className="nav-icon" />
                    <span className="nav-label">Requests</span>
                </button>
                <button className="nav-icon-button" onClick={onConversationsClick}>
                    <img src="/images/inbox.png" alt="Messages" className="nav-icon" />
                    <span className="nav-label">Messages</span>
                </button>
                
            </div>
        </nav>
    );
};

export default NavigationBar;