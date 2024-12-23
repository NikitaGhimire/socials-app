import React, { useState, useEffect, useCallback } from 'react';
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
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [hoveredUser, setHoveredUser] = useState(null);
    const [sendMessageVisible, setSendMessageVisible] = useState(false);
    const [friendRequestsVisible, setFriendRequestsVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingProfile, setEditingProfile] = useState(false);
    const [userProfile, setUserProfile] = useState({});
    const [friendsVisible, setFriendsVisible] = useState(false);
    const [profileUpdates, setProfileUpdates] = useState({
        name: user?.name || '',
        email: user?.email || '',
        bio: user?.bio || '',
        statusMessage: user?.statusMessage || '',
        profilePicture: null,
    });

    const navigate = useNavigate();

        const fetchUserData = useCallback(async () => {
            try {
                console.log("Fetching user data...");
                setLoading(true);
    
                // Fetch friends
                const response = await api.get("/friends/myfriends");
                console.log("Fetched friends:", response.data);
                setFriends(response.data.uniqueFriends);
    
                // Fetch friend requests
                const requestsResponse = await api.get("/friends/requests");
                console.log("Fetched friend requests:", requestsResponse.data);
                setFriendRequests(requestsResponse.data.friendRequests);
    
                // Fetch user profile details
                const profileResponse = await api.get("/users/profile");
                console.log("Fetched profile:", profileResponse.data);
                if (profileResponse.status === 200) {
                    setUserProfile(profileResponse.data); 
                }
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
        
        }, [user, navigate, fetchUserData]);

    

    const handleSendMessage = async () => {
        if (!selectedFriend || !message) return;

        try {
            await api.post("/messages/sendMessage", { receiverId: selectedFriend, content: message });
            setMessage('');
            alert('Message sent!');
        } catch (err) {
            console.error("Error sending message", err);
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
    
    // Function to fetch the updated profile details
    const fetchUserProfile = async () => {
        try {
            const response = await api.get("/users/profile"); // Adjust the endpoint as needed
            if (response.status === 200) {
                updateUser(response.data); // Update the local state with the latest user data
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        }
    };

    const handleProfileUpdate = async () => {
        const formData = new FormData();
        formData.append("name", profileUpdates.name || user.name);
        formData.append("bio", profileUpdates.bio || user.bio);
        formData.append("statusMessage", profileUpdates.statusMessage || user.statusMessage);
        if (profileUpdates.profilePicture) {
            formData.append("profilePicture", profileUpdates.profilePicture);
        }

        try {
            const response = await api.put("/users/update-profile", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const updatedUser = response.data;

            fetchUserProfile();

            // Persist the updated user data in localStorage
            localStorage.setItem("user", JSON.stringify(updatedUser));

            alert("Profile updated successfully!");
            setEditingProfile(false);
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
            } else if (action === "reject") {
                setFriendRequests(prevRequests => prevRequests.filter(request => request.sender._id !== senderId));
            }
        }

        alert(response.data.message);
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
                // fetchFriends();
                setFriends((prevFriends) => prevFriends.filter(friend => friend._id !== friendId));
            } else {
                console.error("Failed to unfriend");
            }
        } catch (error) {
            console.error("Error unfriending:", error);
        }
    };
    
    //     // Function to fetch the updated list of friends
    // const fetchFriends = async () => {
    //     try {
    //         const response = await api.get("/friends/myfriends");
    //         if (response.status === 200) {
    //             setFriends(response.data.uniqueFriends); // Update the state with the latest friends list
    //         }
    //     } catch (error) {
    //         console.error("Error fetching friends:", error);
    //     }
    // };

    const handleInboxClick = () => {
        setSendMessageVisible(!sendMessageVisible);
    };
    const handleRequestClick = () => {
        setFriendRequestsVisible(!friendRequestsVisible);
    };

    return (
        <div className="home-container">
            {loading ? (
                <div>Loading...</div>
            ) : (
                <>
                    <div className="profile-section" onClick={handleProfileClick}>
                        <img 
                            src={userProfile?.profilePicture ? `{userProfile.profilePicture}` : '/images/default.jpg'}
                            alt={userProfile?.name || "User"} 
                            className="profile-picture" 
                        />
                        {profileVisible && !editingProfile && (
                            <div className="profile-details">
                                <img 
                                    src={userProfile?.profilePicture ?`http://localhost:5000${user.profilePicture}` : '/images/default.jpg'} 
                                    alt={userProfile?.name || "User"} 
                                    className="profile-picture" 
                                />
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

                    <div className="sections-wrapper">
                            <div className="search-section">
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


                        <div className="message-icon-section" onClick={handleInboxClick}>
                            <img 
                            src='./images/inbox.png'
                            alt='inbox'
                            className='inbox-icon'
                            />
                            {sendMessageVisible && (
                                <div className="send-message-section">
                                    <select 
                                        value={selectedFriend || ""} 
                                        onChange={(e) => setSelectedFriend(e.target.value)} 
                                        className="friend-select"
                                    >
                                        <option value="">Select a Friend</option>
                                        {Array.isArray(friends) && friends.length > 0 && friends.map((friend) => (
                                            <option key={friend._id} value={friend._id}>
                                                {friend.name}
                                            </option>
                                        ))}
                                    </select>

                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type your message here"
                                        className="message-textarea"
                                    />

                                    <button onClick={handleSendMessage} className="send-button">Send</button>
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
                </>
            )}
        </div>
    );
};

export default Home;
