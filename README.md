# 🌍 Cross-Lingual Chatbot

A powerful multilingual AI chatbot system with real-time translation, supporting multiple specialized bots (Support & Sales) with beautiful modern UI.

## ✨ Features

- 🤖 **Dual Bot System**: Separate AI agents for Support and Sales
- 🌐 **100+ Languages**: Automatic language detection and translation
- 🎨 **Modern UI**: Beautiful glassmorphism design with animations
- 🔗 **Webhook Support**: Custom fulfillment logic via Dialogflow webhooks
- 📱 **Responsive**: Works perfectly on desktop and mobile
- 🚀 **Real-time**: Instant responses with typing indicators

## 🏗️ Architecture

```
├── backend/          # Node.js + Express API server
│   ├── src/
│   │   └── index.ts  # Main server with Dialogflow & Translation APIs
│   ├── .env.example  # Environment variables template
│   └── package.json
├── frontend/         # React + TypeScript UI
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Google Cloud Platform account
- Two Dialogflow projects (Support & Sales)

### 1. Clone & Install

```bash
git clone <your-repo>
cd cross-lingual-chatbot

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Google Cloud Setup

1. **Create GCP Projects**:
   - Create two Google Cloud projects (one for Support, one for Sales)
   - Enable Dialogflow API and Cloud Translation API for both

2. **Create Service Accounts**:
   - Go to IAM & Admin > Service Accounts
   - Create service accounts with Dialogflow and Translation permissions
   - Download JSON credential files

3. **Set up Dialogflow**:
   - Create Dialogflow agents in both projects
   - Train with intents for your use cases
   - (Optional) Configure webhooks pointing to your server

### 3. Environment Configuration

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your actual values:

```env
PORT=3001
DIALOGFLOW_PROJECT_ID_SUPPORT=your-support-project-id
DIALOGFLOW_PROJECT_ID_SALES=your-sales-project-id
GOOGLE_APPLICATION_CREDENTIALS_SUPPORT=./support-credentials.json
GOOGLE_APPLICATION_CREDENTIALS_SALES=./sales-credentials.json
```

### 4. Add Credential Files

Place your Google Cloud service account JSON files in the `backend/` directory:
- `support-credentials.json`
- `sales-credentials.json`

### 5. Run the Application

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm start
```

Visit `http://localhost:3000` to see your chatbot!

## 🌐 Public Access (Optional)

To make your backend publicly accessible for webhooks:

```bash
# Install ngrok (if not already installed)
brew install ngrok  # macOS
# or download from https://ngrok.com

# Expose your backend
ngrok http 3001
```

Use the ngrok URL for Dialogflow webhook configuration.

## 📡 API Endpoints

### Chat API
```http
POST /api/chat
Content-Type: application/json

{
  "message": "Hello, I need help",
  "sessionId": "unique-session-id",
  "botId": "support" | "sales"
}
```

### Webhook (for Dialogflow)
```http
POST /webhook
Content-Type: application/json

# Dialogflow sends webhook requests here
```

### Health Check
```http
GET /health
```

## 🎨 Customization

### Adding New Intents

1. **Backend** (`backend/src/index.ts`):
   ```typescript
   // Add new intent handling in webhook
   if (intentName === 'YourNewIntent') {
     fulfillmentText = "Your custom response";
   }
   ```

2. **Dialogflow Console**:
   - Create new intents
   - Add training phrases
   - Enable webhook for custom fulfillment

### Styling

Customize the UI in `frontend/src/App.css`:
- Change colors, gradients, animations
- Modify chat bubble styles
- Update responsive breakpoints

### Adding New Bot Types

1. Add new project ID to `.env`
2. Create new client instances in `backend/src/index.ts`
3. Add new page component in `frontend/src/pages/`
4. Update routing in `App.tsx`

## 🔒 Security

- ✅ Credential files are gitignored
- ✅ Environment variables for sensitive data
- ✅ CORS configured for frontend
- ✅ Input validation and error handling

## 🚀 Deployment

### Backend (Node.js)
- Deploy to Heroku, Railway, or Google Cloud Run
- Set environment variables in deployment platform
- Upload credential files securely

### Frontend (React)
- Deploy to Vercel, Netlify, or Firebase Hosting
- Update API_URL to point to deployed backend

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev  # Auto-restart on changes
```

### Frontend Development
```bash
cd frontend
npm start    # Hot reload enabled
```

### Testing API
```bash
# Test chat endpoint
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "sessionId": "test", "botId": "support"}'
```

## 📝 License

MIT License - feel free to use this project for your own applications!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the logs in browser console and server terminal
- Verify Google Cloud API quotas and permissions
- Ensure all environment variables are set correctly

---

Built with ❤️ using React, Node.js, and Google Cloud AI