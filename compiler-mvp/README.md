# ⚡ CodeForge — Online Multi-Language Compiler

A production-ready online compiler with AI assistance, supporting **C, C++, Python, and Java** — built with React + Vite, Node.js/Express, MongoDB, and Gemini Flash AI.

---

## 📁 Project Structure

```
compiler-mvp/
├── backend/
│   ├── models/
│   │   └── Snippet.js          # MongoDB snippet schema
│   ├── routes/
│   │   ├── execute.js          # POST /api/execute
│   │   ├── ai.js               # POST /api/ai/assist
│   │   └── snippets.js         # CRUD /api/snippets
│   ├── services/
│   │   ├── executionService.js # Judge0 CE API integration
│   │   └── aiService.js        # Gemini Flash integration
│   ├── server.js               # Express entry point
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CodeEditor.jsx    # Monaco Editor wrapper
│   │   │   ├── OutputPanel.jsx   # Console output + stdin
│   │   │   ├── AIPanel.jsx       # AI assistant (4 modes)
│   │   │   ├── SnippetsDrawer.jsx # Save/load snippets
│   │   │   └── ToastContainer.jsx
│   │   ├── hooks/
│   │   │   └── useToast.js
│   │   ├── utils/
│   │   │   ├── api.js            # Axios API calls
│   │   │   └── constants.js      # Languages, default code
│   │   ├── App.jsx               # Root component
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.js
│   └── .env.example
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- API Keys: [Judge0 RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce) + [Gemini](https://aistudio.google.com/app/apikey)

### 1. Clone & Install

```bash
# Backend
cd backend
cp .env.example .env        # Fill in your API keys
npm install
npm run dev                 # Runs on :5000

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # Runs on :5173
```

### 2. Configure Environment

**backend/.env**
```env
PORT=5000
FRONTEND_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/compiler_mvp
RAPIDAPI_KEY=your_key_from_rapidapi
GEMINI_API_KEY=your_key_from_google_ai_studio
```

---

## 🐳 Docker Deployment (Recommended)

```bash
# At project root
cp backend/.env.example .env
# Edit .env with your API keys

docker compose up --build -d
# Frontend → http://localhost:80
# Backend  → http://localhost:5000
```

---

## ☁️ AWS EC2 Deployment

### 1. Launch EC2 Instance
- **AMI**: Ubuntu 22.04 LTS
- **Instance Type**: t3.small (minimum) / t3.medium (recommended)
- **Security Group**: Open ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 5000 (API)

### 2. Install Docker on EC2

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 git
sudo systemctl enable docker
sudo usermod -aG docker ubuntu
```

### 3. Deploy

```bash
git clone https://github.com/your-repo/compiler-mvp.git
cd compiler-mvp

# Create .env with production keys
cat > .env <<EOF
RAPIDAPI_KEY=your_key
GEMINI_API_KEY=your_key
FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP
EOF

docker compose up --build -d
```

### 4. (Optional) Vercel Frontend + EC2 Backend

```bash
# Deploy frontend to Vercel
cd frontend
echo "VITE_API_URL=http://YOUR_EC2_IP:5000/api" > .env.production
npx vercel --prod

# Backend stays on EC2 (only run backend service)
docker compose up backend mongo -d
```

---

## 🔌 API Reference

### POST `/api/execute`
Execute code securely via Judge0 CE.

```json
// Request
{ "language": "python", "code": "print('Hello')", "stdin": "" }

// Response
{
  "output": "Hello",
  "stderr": "",
  "exitCode": 0,
  "executionTime": "0.05s",
  "memory": "3.2 MB",
  "status": "Accepted"
}
```

**Supported languages:** `c`, `cpp`, `python`, `java`

---

### POST `/api/ai/assist`
AI code assistance via Gemini Flash.

```json
// Request
{
  "code": "...",
  "language": "python",
  "mode": "explain",       // explain | predict | debug | custom
  "question": "",          // required for mode=custom
  "output": ""             // optional: pass run output for debug mode
}

// Response
{ "response": "Markdown-formatted AI response..." }
```

---

### GET `/api/snippets`
List recent saved snippets (requires MongoDB).

### POST `/api/snippets`
Save a snippet: `{ title, language, code }`

### GET `/api/snippets/:id`
Load a snippet by ID.

### DELETE `/api/snippets/:id`
Delete a snippet.

### GET `/api/health`
Health check: `{ "status": "ok", "timestamp": "..." }`

---

## 🔑 Getting API Keys

| Service | URL | Notes |
|---------|-----|-------|
| **Judge0 CE** (execution) | https://rapidapi.com/judge0-official/api/judge0-ce | Free tier: 50 req/day |
| **Gemini Flash** (AI) | https://aistudio.google.com/app/apikey | Free tier available |
| **MongoDB Atlas** (DB) | https://cloud.mongodb.com | Free 512MB cluster |

> **Without keys**: The app still loads. AI features require `GEMINI_API_KEY`. Code execution requires `RAPIDAPI_KEY`. Snippets require MongoDB.

---

## 🛡️ Security Features

- **Rate limiting**: 20 executions/min, 10 AI requests/min per IP
- **Input validation**: Language whitelist, 10KB code size limit
- **Helmet.js**: Security headers
- **CORS**: Configurable via `FRONTEND_URL`
- **Non-root Docker user**: Backend runs as unprivileged user
- **Sandboxed execution**: Code runs in Judge0's isolated containers (not on your server)

---

## 🏗️ Architecture

```
Browser
  │
  ├── React + Vite (frontend)
  │     ├── Monaco Editor
  │     ├── AI Panel (4 modes)
  │     └── Output Console
  │
  └── Express API (backend :5000)
        ├── /api/execute ──► Judge0 CE (RapidAPI)
        │                    (Isolated Docker containers)
        ├── /api/ai      ──► Gemini Flash API
        └── /api/snippets ─► MongoDB
```

---

## 🔧 Customization

### Add a new language
1. Add to `JUDGE0_LANG_IDS` in `backend/services/executionService.js`
2. Add to `LANGUAGES` array in `frontend/src/utils/constants.js`
3. Add default code template in `DEFAULT_CODE`

### Self-host Judge0
```env
JUDGE0_URL=http://your-judge0-server:2358
# Remove RAPIDAPI_KEY (not needed for self-hosted)
```

See: https://github.com/judge0/judge0

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Monaco Editor |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| AI | Google Gemini Flash (`gemini-2.0-flash`) |
| Execution | Judge0 CE via RapidAPI |
| Containerization | Docker + Docker Compose |
| Web Server | Nginx (production) |
| Deployment | AWS EC2 / Vercel |
