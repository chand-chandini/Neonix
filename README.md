🚀 Neonix AI Chat Application

<div align="center">

![Neonix Banner](https://img.shields.io/badge/Neonix-AI%20Chat-6C63FF?style=for-the-badge&logo=react)
![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen?style=flat-square)

**An intelligent AI chat application powered by Google Gemini AI**

</div>

---

## ✨ Features

- 💬 **Real-time AI Chat** - Instant responses powered by Google Gemini AI
- 📚 **Conversation Management** - Create, save, and delete conversations
- 🎨 **Modern Dark UI** - Sleek, responsive design with Styled Components
- 📝 **Markdown Support** - Rich text formatting and code syntax highlighting
- 🗄️ **Data Persistence** - All conversations stored in MongoDB
- 🔒 **Secure** - Environment variables for API key protection
- 🚀 **Full CRUD** - Complete conversation lifecycle management

---

## 🛠️ Tech Stack

### Backend
| Technology | Description |
|------------|-------------|
| **Node.js** | JavaScript runtime environment |
| **Express** | Web framework for Node.js |
| **MongoDB** | NoSQL database for data persistence |
| **Mongoose** | ODM for MongoDB |
| **Google Gemini AI** | AI model for intelligent responses |
| **JWT** | JSON Web Tokens for authentication |
| **Helmet** | Security headers middleware |
| **CORS** | Cross-Origin Resource Sharing |

### Frontend
| Technology | Description |
|------------|-------------|
| **React 18** | UI library for building components |
| **Styled Components** | CSS-in-JS styling |
| **Axios** | HTTP client for API requests |
| **React Icons** | Icon library |
| **React Markdown** | Markdown rendering |
| **React Syntax Highlighter** | Code syntax highlighting |

---

## 📁 Project Structure

```
neonix/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── chat.controller.js
│   │   ├── models/
│   │   │   └── Conversation.js
│   │   ├── routes/
│   │   │   ├── chat.routes.js
│   │   │   └── conversation.routes.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── ChatInterface.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── .env.example
│   └── package.json
├── .gitignore
├── README.md
└── LICENSE
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (local or cloud)
- **Google Gemini API Key**

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/chand-chandini/Neonix.git
cd Neonix
```

#### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

#### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API URL
npm start
```

#### 4. Open the application

```
Frontend: http://localhost:3000
Backend:  http://localhost:5000
```

---

## 🔧 Environment Variables

### Backend `.env`

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/neonix
JWT_SECRET=your_super_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env`

```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📸 Screenshots

### Chat Interface
![Chat Interface](https://via.placeholder.com/800x400/1a1a1a/6C63FF?text=Chat+Interface)

### Conversation Management
![Conversations](https://via.placeholder.com/800x400/1a1a1a/6C63FF?text=Conversation+Management)

---

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat/send` | Send a message to AI |
| `GET` | `/api/conversations` | Get all conversations |
| `GET` | `/api/conversations/:id` | Get a specific conversation |
| `DELETE` | `/api/conversations/:id` | Delete a conversation |
| `GET` | `/api/test` | Test API connection |

---

## 🤝 Contributing

Contributions are what make the open-source community amazing. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) - For the powerful AI model
- [MongoDB](https://www.mongodb.com/) - For the reliable database
- [React](https://reactjs.org/) - For the amazing UI library
- [Styled Components](https://styled-components.com/) - For beautiful styling

---

## 📧 Contact

**Project Link:** [https://github.com/chand-chandini/Neonix](https://github.com/chand-chandini/Neonix)

---

<div align="center">

Made with ❤️ by Chand Chandini

⭐ Star this repo if you found it useful!

</div>
