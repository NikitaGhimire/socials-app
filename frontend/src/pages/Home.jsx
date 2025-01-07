import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContex';
import api from '../services/api';
import '../styles/home.css';

const Home = () => {
    const { user, logout, updateUser } = useAuth();
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
    const [hoveredUser, setHoveredUser] = useState(null);
    const [sendMessageVisible, setSendMessageVisible] = useState(false);
    const [friendRequestsVisible, setFriendRequestsVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingProfile, setEditingProfile] = useState(false);
    const [userProfile, setUserProfile] = useState({});
    const [friendsVisible, setFriendsVisible] = useState(false);
    const searchRef = useRef(null);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [newPost, setNewPost] = useState({ text: "", image: null });

    const [profileUpdates, setProfileUpdates] = useState({
        name: user?.name || '',
        email: user?.email || '',
        bio: user?.bio || '',
        statusMessage: user?.statusMessage || '',
        profilePicture: null,
    });

    const navigate = useNavigate();

    // const fetchUserData = useCallback(async () => {
    //     try {
    //         console.log("Fetching user data...");
    //         setLoading(true);

    //         // Fetch friends
    //         const response = await api.get("/friends/myfriends");
    //         console.log("Fetched friends:", response.data);
    //         setFriends(response.data.uniqueFriends);

    //         // Fetch friend requests
    //         const requestsResponse = await api.get("/friends/requests");
    //         console.log("Fetched friend requests:", requestsResponse.data);
    //         setFriendRequests(requestsResponse.data.friendRequests);

    //         // Fetch user profile details
    //         const profileResponse = await api.get("/users/profile");
    //         console.log("Fetched profile:", profileResponse.data);
    //         if (profileResponse.status === 200) {
    //             setUserProfile(profileResponse.data); 
    //         }

            
    //     } catch (err) {
    //         console.error("Error fetching data", err.response ? err.response.data : err.message);
    //     } finally {
    //         console.log("Data fetch complete.");
    //         setLoading(false);
    //     }
    // }, []);

    //      // Fetch all conversations for the user
    // const fetchConversations = useCallback(async () => {
    //     try {
    //         console.log('Fetching conversations...');
    //         const response = await api.get('/messages/chats');
    //         console.log('Fetched conversations:', response.data);
    //         setConversations(response.data || []);
    //     } catch (err) {
    //         console.error('Error fetching conversations:', err.response ? err.response.data : err.message);
    //     } finally {
    //         setLoading(false);
    //     }
    // }, []);
    
    //     useEffect(() => {
    //         if (!user) {
    //             navigate("/login");
    //             return;
    //         }
    
            
    //             fetchUserData();
    //             fetchConversations();
    //             const handleClickOutside = (event) => {
    //                 if (searchRef.current && !searchRef.current.contains(event.target)) {
    //                     setSearchResults([]); // Clear search results when clicking outside
    //                 }
    //             };
    //             document.addEventListener('mousedown', handleClickOutside);
    //             return () => document.removeEventListener('mousedown', handleClickOutside);
                
        
    //     }, [user, navigate, fetchUserData, fetchConversations]);


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
        if (!searchQuery) return;

        try {
            const response = await api.get('/users/getAllUsers');
            const filteredUsers = response.data.filter(user =>
                user.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSearchResults(filteredUsers);
        } catch (err) {
            console.error("Error fetching users", err);
        }
    };
    
    // // Function to fetch the updated profile details
    // const fetchUserProfile = async () => {
    //     try {
    //         const response = await api.get("/users/profile"); // Adjust the endpoint as needed
    //         if (response.status === 200) {
    //             updateUser(response.data); // Update the local state with the latest user data
    //         }
    //     } catch (error) {
    //         console.error("Error fetching user profile:", error);
    //     }
    // };

   

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

    // const handleSendMessage = async () => {
    //     if (!selectedFriend && !selectedConversation) return;
    //     if (!newMessage) return;
    
    //     // Determine receiverId and conversationId
    //     const receiverId = selectedFriend || selectedConversation?.participants.find(
    //         (participant) => participant._id !== user._id
    //     )?._id;
    
    //     if (!receiverId) {
    //         console.error('Receiver not found');
    //         return;
    //     }
    
    //     try {
    //         // Send message request
    //         const response = await api.post('/messages/sendMessage', {
    //             conversation: selectedConversation?._id, // Pass existing conversation ID or undefined
    //             receiverId,
    //             sender: user._id,
    //             content: newMessage,
    //         });
    
    //         if (response.data?.message && response.data?.conversation) {
    //             const { message, conversation } = response.data;
    
    //             // Update the message list if this is the selected conversation
    //             if (selectedConversation?._id === conversation._id || !selectedConversation) {
    //                 setMessages(prevMessages => [
    //                     ...prevMessages,
    //                     { ...message, sender: { _id: user._id } }, // Ensure sender data
    //                 ]);
    //             }
    
    //             // Add conversation to the list if it's new
    //             if (!conversations.find((conv) => conv._id === conversation._id)) {
    //                 setConversations(prevConversations => [
    //                     ...prevConversations,
    //                     conversation,
    //                 ]);
    //             }

    //             // Set the new or updated conversation as the selected conversation
    //         setSelectedConversation(conversation);
    
    //             // Update selectedConversation if needed
    //             if (!selectedConversation) 
    //                 setSelectedConversation(conversation);
    //                 setNewMessage('');
    //                 setSelectedFriend(null); // Clear the selected friend after the message
    //             } else {
    //                 console.error('Incomplete response from server.');
    //             }
    //     } catch (err) {
    //         console.error('Error sending message:', err);
    //         alert('Failed to send message. Please try again.');
    //     }
    // };

    const handleSendMessage = async () => {
    let receiverId;
    let conversationId;

    // Determine the receiverId and conversationId
    if (selectedFriend) {
        receiverId = selectedFriend;
    } else if (selectedConversation) {
        receiverId = selectedConversation?.participants?.find(
            (participant) => participant._id !== user._id
        )?._id;
        conversationId = selectedConversation._id;
    }

    if (!receiverId) {
        console.error('Receiver not found');
        return;
    }

    try {
        // Sending the message
        const response = await api.post('/messages/sendMessage', {
            conversation: conversationId,
            receiverId,
            sender: user._id,
            content: newMessage,
        });

        if (response.data?.message && response.data?.conversation) {
            const { message, conversation } = response.data;

            // Update the message list if this is the selected conversation
            if (!selectedConversation) {
                // If no selected conversation, select the new conversation
                setSelectedConversation(conversation);
            }

            // Add the new message to the messages list
            setMessages((prevMessages) => [
                ...prevMessages,
                { ...message, sender: { _id: user._id } },
            ]);

            // If the conversation is new, add it to the conversation list
            if (!conversations.find((conv) => conv._id === conversation._id)) {
                setConversations((prevConversations) => [
                    ...prevConversations,
                    conversation,
                ]);
            }

            // Reset the message input
            setNewMessage('');
            setSelectedFriend(null); // Clear the selected friend after the message
        } else {
            console.error('Incomplete response from server.');
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
            // Debug: Log the response from the server
        console.log("Response from update-profile API:", updatedUser);
            // Debug: Fetch the updated user profile from the backend
        console.log("Fetching the updated user profile...");
            // await fetchUserProfile();
            await fetchUserData();  // This fetches the profile and all other user-related data


            // Debug: Check what is being stored in localStorage
        console.log("Storing updated user data in localStorage:", updatedUser);
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
            setProfileVisible(!profileVisible);  // Only toggle profile visibility if not editing
        }
    };

    const handleEditProfile = () => {
        setEditingProfile(true);
    };

    const handleProfileChange = (e) => {
        console.log("Updating field:", e.target.name, "New value:", e.target.value);
        setProfileUpdates({ ...profileUpdates, [e.target.name]: e.target.value });
    };
    const handleFriendRequest = async (senderId, action) => {
        try {
            const response = await api.put(
                '/friends/handle-request', 
                { senderId, action }, 
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );

        if (response.data.newFriend) {
            if (action === "accept") {
                // Ensure the new friend has the correct data
                setFriends((prevFriends) => {
                    // Add the new friend to the list
                    return [...prevFriends, response.data.newFriend];
                });
                setFriendRequests(prevRequests => prevRequests.filter(request => request.sender._id !== senderId));
            } else if (action === "reject" || action === "delete") {
                setFriendRequests(prevRequests => prevRequests.filter(request => request.sender._id !== senderId));
            }   
        }

        alert(response.data.message);
        fetchUserData();
    } catch (error) {
        console.error("Error handling friend request:", error);
        alert("An error occurred while processing the friend request.");
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

    const handleInboxClick = () => {
        setSendMessageVisible(!sendMessageVisible);
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
          const response = await api.post(`/posts/${postId}/like`, {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          setPosts(posts.map((post) => (post._id === postId ? response.data : post)));
        } catch (error) {
          console.error("Error liking post:", error);
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

    return (
        <div className="home-container">
            {loading ? (
                <div>Loading...</div>
            ) : (
                <>
                    <div className="profile-section" onClick={handleProfileClick}>
                        <img 
                            src={userProfile?.profilePicture ? `http://localhost:5000${userProfile.profilePicture}` : '/images/default.jpg'}
                            alt={userProfile?.name || "User"} 
                            className="profile-picture-icon" 
                        />
                        {profileVisible && !editingProfile && (
                            <div className="profile-details">
                                {/* <img 
                                    src={userProfile?.profilePicture ?`http://localhost:5000${userProfile.profilePicture}` : '/images/default.jpg'} 
                                    alt={userProfile?.name || "User"} 
                                    className="profile-picture" 
                                /> */}
                                <p>Name: {userProfile?.name}</p>
                                <p>Email: {userProfile?.email}</p>
                                <p>Bio: {userProfile?.bio}</p>
                                <p>Status: {userProfile?.statusMessage}</p>
                                <button onClick={handleEditProfile} className="edit-profile-button">
                                    Edit Profile
                                </button>
                                <button onClick={logout} className="logout-button">Logout</button>
                            </div>
                        )}
                        
                        {editingProfile && (
                            <div className="edit-profile-form">
                                <label>
                                    Profile Picture:
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="profile-picture-input"
                                    />
                                </label>
                                <label>
                                    Name:
                                    <input
                                        type="text"
                                        name="name"
                                        value={profileUpdates.name}
                                        onChange={handleProfileChange}
                                    />
                                </label>
                                <label>
                                    Email:
                                    <input
                                        type="email"
                                        name="email"
                                        value={profileUpdates.email}
                                        onChange={handleProfileChange}
                                    />
                                </label>
                                <label>
                                    Bio:
                                    <textarea
                                        name="bio"
                                        value={profileUpdates.bio}
                                        onChange={handleProfileChange}
                                    ></textarea>
                                </label>
                                <label>
                                    Status:
                                    <input
                                        type="text"
                                        name="status"
                                        value={profileUpdates.statusMessage}
                                        onChange={handleProfileChange}
                                    />
                                </label>
                                <button onClick={handleProfileUpdate} className="save-profile-button">
                                    Save
                                </button>
                                <button onClick={() => setEditingProfile(false)} className="cancel-button">
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <div className='other-sections'>
                        <div className="sections-wrapper">
                                <div className="search-section" ref={searchRef}>
                                    <input
                                        type="text"
                                        placeholder="Search for a user"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input"
                                    />
                                    <button onClick={handleSearch} className="search-button">Search</button>

                                    {searchQuery && searchResults.length === 0 && (
                                        <p>No users found</p>
                                    )}

                                    {searchResults.length > 0 && (
                                        <ul>
                                            {searchResults.map((user) => (
                                                <li 
                                                    key={user._id}
                                                    onMouseEnter={() => setHoveredUser(user)}
                                                    onMouseLeave={() => setHoveredUser(null)}
                                                    className="search-result-item"
                                                >
                                                    {user.name}
                                                    {isFriend(user._id) ? (
                                                        <span> &#x1F91D; Already Friends</span>
                                                    ) : (
                                                        <button onClick={() => sendFriendRequest(user._id)} className="send-request-button">Send Friend Request</button>
                                                    )}

                                                    {hoveredUser && hoveredUser._id === user._id && (
                                                        <div className="user-profile-popup">
                                                            <img 
                                                                src={user.profilePicture ? `http://localhost:5000${user.profilePicture}` : '/images/default.jpg'} 
                                                                alt={user.name} 
                                                                className="profile-picture" 
                                                            />
                                                            <div className="profile-details">
                                                                <p><strong>Name:</strong> {user.name}</p>
                                                                <p><strong>Bio:</strong> {user.bio || 'No bio available'}</p>
                                                                <p><strong>Status:</strong> {user.statusMessage || 'No status available'}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>


                                <div className="friends-section" onClick={handleFriendsClick}>
                                        <img
                                        src='./images/friend.png'
                                        alt="Friends"
                                        className="my-friends"
                                        />
                                        {friendsVisible && (
                                            <div>
                                                {friends.length > 0 ? (
                                                    <ul>
                                                        {friends.map((friend) => (
                                                            <li key={friend._id} className="friend-item">
                                                                <img
                                                                    src={friend.profilePicture ? `http://localhost:5000${friend.profilePicture}` : '/images/default.jpg'}
                                                                    alt={friend.name}
                                                                    className="friend-profile-picture"
                                                                />
                                                                <div className="friend-details">
                                                                    <p> {friend.name} </p>
                                                                </div>
                                                                <button onClick={() => handleUnfriend(friend._id)} className="unfriend-button">
                                                                    Unfriend
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p>You have no friends yet.</p>
                                                )}
                                            </div>
                                        )}
                                </div>

                                <div className="friend-requests-icon-section" onClick = {handleRequestClick}>
                                        <img
                                        src='./images/request.png' 
                                        alt='request-icon'
                                        className='request-icon'
                                        />
                                    {friendRequestsVisible && (
                                        <div className="friend-requests-section">
                                            {friendRequests.length > 0 ? (
                                                <ul>
                                                    {friendRequests.map((request) => (
                                                        <li key={request._id} className="friend-request-item">
                                                            <img 
                                                                src={request.sender.profilePicture ? `http://localhost:5000${request.sender.profilePicture}` : '/images/default.jpg'}
                                                                alt={request.sender.name}
                                                                className="profile-picture"
                                                            />
                                                            <p>{request.sender.name} has sent you a friend request</p>
                                                            <button onClick={() => handleFriendRequest(request.sender._id, "accept")} className="accept-button">Accept</button>
                                                            <button onClick={() => handleFriendRequest(request.sender._id, "reject")} className="reject-button">Reject</button>
                                                            <button onClick={() => handleFriendRequest(request.sender._id, "delete")} className="delete-button">Delete</button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p>No friend requests</p>
                                            )}
                                        </div>
                                    )}
                                </div>    
                    </div>
                    
                
                        <div className="post-section">
                        <h3>Create a New Post</h3>
                            <div className="create-post">
                                
                                <textarea
                                    value={newPost.text}
                                    onChange={(e) => setNewPost({ ...newPost, text: e.target.value })}
                                    placeholder="What's on your mind?"
                                ></textarea>
                                                            {/* Custom Attachment Icon */}
                                <label htmlFor="file-input" className="attachment-icon">
                                    <img src="/images/image-attachment-icon.png" alt="Attachment" /> 
                                </label>
                                <input
                                    id='file-input'
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setNewPost({ ...newPost, image: e.target.files[0] })}
                                    style={{ display: "none" }}  // Hide the default file input
                                />
                                <button onClick={handleCreatePost}>Post</button>
                                
                            </div>
                            
                            <div className="your-posts">
                            <hr />
                                
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
                                            < hr />
                                            <div>
                                                <div className="author-details">
                                                    <img src={post.author && post.author.profilePicture ? `http://localhost:5000${post.author.profilePicture}` : '/images/default.jpg'} alt="author" className='author-pic'></img> 
                                                    <div className="author-name">
                                                        <strong>{post.author ? post.author.name : 'Unknown Author' }</strong>    
                                                    </div>
                                                </div>
                                                <p>{post.author ?  post.content.text : 'text'}</p>

                                                <div className="image">
                                                {post.content && post.content.image &&(
                                                    <img src={`http://localhost:5000${post.content.image}`} alt="Post" className='post-image'/>
                                                )}
                                                </div>
                                                
                                                </div>
                                                <div className='like-comment'>
                                                    <div className="like">
                                                        <button onClick={() => handleLikePost(post._id) } className="like-button">
                                                        <img src="/images/like-icon.png" alt="Like" className='like-icon'/> 
                                                        ({post.likes ? post.likes.length: 0})
                                                        </button>
                                                    </div>
                                                    
                                                    
                                                    

                                                <div className='comment'>
                                                    <div className="comment-button">
                                                    <button 
                                                    onClick={() => toggleCommentsVisibility(post._id)} 
                                                    className="comment-icon-button"
                                                    >
                                                        <img src="/images/comment-icon.png" alt="Comment" className="comment-icon"/> 
                                                    </button>
                                                    </div>
                                                    
                                                    <div className="comment-list">
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
                                                    
                                                </div>
                                                <div className="delete">
                                                {post.author._id === user._id && (
                                                    <button className="delete-button" onClick={() => handleDeletePost(post._id)}> 
                                                       <img src="/images/delete-icon.png" alt="" className='delete-post-icon' />
                                                    </button>
                                                  )}   
                                                    </div>
                                            </div>
                                                
                                        </div>
                                        );
                                    }
                                )
            )}
                            </div>
                            
                        </div>
                        
                </div>
                <div className="conversations-section">
                        
                        <div className="conversations-list">
                        <img 
                                    src='./images/inbox.png'
                                    alt='inbox'
                                    className='inbox-icon'
                                    />
                            <h3>Conversations</h3> 
                            
                            {conversations && conversations.length > 0 ? (
                                <ul>
                                {conversations.map((conv) => {
                                    if (!conv._id || !conv.participants) {
                                        console.error('Conversation data is incomplete:', conv);
                                        return null;
                                    }
                                    return (
                                    <li
                                        key={conv._id}
                                        className={`conversation-item ${selectedConversation?._id === conv._id ? 'active' : ''}`}
                                        onClick={() => {
                                            console.log('Conversation clicked:', conv);
                                            setSelectedConversation(conv);
                                            fetchMessages(conv._id);
                                        }}
                                    >
                                    <p><strong>{(conv.participants || []).map(participant => participant.name).join(', ')}</strong></p>
                                    {/* <button onClick={() => deleteConversation(conv._id)} className="delete-conversation-button">
                                        Delete
                                    </button> */}
                                    <img
                                    src='/images/delete-icon.png'
                                    alt='Delete conversation'
                                    className='delete-conversation'
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent triggering the parent onClick
                                        deleteConversation(conv._id);}
                                    }
                                    />
                                    </li>
                                    );
                                })}
                                </ul>
                            ) : (
                                <p>No conversations found.</p>
                            )}
                        </div>

                        <div className="messages-section">
                            {/* Send a Message Section */}
                            <div className="message-icon-section"  onClick={handleInboxClick}>
                                    <h3>Send a new Message</h3>
                                    
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

                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type message here..."
                                        className="message-textarea"
                                    ></textarea>
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!selectedFriend || !newMessage}
                                        className="send-button"
                                    >
                                    Send
                                    </button>

                                    {/* <img
                                    src='/images/send-icon.png'
                                    alt='send-message'
                                    className='send-button'
                                    onClick={(e)=> {
                                        e.stopPropagation();
                                        
                                        if (selectedFriend && newMessage) {
                                            handleSendMessage();
                                        }
                                    } } /> */}
                            </div>
                            <hr />
                        <div className='conv-preview'>
                        < hr />
                        {selectedConversation ? (
                            <>
                            <h3>
                                Messages with  <br></br>
                                {selectedConversation?.participants?.find(participant => participant._id !== user._id)?.name || 'Unknown'}
                            </h3>
                            <div className="messages-list">
                                {Array.isArray(messages) && messages.length > 0 ? (
                                messages.map((msg) => {
                                    if (!msg || !msg.sender) {
                                        console.error('Invalid message or missing sender:', msg);
                                        return null; // Skip invalid messages
                                    }
                                    return (
                                        <div
                                            key={msg._id}
                                            className={`message-item ${msg.sender._id === user._id ? "sent" : "received"}`}
                                        >
                                            <p>{msg.content}</p>
                                            {msg.sender._id === user._id && ( // Only allow deletion for sender
                                            // <button onClick={() => deleteMessage(msg._id)} className="delete-button">
                                            //     🗑️
                                            // </button>
                                            <img 
                                            src='/images/delete-icon.png'
                                            alt='delete message'
                                            className='delete-msg'
                                            onClick={(e)=>{
                                                e.stopPropagation();
                                                deleteMessage(msg._id)
                                            }}
                                            />
                                            )}
                                        </div>
                                    );
                                })
                                ) : (
                                <p>No messages yet.</p>
                                )}
                            </div>
                            <div className="message-input">
                                <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                />
                                {/* <img
                                    src='/images/send-icon.png'
                                    alt='send-message'
                                    className='send-button'
                                    onClick={(e)=> {
                                        e.stopPropagation();
                                        
                                        if (selectedFriend && newMessage) {
                                            handleSendMessage();
                                        }
                                    } } /> */}
                                <button onClick={handleSendMessage} className='send-button'>Send</button>
                            </div>
                            </>
                            ) : (
                            <p>Select a conversation to view messages.</p>
                            )}
                        </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
export default Home;
