# 🎬 VideoTweetApp

A full-featured **Video Streaming & Social Backend** — a production-ready REST API that supports video uploading, user authentication, tweets, comments, likes, subscriptions, and playlists.

> 🚀 **Live API:** [https://videotweetapp-production.up.railway.app](https://videotweetapp-production.up.railway.app)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)

---

## ✨ Features

- 🔐 JWT-based Authentication (Access + Refresh Tokens)
- 📧 Forget Password via OTP (Nodemailer)
- 🎥 Video Upload & Streaming (Cloudinary)
- 🖼️ Avatar & Cover Image Upload
- 🐦 Tweet System (Create, Update, Delete)
- 💬 Comments on Videos
- ❤️ Like/Unlike Videos, Comments & Tweets
- 📋 Playlist Management
- 📊 Channel Stats & Dashboard
- 🔔 Subscribe / Unsubscribe to Channels
- 📜 Watch History Tracking
- 🔒 Protected Routes with Middleware

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB** | Database |
| **Mongoose** | ODM for MongoDB |
| **JWT** | Authentication |
| **Cloudinary** | Media storage (videos, images) |
| **Multer** | File upload handling |
| **Nodemailer** | Email service (OTP) |
| **Bcrypt** | Password hashing |
| **Railway** | Deployment |

---

## 📁 Project Structure

```
VideoTweetApp/
├── public/
│   └── temp/              # Temporary file storage before Cloudinary upload
├── src/
│   ├── controllers/       # Route handler logic
│   │   ├── user.controller.js
│   │   ├── video.controller.js
│   │   ├── tweet.controller.js
│   │   ├── comment.controller.js
│   │   ├── like.controller.js
│   │   ├── playlist.controller.js
│   │   ├── subscription.controller.js
│   │   └── dashboard.controller.js
│   ├── models/            # Mongoose schemas
│   │   ├── user.model.js
│   │   ├── video.model.js
│   │   ├── tweet.model.js
│   │   ├── comment.model.js
│   │   ├── like.model.js
│   │   ├── playlist.model.js
│   │   └── subscription.model.js
│   ├── routes/            # Express routers
│   │   ├── user.routes.js
│   │   ├── video.routes.js
│   │   ├── tweet.routes.js
│   │   ├── comment.routes.js
│   │   ├── like.routes.js
│   │   ├── playlist.routes.js
│   │   ├── subscription.routes.js
│   │   └── dashboard.routes.js
│   ├── middlewares/
│   │   ├── auth.middleware.js    # JWT verification
│   │   └── multer.middleware.js  # File upload
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   ├── cloudinary.js
│   │   └── sendEmail.js
│   ├── db/
│   │   └── index.js       # MongoDB connection
│   ├── constants.js
│   └── index.js           # App entry point
├── .gitignore
├── .prettierrc
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account
- Cloudinary account

### Installation

```bash
# Clone the repository
git clone https://github.com/vanshsoni916/VideoTweetApp.git

# Navigate into the project
cd VideoTweetApp

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
# Fill in your environment variables

# Start development server
npm run dev
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=8000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net
DB_NAME=videotweetapp
CORS_ORIGIN=*

JWT_ACCESS_SECRET=your_access_token_secret
JWT_ACCESS_EXPIRY=1d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

EMAIL=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

---

## 📡 API Endpoints

**Base URL:** `https://videotweetapp-production.up.railway.app/api/v1`

### 👤 User Routes `/api/v1/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register new user |
| POST | `/login` | ❌ | Login user |
| POST | `/logout` | ✅ | Logout user |
| POST | `/refresh-token` | ❌ | Refresh access token |
| GET | `/current-user` | ✅ | Get current user |
| PATCH | `/update-account` | ✅ | Update account details |
| PATCH | `/change-password` | ✅ | Change password |
| PATCH | `/avatar` | ✅ | Update avatar |
| PATCH | `/cover-image` | ✅ | Update cover image |
| GET | `/c/:username` | ✅ | Get channel profile |
| GET | `/history` | ✅ | Get watch history |
| POST | `/forget-password` | ❌ | Send OTP to email |
| POST | `/reset-password` | ❌ | Reset password with OTP |

### 🎥 Video Routes `/api/v1/videos`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | Get all videos |
| POST | `/` | ✅ | Upload new video |
| GET | `/:videoId` | ✅ | Get video by ID |
| PATCH | `/:videoId` | ✅ | Update video details |
| DELETE | `/:videoId` | ✅ | Delete video |
| PATCH | `/toggle/publish/:videoId` | ✅ | Toggle publish status |

### 🐦 Tweet Routes `/api/v1/tweets`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✅ | Create tweet |
| GET | `/user/:userId` | ✅ | Get user tweets |
| PATCH | `/:tweetId` | ✅ | Update tweet |
| DELETE | `/:tweetId` | ✅ | Delete tweet |

### 💬 Comment Routes `/api/v1/comments`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/:videoId` | ✅ | Get video comments |
| POST | `/:videoId` | ✅ | Add comment |
| PATCH | `/c/:commentId` | ✅ | Update comment |
| DELETE | `/c/:commentId` | ✅ | Delete comment |

### ❤️ Like Routes `/api/v1/likes`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/toggle/v/:videoId` | ✅ | Toggle video like |
| POST | `/toggle/c/:commentId` | ✅ | Toggle comment like |
| POST | `/toggle/t/:tweetId` | ✅ | Toggle tweet like |
| GET | `/videos` | ✅ | Get liked videos |

### 📋 Playlist Routes `/api/v1/playlists`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✅ | Create playlist |
| GET | `/:playlistId` | ✅ | Get playlist by ID |
| PATCH | `/:playlistId` | ✅ | Update playlist |
| DELETE | `/:playlistId` | ✅ | Delete playlist |
| POST | `/add/:videoId/:playlistId` | ✅ | Add video to playlist |
| DELETE | `/remove/:videoId/:playlistId` | ✅ | Remove video from playlist |
| GET | `/user/:userId` | ✅ | Get user playlists |

### 🔔 Subscription Routes `/api/v1/subscriptions`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/c/:channelId` | ✅ | Toggle subscription |
| GET | `/c/:channelId` | ✅ | Get channel subscribers |
| GET | `/u/:subscriberId` | ✅ | Get subscribed channels |

### 📊 Dashboard Routes `/api/v1/dashboard`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/stats` | ✅ | Get channel stats |
| GET | `/videos` | ✅ | Get channel videos |

---

## ☁️ Deployment

This project is deployed on **Railway**.

```bash
# Production start command
node --experimental-json-modules src/index.js
```

Environment variables are configured directly in the Railway dashboard.

---

## 👨‍💻 Author

**Vansh Soni**
- GitHub: [@vanshsoni916](https://github.com/vanshsoni916)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
