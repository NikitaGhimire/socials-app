# Social Messaging Platform

A full-stack social messaging application that combines social networking features with communication capabilities.

## 🚀 Features

### Authentication & User Management
- User registration and JWT-based authentication
- Profile customization with pictures and status updates
- Secure password handling and protected routes

### Social Features
- Send and manage friend requests
- Search for other users
- View and manage friend lists
- Friend management system

### Posts & Interactions
- Create text and image posts
- Like and comment on posts
- Post visibility control (posts visible to friends only)
- Chronological news feed from friends

### Messaging
- Private conversations
- Message history
- Chat window minimization
- Conversation management

## 🛠 Technology Stack

### Frontend
- React.js
- Axios for API calls
- CSS3 for styling
- Context API for state management

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads

## 📦 Installation

1. Clone the repository
```bash
git clone <repository-url>
```

2. Install dependencies for backend
```bash
cd backend
npm install
```

3. Install dependencies for frontend
```bash
cd frontend
npm install
```

4. Create a .env file in the backend directory with the following variables:
```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
```

5. Start the backend server
```bash
cd backend
npm start
```

6. Start the frontend development server
```bash
cd frontend
npm start
```

## 🔧 Configuration

### Backend Configuration
- MongoDB connection settings in `/backend/src/config/db.js`
- JWT configuration in `/backend/src/middleware/authMiddleware.js`
- File upload settings in `/backend/src/middleware/uploadMiddleware.js`

### Frontend Configuration
- API base URL in `/frontend/src/utils/api.js`
- Socket.io configuration in `/frontend/src/context/SocketContext.js`

## 📱 Usage

1. Register a new account or login
2. Update your profile with picture and status
3. Search for friends and send friend requests
4. Create posts with text and images
5. Interact with friends' posts
6. Start private conversations

## 🔐 Security Features

- Protected API routes
- JWT authentication
- Password hashing
- Secure file uploads
- CORS protection
- Input validation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE.md file for details

## ✨ Future Enhancements

- Real-time messaging with Socket.io
- Group chat functionality
- Voice and video calls
- Post sharing capability
- Enhanced notification system
- Mobile app version
- Real-time status updates
- Message read receipts

## 👥 Contact

Nikita Ghimiree - nikitaghimire1@gmail.com

Project Link: https://github.com/NikitaGhimire/socials-app.git
