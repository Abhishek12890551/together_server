<div align="left">

# 🚀 Together Server API

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.1.0-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v8.14.0-green.svg)](https://mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-v4.8.1-orange.svg)](https://socket.io/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

**A comprehensive real-time social productivity platform backend**

_Empowering connections, productivity, and collaboration through seamless real-time communication_

[📚 Documentation](#-documentation) • [🚀 Quick Start](#-quick-start) • [🔧 API Reference](#-api-reference) • [👨‍💻 Developer](#-developer)

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [🔧 API Reference](#-api-reference)
- [🌐 Socket.IO Events](#-socketio-events)
- [🔒 Authentication](#-authentication)
- [📁 Project Structure](#-project-structure)
- [🔐 Security](#-security)
- [👨‍💻 Developer](#-developer)
- [📄 License](#-license)

---

## ✨ Features

<div align="center">

| 🔐 **Authentication** | 💬 **Messaging** | 🤝 **Social**    | ✅ **Productivity** |
| --------------------- | ---------------- | ---------------- | ------------------- |
| JWT Authentication    | Real-time Chat   | User Connections | Todo Management     |
| Email Verification    | Group Messaging  | Friend Requests  | Event Scheduling    |
| Profile Management    | File Sharing     | Contact System   | Task Organization   |

</div>

### 🔐 Authentication & User Management

- ✅ User registration with email verification
- ✅ Secure login/logout with JWT tokens
- ✅ Email verification with temporary codes
- ✅ Profile image upload with Cloudinary integration
- ✅ Online/offline status tracking
- ✅ Complete profile management

### 💬 Real-time Messaging

- ✅ One-on-one conversations
- ✅ Group chat functionality
- ✅ Real-time message delivery with Socket.IO
- ✅ Message history and conversation management
- ✅ Group member management (add/remove members)
- ✅ Group image uploads

### 🤝 Social Connections

- ✅ User search functionality
- ✅ Send/receive connection requests
- ✅ Accept/decline connection requests
- ✅ Contact management
- ✅ Real-time connection status updates

### ✅ Task Management

- ✅ Create and manage todo lists
- ✅ Todo items with completion status
- ✅ Update and delete todos
- ✅ Individual todo item management

### 📅 Event Management

- ✅ Create, update, and delete events
- ✅ Event scheduling with start/end dates
- ✅ Location and description support
- ✅ User-specific event management

### 📋 Schedule Management

- ✅ Personal schedule creation and management
- ✅ Schedule CRUD operations

## 🛠️ Tech Stack

<div align="center">

| Category           | Technologies                                                                                                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime**        | ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)                                                                                                    |
| **Framework**      | ![Express.js](https://img.shields.io/badge/Express.js-404D59?style=flat&logo=express&logoColor=white)                                                                                              |
| **Database**       | ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white) ![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=flat&logo=mongoose&logoColor=white) |
| **Real-time**      | ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=flat&logo=socket.io&badgeColor=010101)                                                                                             |
| **Authentication** | ![JWT](https://img.shields.io/badge/JWT-black?style=flat&logo=JSON%20web%20tokens) ![bcrypt](https://img.shields.io/badge/bcrypt-blue?style=flat)                                                  |
| **Cloud Storage**  | ![Cloudinary](https://img.shields.io/badge/Cloudinary-blue?style=flat&logo=cloudinary&logoColor=white)                                                                                             |
| **Email**          | ![Nodemailer](https://img.shields.io/badge/Nodemailer-0F9DCE?style=flat)                                                                                                                           |
| **Validation**     | ![Validator](https://img.shields.io/badge/Validator.js-green?style=flat)                                                                                                                           |

</div>

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd together_server

# 2. Install dependencies
npm install

# 3. Set up environment variables (see Configuration section)
cp .env.example .env
# Edit .env with your configuration

# 4. Start the development server
npm run dev
```

<div align="center">

🎉 **Server running at** `http://localhost:5000`

</div>

---

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables:

```env
# 🗄️ Database Configuration
MONGODB_URI=mongodb://localhost:27017/together_db

# 🔐 Authentication
JWT_SECRET=your_super_secure_jwt_secret_key_here

# 🌐 Server Configuration
PORT=5000
NODE_ENV=development

# 📧 Email Configuration (for verification emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# ☁️ Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 🚀 Running the Application

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start

# Available Scripts
npm test    # Run tests (placeholder)
```

---

## 🔧 API Reference

<div align="center">

**Base URL:** `http://localhost:5000/api`

</div>

<details>
<summary><strong>🔐 Authentication Endpoints</strong> <code>/api/auth</code></summary>

| Method | Endpoint               | Description               | Auth Required |
| ------ | ---------------------- | ------------------------- | ------------- |
| `POST` | `/register`            | Register a new user       | ❌            |
| `POST` | `/login`               | User login                | ❌            |
| `POST` | `/verify-email`        | Verify email with code    | ❌            |
| `POST` | `/resend-verification` | Resend verification email | ❌            |

</details>

<details>
<summary><strong>👤 User Management</strong> <code>/api/users</code></summary>

| Method | Endpoint                | Description            | Auth Required |
| ------ | ----------------------- | ---------------------- | ------------- |
| `GET`  | `/profile`              | Get user profile       | ✅            |
| `PUT`  | `/profile`              | Update user profile    | ✅            |
| `POST` | `/upload-profile-image` | Upload profile image   | ✅            |
| `GET`  | `/contact/:contactId`   | Get contact profile    | ✅            |
| `POST` | `/online`               | Mark user as online    | ✅            |
| `POST` | `/offline`              | Mark user as offline   | ✅            |
| `GET`  | `/status/:userId`       | Get user online status | ✅            |

</details>

<details>
<summary><strong>🤝 Social Connections</strong> <code>/api/connections</code></summary>

| Method | Endpoint    | Description                   | Auth Required |
| ------ | ----------- | ----------------------------- | ------------- |
| `GET`  | `/search`   | Search for users              | ✅            |
| `POST` | `/request`  | Send connection request       | ✅            |
| `POST` | `/respond`  | Respond to connection request | ✅            |
| `GET`  | `/requests` | Get connection requests       | ✅            |
| `GET`  | `/contacts` | Get user contacts             | ✅            |

</details>

<details>
<summary><strong>💬 Conversations</strong> <code>/api/conversations</code></summary>

| Method   | Endpoint                    | Description                          | Auth Required |
| -------- | --------------------------- | ------------------------------------ | ------------- |
| `GET`    | `/`                         | Get user conversations               | ✅            |
| `GET`    | `/find/:otherUserId`        | Find conversation with specific user | ✅            |
| `POST`   | `/group`                    | Create group conversation            | ✅            |
| `GET`    | `/:conversationId`          | Get conversation by ID               | ✅            |
| `GET`    | `/:conversationId/messages` | Get conversation messages            | ✅            |
| `POST`   | `/add-member`               | Add member to group                  | ✅            |
| `POST`   | `/remove-member`            | Remove member from group             | ✅            |
| `POST`   | `/leave-group`              | Leave group                          | ✅            |
| `DELETE` | `/:id`                      | Delete group conversation            | ✅            |
| `POST`   | `/update-group-image`       | Update group image                   | ✅            |

</details>

<details>
<summary><strong>✅ Todo Management</strong> <code>/api/todos</code></summary>

| Method   | Endpoint             | Description       | Auth Required |
| -------- | -------------------- | ----------------- | ------------- |
| `GET`    | `/`                  | Get user todos    | ✅            |
| `POST`   | `/`                  | Create new todo   | ✅            |
| `GET`    | `/:id`               | Get specific todo | ✅            |
| `PUT`    | `/:id`               | Update todo       | ✅            |
| `DELETE` | `/:id`               | Delete todo       | ✅            |
| `PUT`    | `/:id/items/:itemId` | Update todo item  | ✅            |

</details>

<details>
<summary><strong>📅 Event Management</strong> <code>/api/events</code></summary>

| Method   | Endpoint | Description        | Auth Required |
| -------- | -------- | ------------------ | ------------- |
| `GET`    | `/`      | Get user events    | ✅            |
| `POST`   | `/`      | Create new event   | ✅            |
| `GET`    | `/:id`   | Get specific event | ✅            |
| `PUT`    | `/:id`   | Update event       | ✅            |
| `DELETE` | `/:id`   | Delete event       | ✅            |

</details>

<details>
<summary><strong>📋 Schedule Management</strong> <code>/api/schedules</code></summary>

| Method   | Endpoint | Description         | Auth Required |
| -------- | -------- | ------------------- | ------------- |
| `GET`    | `/`      | Get user schedules  | ✅            |
| `POST`   | `/`      | Create new schedule | ✅            |
| `PUT`    | `/:id`   | Update schedule     | ✅            |
| `DELETE` | `/:id`   | Delete schedule     | ✅            |

</details>

---

## 🌐 Socket.IO Events

<div align="center">

**Real-time communication powered by Socket.IO**

</div>

### 🔌 Connection Events

- ✅ User authentication on socket connection
- ✅ Online/offline status updates
- ✅ Socket ID management

### 💬 Messaging Events

- ✅ Real-time message delivery
- ✅ Conversation updates
- ✅ Group chat notifications

---

## 🔒 Authentication

All protected routes require a Bearer token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

<div align="center">

🔑 **Tokens are issued upon successful login/registration and are valid for 28 days**

</div>

### 📤 File Uploads

The application supports file uploads for:

- 🖼️ Profile images (`/api/users/upload-profile-image`)
- 🖼️ Group images (`/api/conversations/update-group-image`)

Files are stored using **Cloudinary** for cloud storage and optimization.

### ⚠️ Error Handling

The application includes comprehensive error handling:

- ✅ Input validation errors
- ✅ Authentication errors
- ✅ Database errors
- ✅ File upload errors
- ✅ Socket connection errors

All errors return a consistent JSON format:

```json
{
  "success": false,
  "message": "Error description",
  "field": "fieldName" // (optional, for validation errors)
}
```

---

## 📁 Project Structure

```
together_server/
├── 📁 config/
│   └── db.js                 # Database configuration
├── 📁 controllers/
│   ├── authController.js     # Authentication logic
│   ├── connectionController.js # Connection management
│   ├── contactController.js  # Contact operations
│   ├── conversationController.js # Messaging logic
│   ├── eventController.js    # Event management
│   ├── scheduleController.js # Schedule operations
│   ├── todoController.js     # Todo management
│   └── userController.js     # User operations
├── 📁 middlewares/
│   ├── authMiddleware.js     # JWT authentication
│   └── multer.js            # File upload configuration
├── 📁 models/
│   ├── conversationModel.js # Chat/messaging schema
│   ├── eventModel.js        # Event schema
│   ├── scheduleModel.js     # Schedule schema
│   ├── todoModel.js         # Todo schema
│   └── userModel.js         # User schema
├── 📁 routes/
│   ├── authRoute.js         # Authentication routes
│   ├── connectionRoute.js   # Connection routes
│   ├── conversationRoute.js # Messaging routes
│   ├── eventRoute.js        # Event routes
│   ├── scheduleRoutes.js    # Schedule routes
│   ├── todoRoute.js         # Todo routes
│   └── userRoutes.js        # User routes
├── 📁 utils/
│   ├── emailService.js      # Email functionality
│   └── validation.js       # Input validation
├── 📁 public/
│   └── uploads/            # Local file storage
├── 📄 index.js              # Main server file
└── 📄 package.json         # Dependencies and scripts
```

---

## 🔐 Security

<div align="center">

| Security Feature       | Implementation                                                         |
| ---------------------- | ---------------------------------------------------------------------- |
| **Password Hashing**   | ![bcrypt](https://img.shields.io/badge/bcrypt-secured-green)           |
| **Authentication**     | ![JWT](https://img.shields.io/badge/JWT-tokens-blue)                   |
| **Input Validation**   | ![Validator](https://img.shields.io/badge/validation-sanitized-orange) |
| **Email Verification** | ![Email](https://img.shields.io/badge/email-verified-purple)           |
| **CORS Protection**    | ![CORS](https://img.shields.io/badge/CORS-configured-red)              |

</div>

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Input validation and sanitization
- ✅ Email verification system
- ✅ Disposable email domain blocking
- ✅ CORS configuration
- ✅ Environment variable protection

---

## 👨‍💻 Developer

<div align="center">

### **Abhishek Kumar**

[![Email](https://img.shields.io/badge/Email-mintu12890551%40gmail.com-red?style=for-the-badge&logo=gmail&logoColor=white)](mailto:mintu12890551@gmail.com)

_Full Stack Developer & Software Engineer_

---

**"Building the future, one line of code at a time"**

</div>

---

## 🤝 Contributing

<div align="center">

**We welcome contributions!**

</div>

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add some amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔄 Open a Pull Request

---

## 🆘 Support

<div align="center">

For support, please contact our development team:

[![Email Support](https://img.shields.io/badge/Email_Support-mintu12890551%40gmail.com-blue?style=for-the-badge&logo=gmail)](mailto:mintu12890551@gmail.com)

Or create an issue in the repository.

</div>

---

<div align="center">

### ⚠️ Important Note

**Make sure to configure all environment variables before running the application.**

_The server will not start without proper MongoDB connection and JWT secret configuration._

---

**Made with ❤️ by [Abhishek Kumar](mailto:mintu12890551@gmail.com)**

</div>
