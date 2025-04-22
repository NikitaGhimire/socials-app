import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContex';
import api from '../services/api';
import '../styles/home.css';

const NavigationBar = lazy(() => import('../components/NavigationBar'));
const Footer = lazy(() => import('../components/Footer'));

const API_URL = process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const Home = () => {
    const { user, logout } = useAuth();
    const [profileVisible, setProfileVisible] = useState(false);
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [posts, setPosts] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [friendRequestsVisible, setFriendRequestsVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingProfile, setEditingProfile] = useState(false);
    const [userProfile, setUserProfile] = useState({});
    const [friendsVisible, setFriendsVisible] = useState(false);
    const searchRef = useRef(null);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [newPost, setNewPost] = useState({ text: "", image: null });
    const [showCreatePost, setShowCreatePost] = useState(false);

    const [profileUpdates, setProfileUpdates] = useState({
        name: user?.name || '',
        email: user?.email || '',
        bio: user?.bio || '',
        statusMessage: user?.statusMessage || '',
        profilePicture: null,
    });

    const [isChatVisible, setIsChatVisible] = useState(false);
    const [isChatMinimized, setIsChatMinimized] = useState(false);

    const [showProfileOverlay, setShowProfileOverlay] = useState(false);
    const [showSearchOverlay, setShowSearchOverlay] = useState(false);

    const navigate = useNavigate();

    const fetchUserData = useCallback(async () => {
        try {
            setLoading(true);
            console.log("Fetching user data...");
    
            // Fetch all data concurrently using Promise.all
            const [friendsResponse, requestsResponse, profileResponse, conversationsResponse, postsResponse] = await Promise.all([
                api.get("/friends/myfriends"),
                api.get("/friends/requests"),
                api.get("/users/profile"),
                api.get("/messages/chats"),
                api.get("/posts"),
            ]);
    
            // Handle friends
            console.log("Fetched friends:", friendsResponse.data);
            setFriends(friendsResponse.data.uniqueFriends);
    
            // Handle friend requests
            console.log("Fetched friend requests:", requestsResponse.data);
            setFriendRequests(requestsResponse.data.friendRequests);
    
            // Handle user profile
            console.log("Fetched profile:", profileResponse.data);
            if (profileResponse.status === 200) {
                setUserProfile(profileResponse.data);
            }
    
            // Handle conversations
            console.log("Fetched conversations:", conversationsResponse.data);
            setConversations(conversationsResponse.data || []);

            //handle posts
            console.log("Fetched posts: ", postsResponse.data );
            setPosts(postsResponse.data || []);
            setLoadingPosts(false); 
    
        } catch (err) {
            console.error("Error fetching data", err.response ? err.response.data : err.message);
        } finally {
            console.log("Data fetch complete.");
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
    
        fetchUserData();
    
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSearchResults([]); // Clear search results when clicking outside
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    
    }, [user, navigate, fetchUserData]);
    

        
    const deleteMessage = async (messageId) => {
        try {
            const response = await api.delete(`/messages/${messageId}`);
    
            if (response.status === 200) {
                // Remove the deleted message from the UI
                setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId));
                if (messages.length === 1) { // If last message is deleted
                    deleteConversation(selectedConversation._id);
                }
                alert("Message deleted successfully");

            } else {
                console.error("Failed to delete message");
            }
        } catch (error) {
            console.error("Error deleting message:", error);
            alert("An error occurred while deleting the message");
        }
    };

    const deleteConversation = async (conversationId) => {
        try {
            const response = await api.delete(`/messages/delete/${conversationId}`);
    
            if (response.status === 200) {
                // Remove the deleted conversation from the UI
                setConversations((prevConversations) =>
                    prevConversations.filter((conv) => conv._id !== conversationId)
                );
                setSelectedConversation(null); // Clear the selected conversation
                setMessages([]); // Clear messages
                alert("Conversation deleted successfully");
            } else {
                console.error("Failed to delete conversation");
            }
        } catch (error) {
            console.error("Error deleting conversation:", error);
            alert("An error occurred while deleting the conversation");
        }
    };
    
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        try {
            const response = await api.get('/friends/search', {
                params: { query: searchQuery }
            });

            if (response.data && response.data.users) {
                setSearchResults(response.data.users);
                setShowSearchOverlay(true);
            }
        } catch (err) {
            console.error("Error searching users:", err);
            if (err.response?.status === 404) {
                alert("No users found matching your search");
            } else {
                alert("Error searching users. Please try again.");
            }
        }
    };

    // Fetch messages for a selected conversation
    const fetchMessages = async (conversationId) => {
        try {
            const response = await api.get(`/messages/${conversationId}`);
            console.log('Fetched messages:', response.data);
            if (Array.isArray(response.data)) {
                setMessages(response.data); 
             // Set messages only if it's an array
            } else {
                setMessages([]);  // If no messages, set empty array
            }
        } catch (err) {
            console.error('Error fetching messages:', err.response ? err.response.data : err.message);
        }
    };

    //send message to friend
    const handleSendMessage = async () => {
        let receiverId;
        let conversationId;

        try {
            // Determine the receiverId and conversationId
            if (selectedFriend) {
                receiverId = selectedFriend;
            } else if (selectedConversation) {
                receiverId = selectedConversation.participants?.find(
                    (participant) => participant._id !== user._id
                )?._id;
                conversationId = selectedConversation._id;
            }

            if (!receiverId) {
                console.error('Receiver not found');
                return;
            }

            const response = await api.post('/messages/sendMessage', {
                conversation: conversationId,
                receiverId,
                sender: user._id,
                content: newMessage,
            });

            if (response.data?.message && response.data?.conversation) {
                const { message, conversation } = response.data;

                // Add the new message to the messages list
                setMessages(prevMessages => [...prevMessages, {
                    ...message,
                    sender: { _id: user._id },
                    _id: message._id
                }]);

                // Update conversations list with new lastMessage
                setConversations(prevConversations => {
                    return prevConversations.map(conv => {
                        if (conv._id === (conversationId || conversation._id)) {
                            return {
                                ...conv,
                                lastMessage: newMessage // Update the lastMessage
                            };
                        }
                        return conv;
                    });
                });

                // If it's a new conversation, add it to the list
                if (!conversationId) {
                    const selectedFriendData = friends.find(f => f._id === selectedFriend);
                    const newConversation = {
                        ...conversation,
                        lastMessage: newMessage,
                        participants: [
                            { _id: user._id, name: user.name },
                            { _id: selectedFriend, name: selectedFriendData?.name }
                        ]
                    };
                    setConversations(prevConversations => {
                        const exists = prevConversations.some(conv => conv._id === conversation._id);
                        if (!exists) {
                            return [newConversation, ...prevConversations];
                        }
                        return prevConversations;
                    });
                    setSelectedConversation(newConversation);
                }

                setNewMessage('');
                setSelectedFriend(null);
            }
        } catch (err) {
            console.error('Error sending message:', err);
            alert('Failed to send message. Please try again.');
        }
    };

    const handleProfileUpdate = async () => {
        const formData = new FormData();
        formData.append("name", profileUpdates.name || user.name);
        formData.append("bio", profileUpdates.bio || user.bio);
        formData.append("statusMessage", profileUpdates.statusMessage || user.statusMessage);
        if (profileUpdates.profilePicture) {
            console.log("Profile picture file:", profileUpdates.profilePicture);
            formData.append("profilePicture", profileUpdates.profilePicture);
        } else {
            console.log("No profile picture selected for upload.");
        }

        try {
            console.log("Sending formData to /users/update-profile...");
            const response = await api.put("/users/update-profile", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const updatedUser = response.data;
            await fetchUserData();  // This fetches the profile and all other user-related data

            // Persist the updated user data in localStorage
            localStorage.setItem("user", JSON.stringify(updatedUser));

            alert("Profile updated successfully!");
            setEditingProfile(false);
            // Debug: Check state after reset
        console.log("Resetting profile updates state.");
            setProfileUpdates({ ...profileUpdates, profilePicture: null });
            // Update user state here instead of reloading the page
        } catch (err) {
            console.error("Error updating profile", err);
        }
    };

    const handleFileChange = (e) => {
        setProfileUpdates({ ...profileUpdates, profilePicture: e.target.files[0] });
    };

    const sendFriendRequest = async (friendId) => {
        console.log("Attempting to send friend request...");
        console.log("Friend ID:", friendId);
    
        // Check if the token is correctly retrieved
        const token = localStorage.getItem('token');
        console.log("Authorization Token:", token);
    
        if (!token) {
            console.error("No token found in localStorage");
            alert("Authentication token missing. Please log in again.");
            return;
        }
    
        try {
            const response = await api.post(
                `/friends/send`,
                { userId: friendId }, // Debugging payload
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
    
            // Log the success response
            console.log("Friend request sent successfully:", response.data);
            alert("Friend request sent!");
            fetchUserData();
        } catch (err) {
            console.error("Error sending friend request:", err);
    
            // Log detailed error response, if available
            if (err.response) {
                console.error("Error Response Status:", err.response.status);
                console.error("Error Response Data:", err.response.data);
                alert(`Error: ${err.response.data.message || "Failed to send friend request."}`);
            } else {
                console.error("Network or unexpected error:", err.message);
                alert("An unexpected error occurred. Please try again later.");
            }
        }
    };
    

    const isFriend = (friendId) => {
        return friends.some(friend => friend._id === friendId);
    };

    const handleProfileClick = () => {
        if (!editingProfile) {
            setShowProfileOverlay(!showProfileOverlay);
            setProfileVisible(!profileVisible);
        }
    };

    const handleEditProfile = () => {
        setEditingProfile(true);
    };

    const handleProfileChange = (e) => {
        console.log("Updating field:", e.target.name, "New value:", e.target.value);
        setProfileUpdates({ ...profileUpdates, [e.target.name]: e.target.value });
    };
    const handleFriendRequest = async (requestId, action) => {
        try {
            console.log('Sending request with:', { requestId, action }); // Debug log
    
            const response = await api.put('/friends/handle-request', {
                requestId,
                action
            });
    
            if (response.data.success) {
                // Update local state
                setFriendRequests(prev => 
                    prev.filter(request => request._id !== requestId)
                );
    
                if (action === 'accept') {
                    setFriends(prev => [...prev, response.data.newFriend]);
                }
    
                alert(response.data.message);
            }
        } catch (error) {
            console.error('Error handling friend request:', error);
            alert('Failed to process friend request');
        }
    };
    
    const handleFriendsClick = ()=> {
        setFriendsVisible(!friendsVisible);
    };

    const handleUnfriend = async (friendId) => {
        try {
            const response = await api.post("/friends/unfriend", { friendId });
    
            if (response.status === 200) {
                console.log("Friend removed successfully");
                // update the local friend list by filtering out the unfriended user
                fetchUserData();
                setFriends((prevFriends) => prevFriends.filter(friend => friend._id !== friendId));
            } else {
                console.error("Failed to unfriend");
            }
        } catch (error) {
            console.error("Error unfriending:", error);
        }
    };

    const handleRequestClick = () => {
        setFriendRequestsVisible(!friendRequestsVisible);
    };

    //posts
    const handleCreatePost = async () => {
        const formData = new FormData();
        formData.append("text", newPost.text);
        if (newPost.image) formData.append("image", newPost.image);
    
        try {
          const response = await api.post("/posts/createPost", formData, {
            headers: { "Content-Type": "multipart/form-data" },
           });

           const createdPost = response.data;
          setPosts([createdPost, ...posts]);
          setNewPost({ text: "", image: null });
          console.log("Post created successfully:", createdPost);
        } catch (error) {
          console.error("Error creating post:", error);
        }
    };

    const handleLogout = () => {
        setProfileVisible(false);
        setFriends([]);
        setFriendRequests([]);
        setSelectedFriend(null);
        setConversations([]);
        setSelectedConversation(null);
        setMessages([]);
        setNewMessage('');
        navigate('/login');
        logout();
    };
    

    const handleDeletePost = async (postId) => {
        try {
          await api.delete(`/posts/${postId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          setPosts(posts.filter((post) => post._id !== postId));
        } catch (error) {
          console.error("Error deleting post:", error);
        }
      };

      const handleLikePost = async (postId) => {
        try {
            if (!postId) {
                console.error('Post ID is missing');
                return;
            }
    
            const response = await api.post(`/posts/${postId}/like`);
            
            if (response.data) {
                setPosts(prevPosts => 
                    prevPosts.map(post => {
                        if (post._id === postId) {
                            // Toggle like status
                            const userHasLiked = post.likes?.includes(user._id);
                            const updatedLikes = userHasLiked
                                ? post.likes.filter(id => id !== user._id)
                                : [...(post.likes || []), user._id];
                            
                            return {
                                ...post,
                                likes: updatedLikes
                            };
                        }
                        return post;
                    })
                );
            }
        } catch (error) {
            const errorMessage = error?.response?.data?.message || 'Error updating like';
            console.error('Error toggling like:', errorMessage);
            // Optionally show user feedback
            // alert(errorMessage);
        }
    };
    
      const handleAddComment = async (postId, text) => {
        try {
          const response = await api.post(
            `/posts/${postId}/comment`,
            { text },
            {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            }
          );
          setPosts(posts.map((post) => (post._id === postId ? response.data : post)));
        } catch (error) {
          console.error("Error adding comment:", error);
        }
      };

      const toggleCommentsVisibility = (postId) => {
        setPosts((prevPosts) =>
            prevPosts.map((post) =>
                post._id === postId ? { ...post, showComments: !post.showComments } : post
            )
        );
    };

    const [showOptions, setShowOptions] = useState(null);

    // Add click outside handler to close options menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showOptions && !event.target.closest('.message-options')) {
                setShowOptions(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showOptions]);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="home-container">
                <NavigationBar 
                    onProfileClick={handleProfileClick}
                    onSearchClick={() => setSearchResults([])}
                    onFriendsClick={handleFriendsClick}
                    onRequestsClick={handleRequestClick}
                    onConversationsClick={() => setIsChatVisible(!isChatVisible)}
                    userProfile={userProfile}
                    searchQuery={searchQuery}
                    onSearchChange={(e) => setSearchQuery(e.target.value)}
                    handleSearch={handleSearch}
                />
                { user ? (
                    <> {loading ? (
                        <div>Loading...</div>
                    ) : (
                        <>
                            {/* Profile Popup */}
                            {showProfileOverlay && (
                                <div className="popup-overlay" onClick={() => {
                                    setShowProfileOverlay(false);
                                    setProfileVisible(false);
                                }}>
                                    <div className="popup-content" onClick={e => e.stopPropagation()}>
                                        <button className="close-button" onClick={() => {
                                            setShowProfileOverlay(false);
                                            setProfileVisible(false);
                                        }}>×</button>
                                        <div className="profile-section">
                                            <img 
                                                src={userProfile?.profilePicture ? 
                                                    `${API_URL}${userProfile.profilePicture}` : 
                                                    '/images/default.jpg'
                                                } 
                                                alt={userProfile?.name || "User"} 
                                                className="profile-picture-icon" 
                                            />
                                            {!editingProfile ? (
                                                <div className="profile-details">
                                                    <p>Name: {userProfile?.name}</p>
                                                    <p>Email: {userProfile?.email}</p>
                                                    <p>Bio: {userProfile?.bio}</p>
                                                    <p>Status: {userProfile?.statusMessage}</p>
                                                    <button onClick={handleEditProfile} className="edit-profile-button">
                                                        Edit Profile
                                                    </button>
                                                    <button onClick={handleLogout} className="logout-button">Logout</button>
                                                </div>
                                            ) : (
                                                <div className="edit-profile-form">
    <h2>Edit Profile</h2>
    
    <div className="form-group">
        <label htmlFor="name">Display Name</label>
        <input
            type="text"
            id="name"
            name="name"
            value={profileUpdates.name}
            onChange={handleProfileChange}
            placeholder="Enter your display name"
            className="edit-input"
        />
    </div>

    <div className="form-group">
        <label htmlFor="bio">Bio</label>
        <textarea
            id="bio"
            name="bio"
            value={profileUpdates.bio}
            onChange={handleProfileChange}
            placeholder="Tell us about yourself"
            className="edit-input"
            rows="4"
        />
    </div>

    <div className="form-group">
        <label htmlFor="statusMessage">Status</label>
        <input
            type="text"
            id="statusMessage"
            name="statusMessage"
            value={profileUpdates.statusMessage}
            onChange={handleProfileChange}
            placeholder="What's on your mind?"
            className="edit-input"
        />
    </div>

    <div className="form-group">
        <label>Profile Picture</label>
        <div className="profile-picture-upload">
            <label htmlFor="profile-picture" className="upload-label">
                <img 
                    src="/images/image-attachment-icon.png" 
                    alt="Upload" 
                    className="upload-icon"
                />
                <span>Choose a new profile picture</span>
            </label>
            <input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
        </div>
    </div>

    <div className="edit-profile-buttons">
        <button 
            onClick={handleProfileUpdate}
            className="save-button"
        >
            Save Changes
        </button>
        <button 
            onClick={() => {
                setEditingProfile(false);
                setProfileUpdates({
                    name: userProfile?.name || '',
                    bio: userProfile?.bio || '',
                    statusMessage: userProfile?.statusMessage || '',
                    profilePicture: null
                });
            }}
            className="cancel-button"
        >
            Cancel
        </button>
    </div>
</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Search Results Popup */}
                            {searchResults.length > 0 && showSearchOverlay && (
                                <div className="popup-overlay" onClick={() => {
                                    setShowSearchOverlay(false);
                                    setSearchResults([]);
                                }}>
                                    <div className="popup-content" onClick={e => e.stopPropagation()}>
                                        <button className="close-button" onClick={() => {
                                            setShowSearchOverlay(false);
                                            setSearchResults([]);
                                        }}>×</button>
                                        <div className="search-section" ref={searchRef}>
                                            {/* ... existing search content ... */}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Friends List Popup */}
                            {friendsVisible && (
                                <div className="popup-overlay" onClick={() => setFriendsVisible(false)}>
                                    <div className="popup-content" onClick={e => e.stopPropagation()}>
                                        <button className="close-button" onClick={() => setFriendsVisible(false)}>×</button>
                                        <h2 className="popup-header">Friends</h2>
                                        <div className="friends-list">
                                            {friends.length > 0 ? (
                                                friends.map((friend) => (
                                                    <div key={friend._id} className="friend-item">
                                                        <div className="friend-info">
                                                            <img 
                                                                src={friend.profilePicture ? 
                                                                    `${API_URL}${friend.profilePicture}` : 
                                                                    '/images/default.jpg'
                                                                } 
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
                            )}

                            {/* Friend Requests Popup */}
                            {friendRequestsVisible && (
                                <div className="popup-overlay" onClick={() => setFriendRequestsVisible(false)}>
                                    <div className="popup-content" onClick={e => e.stopPropagation()}>
                                        <button className="close-button" onClick={() => setFriendRequestsVisible(false)}>×</button>
                                        <h2 className="popup-header">Friend Requests</h2>
                                        <div className="requests-list">
                                            {friendRequests.length > 0 ? (
                                                friendRequests.map((request) => (
                                                    <div key={request._id} className="request-item">
                                                        <div className="request-info">
                                                            <img 
                                                                src={request.sender?.profilePicture ? 
                                                                    `${API_URL}${request.sender.profilePicture}` : 
                                                                    '/images/default.jpg'
                                                                } 
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
                            )}

                            {/* Search Results Popup */}
                            {searchResults.length > 0 && showSearchOverlay && (
                                <div className="popup-overlay" onClick={() => setShowSearchOverlay(false)}>
                                    <div className="popup-content" onClick={e => e.stopPropagation()}>
                                        <button className="close-button" onClick={() => setShowSearchOverlay(false)}>×</button>
                                        <h2 className="popup-header">Search Results</h2>
                                        <div className="search-results">
                                            {searchResults.map((searchedUser) => (
                                                <div key={searchedUser._id} className="search-result-item">
                                                    <div className="user-info">
                                                        <img 
                                                            src={searchedUser.profilePicture ? 
                                                                `${API_URL}${searchedUser.profilePicture}` : 
                                                                '/images/default.jpg'
                                                            } 
                                                            alt={searchedUser.name} 
                                                            className="user-avatar"
                                                        />
                                                        <div className="user-details">
                                                            <h4>{searchedUser.name}</h4>
                                                            <p>{searchedUser.statusMessage || "No status"}</p>
                                                        </div>
                                                    </div>
                                                    {!isFriend(searchedUser._id) && (
                                                        <button 
                                                            className="add-friend-btn"
                                                            onClick={() => sendFriendRequest(searchedUser._id)}
                                                        >
                                                            Add Friend
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Chat/Conversations Popup */}
                            {isChatVisible && (
                                <div className="popup-overlay chat-overlay" onClick={() => setIsChatVisible(false)}>
                                    <div 
                                        className={`popup-content chat-popup ${isChatMinimized ? 'minimized' : ''}`}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="chat-header">
                                            <h3>Messages</h3>
                                            <div className="chat-controls">
                                                <button 
                                                    className="minimize-button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsChatMinimized(!isChatMinimized);
                                                    }}
                                                >
                                                    {isChatMinimized ? '▲' : '▼'}
                                                </button>
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
                                        {!isChatMinimized && (
                                            <div className="chat-container">
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
                                                        {conversations && conversations.length > 0 ? (
                                                            <ul>
                                                                {conversations.map((conv) => (
                                                                    <li key={conv._id} className="conversation-item">
                                                                        <div 
                                                                            className="conversation-info"
                                                                            onClick={() => {
                                                                                setSelectedConversation(conv);
                                                                                fetchMessages(conv._id);
                                                                            }}
                                                                        >
                                                                            {conv.participants
                                                                                .filter(p => p._id !== user._id)
                                                                                .map(p => (
                                                                                    <div key={p._id} className="participant-info">
                                                                                        <img 
                                                                                            src={p.profilePicture ? 
                                                                                                `${API_URL}${p.profilePicture}` : 
                                                                                                '/images/default.jpg'
                                                                                            } 
                                                                                            alt={p.name} 
                                                                                            className="participant-avatar"
                                                                                        />
                                                                                        <div className="participant-details">
                                                                                            <span className="participant-name">{p.name}</span>
                                                                                            <span className="last-message">{conv.lastMessage || "No messages"}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                ))
                                                                            }
                                                                        </div>
                                                                        <button 
                                                                            className="delete-conversation-btn"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                deleteConversation(conv._id);
                                                                            }}
                                                                        >
                                                                            <img src="/images/delete-icon.png" alt="Delete" className="delete-icon" />
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p>No conversations yet</p>
                                                        )}
                                                    </div>
                                                </div>
                                            
                                                {/* Right side - Only visible when conversation is selected */}
                                                {(selectedConversation || selectedFriend) && (
                                                    <div className="messages-container">
                                                        <div className="messages-list">
                                                            {messages.map((message) => (
                                                                <div 
                                                                    key={message._id} 
                                                                    className={`message ${message.sender._id === user._id ? 'sent' : 'received'}`}
                                                                >
                                                                    <p>{message.content}</p>
                                                                    {message.sender._id === user._id && (
                                                                        <button 
                                                                            className="delete-message" 
                                                                            onClick={() => deleteMessage(message._id)}
                                                                        >
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
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Main Content - Posts Section */}
                            <div className="main-content">
                                <div className="animated-background">
                                    <div className="shape shape1"></div>
                                    <div className="shape shape2"></div>
                                    <div className="shape shape3"></div>
                                    <div className="shape shape4"></div>
                                </div>
                                <div className="post-section">
                                    <button className="create-post-button" onClick={() => setShowCreatePost(true)}>
                                        Create New Post
                                    </button>
                                    
                                    {showCreatePost && (
                                        <div className="popup-overlay" onClick={() => setShowCreatePost(false)}>
                                            <div className="popup-content" onClick={e => e.stopPropagation()}>
                                                <button className="close-button" onClick={() => setShowCreatePost(false)}>×</button>
                                                <h3>Create a New Post</h3>
                                                <div className="create-post">
                                                    <textarea
                                                        value={newPost.text}
                                                        onChange={(e) => setNewPost({ ...newPost, text: e.target.value })}
                                                        placeholder="What's on your mind?"
                                                        className="post-textarea"
                                                    />
                                                    <div className="post-actions">
                                                        <div className="left-actions">
                                                            <label htmlFor="file-input" className="attachment-icon">
                                                                <img 
                                                                    src="/images/image-attachment-icon.png" 
                                                                    alt="Attachment" 
                                                                    className="attachment-img"
                                                                /> 
                                                                <span>Add Photo</span>
                                                            </label>
                                                            <input
                                                                id='file-input'
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => setNewPost({ ...newPost, image: e.target.files[0] })}
                                                                style={{ display: "none" }}
                                                            />
                                                        </div>
                                                        <button 
                                                            onClick={() => {
                                                                handleCreatePost();
                                                                setShowCreatePost(false);
                                                            }}
                                                            disabled={!newPost.text.trim() && !newPost.image}
                                                            className="post-button"
                                                        >
                                                            Post
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="your-posts">
                                        {loadingPosts ? (
                                            <p>Loading posts...</p>
                                        ) : (
                                            posts.map((post, index) => {
                                                if (!post || !post._id || !post.author) {
                                                    console.error(`Invalid post at index ${index}:`, post);
                                                    return null; // Skip invalid posts
                                                }
                                                return (
                                                
                                                <div key={post._id} className="post-item">
                                                    <div className="author-details">
                                                        <img 
                                                            src={post.author && post.author.profilePicture ? 
                                                                `${API_URL}${post.author.profilePicture}` : 
                                                                '/images/default.jpg'} 
                                                            alt="author" 
                                                            className='author-pic'
                                                        />
                                                        <div className="author-name">
                                                            <strong>{post.author ? post.author.name : 'Unknown Author'}</strong>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="post-content">
                                                        {post.content.text && (
                                                            <p className="post-text">{post.content.text}</p>
                                                        )}
                                                        
                                                        {post.content && post.content.image && (
                                                            <img 
                                                                src={`${API_URL}${post.content.image}`} 
                                                                alt="Post" 
                                                                className='post-image'
                                                            />
                                                        )}
                                                    </div>
                                                
                                                    <div className='like-comment'>
                                                        <div className="like">
                                                            <button 
                                                                onClick={() => handleLikePost(post._id)} 
                                                                className={`like-button ${post.likes?.includes(user._id) ? 'liked' : ''}`}
                                                            >
                                                                <img 
                                                                    src={post.likes?.includes(user._id) ? '/images/liked-icon.png' : '/images/like-icon.png'} 
                                                                    alt="Like" 
                                                                    className='like-icon'
                                                                /> 
                                                                ({post.likes ? post.likes.length : 0})
                                                            </button>
                                                        </div>
                                                        
                                                        <div className='comment'>
                                                            <button 
                                                                onClick={() => toggleCommentsVisibility(post._id)} 
                                                                className="comment-icon-button"
                                                            >
                                                                <img src="/images/comment-icon.png" alt="Comment" className="comment-icon"/> 
                                                            </button>
                                                        </div>

                                                        {post.author._id === user._id && (
                                                            <div className="delete">
                                                                <button className="delete-button" onClick={() => handleDeletePost(post._id)}> 
                                                                    <img src="/images/delete-icon.png" alt="" className='delete-post-icon' />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Comments section */}
                                                    {post.showComments && (
                                                        <div className="comments">
                                                            <h4>Comments</h4>
                                                            {post.comments ? (
                                                                post.comments.map((comment) => (
                                                                    <div key={comment._id}>
                                                                        <strong>{comment.commenter?.name || 'Unknown'}</strong>: {comment.text}
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p>No comments yet.</p> /* Added fallback for undefined */
                                                            )}
                                                            <textarea
                                                                placeholder="Add a comment"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        handleAddComment(post._id, e.target.value);
                                                                        e.target.value = '';
                                                                    }
                                                                }}
                                                            ></textarea>
                                                            <hr />
                                                        </div>
                                                    )}
                                                </div>
                                                );
                                            }
                                        )
                                        )}
                                    </div>
                                </div>
                            </div>

                        </>
                    )} </>
                ):(<p> Navigate to login </p>)}

                
            </div>
            <Footer />
        </Suspense>
    );
};
export default Home;
