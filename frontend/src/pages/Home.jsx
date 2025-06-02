import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContex';
import api from '../services/api';
import '../styles/home.css';

const NavigationBar = lazy(() => import('../components/NavigationBar'));
const Footer = lazy(() => import('../components/Footer'));
const CreatePost = lazy(() => import('../components/CreatePost'));
const UserProfile = lazy(() => import ('../components/UserProfile'));
const FriendList = lazy(() => import ('../components/FriendList'));
const FriendRequests = lazy(() => import ('../components/FriendRequests'));
const ChatWindow = lazy(() => import ('../components/ChatWindow'));
const PostFeed = lazy(() => import ('../components/PostFeed'));

export const API_URL = process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

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
    const handleCreatePost = async (newPost) => {

        if (!newPost) {
            setShowCreatePost(false);
            return;
        }

        const formData = new FormData();
        formData.append("text", newPost.text);
        if (newPost.image) formData.append("image", newPost.image);
    
        try {
          const response = await api.post("/posts/createPost", formData, {
            headers: { "Content-Type": "multipart/form-data" },
           });

           setPosts((prevPosts) => [response.data, ...prevPosts]);
           console.log("Post created successfully");
        } catch (error) {
          console.error("Error creating post:", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

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

            const updatedPost = response.data;

            if (!updatedPost._id || !updatedPost.comments) {
            console.error("Unexpected response shape (not a full post):", updatedPost);
            return;
            }

            setPosts((prevPosts) =>
            prevPosts.map((post) =>
                post._id === postId ? updatedPost : post
            )
            );
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
                                <UserProfile
                                    userProfile={userProfile}
                                    editingProfile={editingProfile}
                                    profileUpdates={profileUpdates}
                                    setEditingProfile={setEditingProfile}
                                    handleProfileChange={handleProfileChange}
                                    handleProfileUpdate={handleProfileUpdate}
                                    handleFileChange={handleFileChange}
                                    handleLogout={handleLogout}
                                    setShowProfileOverlay={setShowProfileOverlay}
                                    setProfileVisible={setProfileVisible}
                                    setProfileUpdates={setProfileUpdates}
                                />
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
                                <FriendList
                                    friends={friends}
                                    setSelectedFriend={setSelectedFriend}
                                    setIsChatVisible={setIsChatVisible}
                                    setFriendsVisible={setFriendsVisible}
                                    handleUnfriend={handleUnfriend}
                                />
                            )}

                            {/* Friend Requests Popup */}
                                                        
                            {friendRequestsVisible && (
                            <FriendRequests
                                friendRequests={friendRequests}
                                handleFriendRequest={handleFriendRequest}
                                setFriendRequestsVisible={setFriendRequestsVisible}
                            />
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
                           <ChatWindow
                                user={user}
                                API_URL={API_URL}
                                isChatVisible={isChatVisible}
                                isChatMinimized={isChatMinimized}
                                setIsChatVisible={setIsChatVisible}
                                setIsChatMinimized={setIsChatMinimized}
                                selectedFriend={selectedFriend}
                                setSelectedFriend={setSelectedFriend}
                                selectedConversation={selectedConversation}
                                setSelectedConversation={setSelectedConversation}
                                friends={friends}
                                conversations={conversations}
                                messages={messages}
                                setMessages={setMessages}
                                newMessage={newMessage}
                                setNewMessage={setNewMessage}
                                fetchMessages={fetchMessages}
                                handleSendMessage={handleSendMessage}
                                deleteMessage={deleteMessage}
                                deleteConversation={deleteConversation}
                            />

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
                                    {showCreatePost && <CreatePost onCreatePost={handleCreatePost} />}
                                    
                                    
                                    <PostFeed
                                        posts={posts}
                                        loadingPosts={loadingPosts}
                                        handleLikePost={handleLikePost}
                                        toggleCommentsVisibility={toggleCommentsVisibility}
                                        handleDeletePost={handleDeletePost}
                                        handleAddComment={handleAddComment}
                                        user={user}
                                    />
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
