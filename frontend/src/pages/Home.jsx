import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContex';
import api from '../services/api';
import '../styles/pages/home.css';

const NavigationBar = lazy(() => import('../components/NavigationBar'));
const CreatePost = lazy(() => import('../components/CreatePost'));
const UserProfile = lazy(() => import ('../components/UserProfile'));
const FriendList = lazy(() => import ('../components/FriendList'));
const FriendRequests = lazy(() => import ('../components/FriendRequests'));
const ChatWindow = lazy(() => import ('../components/ChatWindow'));
const PostFeed = lazy(() => import ('../components/PostFeed'));
const SearchResults = lazy(() => import('../components/SearchResults'));

export const API_URL = process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:5001';

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

    const [pendingRequests, setPendingRequests] = useState([]);

    const navigate = useNavigate();

    const fetchUserData = useCallback(async () => {
        try {
            setLoading(true);
    
            // Fetch all data concurrently using Promise.all
            const [friendsResponse, requestsResponse, profileResponse, conversationsResponse, postsResponse, sentRequestsResponse] = await Promise.all([
                api.get("/friends/myfriends"),
                api.get("/friends/requests"),
                api.get("/users/profile"),
                api.get("/messages/chats"),
                api.get("/posts"),
                api.get("/friends/sentRequests"),
            ]);
    
            // Handle friends
            setFriends(friendsResponse.data.uniqueFriends);
    
            // Handle friend requests
            setFriendRequests(requestsResponse.data.friendRequests);
    
            // Handle user profile
            if (profileResponse.status === 200) {
                setUserProfile(profileResponse.data);
            }
    
            // Handle conversations
            setConversations(conversationsResponse.data || []);

            // Handle posts
            setPosts(postsResponse.data || []);
            setLoadingPosts(false); 

            // Handle sent friend requests (pending requests)
            const pendingRequestIds = sentRequestsResponse.data.sentRequests?.map(request => request.receiver._id) || [];
            setPendingRequests(pendingRequestIds);
    
        } catch (err) {
            console.error("Error fetching data", err.response ? err.response.data : err.message);
        } finally {
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

            setSearchResults(response.data.users || []);
            setShowSearchOverlay(true);
        } catch (err) {
            console.error("Error searching users:", err);
            setSearchResults([]);
            setShowSearchOverlay(true);
        }
    };

    // Fetch messages for a selected conversation
    const fetchMessages = async (conversationId) => {
        try {
            const response = await api.get(`/messages/${conversationId}`);
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

            // Check if users are still friends
            const isStillFriends = friends.some(friend => friend._id === receiverId);
            if (!isStillFriends) {
                alert('You can no longer send messages to this user as you are not friends.');
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
        try {
            const formData = new FormData();
            formData.append("name", profileUpdates.name || user.name);
            formData.append("bio", profileUpdates.bio || user.bio);
            formData.append("statusMessage", profileUpdates.statusMessage || user.statusMessage);
            
            if (profileUpdates.profilePicture) {
                // Check file size
                if (profileUpdates.profilePicture.size > 5 * 1024 * 1024) {
                    alert("File size too large. Please choose an image under 5MB");
                    return;
                }
                formData.append("profilePicture", profileUpdates.profilePicture);
            }

            const response = await api.put("/users/update-profile", formData, {
                headers: { 
                    "Content-Type": "multipart/form-data"
                }
            });

            if (response.data) {
                setUserProfile(response.data);
                localStorage.setItem("user", JSON.stringify(response.data));
                alert("Profile updated successfully!");
                setEditingProfile(false);
                setProfileUpdates({ ...profileUpdates, profilePicture: null });
            }
        } catch (err) {
            console.error("Error updating profile", err);
            alert(err.response?.data?.message || "Error updating profile. Please try again.");
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                alert("File size too large. Please choose an image under 5MB");
                e.target.value = ''; // Clear the file input
                return;
            }
            // Check file type
            if (!file.type.startsWith('image/')) {
                alert("Please select an image file");
                e.target.value = '';
                return;
            }
            setProfileUpdates({ ...profileUpdates, profilePicture: file });
        }
    };

    const sendFriendRequest = async (friendId) => {
        const token = localStorage.getItem('token');
    
        if (!token) {
            alert("Authentication token missing. Please log in again.");
            return;
        }
    
        try {
            await api.post(
                `/friends/send`,
                { userId: friendId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
    
            alert("Friend request sent!");
            setPendingRequests(prev => [...prev, friendId]);
        } catch (err) {
            console.error("Error sending friend request:", err);
    
            if (err.response) {
                alert(`Error: ${err.response.data.message || "Failed to send friend request."}`);
            } else {
                alert("An unexpected error occurred. Please try again later.");
            }
        }
    };
    

    const isFriend = (friendId) => {
        return friends.some(friend => friend._id === friendId);
    };

    const isPendingRequest = (userId) => {
        return pendingRequests.includes(userId);
    };

    const handleProfileClick = () => {
        if (!editingProfile) {
            setShowProfileOverlay(!showProfileOverlay);
            setProfileVisible(!profileVisible);
        }
    };

    const handleProfileChange = (e) => {
        setProfileUpdates({ ...profileUpdates, [e.target.name]: e.target.value });
    };
    const handleFriendRequest = async (requestId, action) => {
        try {
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
                // update the local friend list by filtering out the unfriended user
                setFriends((prevFriends) => prevFriends.filter(friend => friend._id !== friendId));
                alert("Friend removed successfully!");
            } else {
                console.error("Failed to unfriend");
            }
        } catch (error) {
            console.error("Error unfriending:", error);
            alert("Failed to unfriend user");
        }
    };

    const cancelFriendRequest = async (userId) => {
        try {
            const response = await api.post("/friends/cancel-request", { userId });
            
            if (response.status === 200 && response.data.success) {
                setPendingRequests(prev => prev.filter(id => id !== userId));
                alert("Friend request canceled!");
            } else {
                alert("Failed to cancel friend request");
            }
        } catch (error) {
            console.error("Error canceling friend request:", error);
            alert(`Failed to cancel friend request: ${error.response?.data?.message || error.message}`);
        }
    };

    const startChatWithUser = async (friendId) => {
        try {
            // First, check if a conversation already exists
            const existingConversation = conversations.find(conv => 
                conv.participants.some(p => p._id === friendId)
            );

            if (existingConversation) {
                // If conversation exists, select it and show chat
                setSelectedConversation(existingConversation);
                setSelectedFriend(friendId);
                await fetchMessages(existingConversation._id);
            } else {
                // If no conversation exists, create one by selecting the friend
                setSelectedFriend(friendId);
                setSelectedConversation(null);
                setMessages([]);
            }
            
            setIsChatVisible(true);
            setShowSearchOverlay(false); // Close search overlay
        } catch (error) {
            console.error("Error starting chat:", error);
            alert("Failed to start chat");
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
                    userProfile={userProfile}
                    onProfileClick={handleProfileClick}
                    onSearchClick={() => setSearchResults([])}
                    onFriendsClick={handleFriendsClick}
                    onRequestsClick={handleRequestClick}
                    onConversationsClick={() => setIsChatVisible(!isChatVisible)}
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
                            {showSearchOverlay && (
                                <SearchResults 
                                    searchResults={searchResults}
                                    setShowSearchOverlay={setShowSearchOverlay}
                                    API_URL={API_URL}
                                    isFriend={isFriend}
                                    isPendingRequest={isPendingRequest}
                                    sendFriendRequest={sendFriendRequest}
                                    cancelFriendRequest={cancelFriendRequest}
                                    unfriendUser={handleUnfriend}
                                    startChatWithUser={startChatWithUser}
                                />
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

                            {/* Main Content */}
                            <main className="main-content">
                                <div className="animated-background">
                                    <div className="shape shape1"></div>
                                    <div className="shape shape2"></div>
                                    <div className="shape shape3"></div>
                                    <div className="shape shape4"></div>
                                </div>
                                
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
                            </main>

                        </>
                    )} </>
                ):(<p> Navigate to login </p>)}

                
            </div>
        </Suspense>
    );
};
export default Home;
