import { useState, useEffect } from 'react';
import '../styles/components/navigationBar.css';

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

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const getProfilePicUrl = (profilePicture) => {
        if (!profilePicture) return '/images/default.jpg';
        
        if (profilePicture.includes('cloudinary.com')) {
            return profilePicture;
        }
        
        return profilePicture.startsWith('http') 
            ? profilePicture 
            : '/images/default.jpg';
    };

    useEffect(() => {
        console.log('User Profile:', userProfile);
        console.log('Profile Picture URL:', userProfile?.profilePicture);
    }, [userProfile]);

    return (
        <nav className="navigation-bar">
            <div className="nav-left">
                <div className="search-container">
                    <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <input
                        type="text"
                        placeholder="Search for users..."
                        value={searchQuery}
                        onChange={onSearchChange}
                        onKeyPress={handleKeyPress}
                        className="nav-search-input"
                    />
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
                        src={getProfilePicUrl(userProfile?.profilePicture)}
                        alt="Profile"
                        className="nav-profile-pic"
                        loading="lazy"
                        width="36"
                        height="36"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/default.jpg';
                        }}
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
                <button 
                    className="nav-icon-button" 
                    onClick={(e) => {
                        e.stopPropagation();
                        onConversationsClick();
                        setIsMenuOpen(false); // Close the menu after clicking
                    }}
                >
                    <img src="/images/inbox.png" alt="Messages" className="nav-icon" />
                    <span className="nav-label">Messages</span>
                </button>
                
            </div>
        </nav>
    );
};

export default NavigationBar;