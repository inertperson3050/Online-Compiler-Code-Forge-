require('dotenv').config();
const express   = require('express');
const http      = require('http');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose  = require('mongoose');

const executeRoutes = require('./routes/execute');
const aiRoutes      = require('./routes/ai');
const snippetRoutes = require('./routes/snippets');
const { attachTerminalWS } = require('./terminalServer');

const app    = express();
const server = http.createServer(app);   // ← must be http.Server, not app.listen
const PORT   = process.env.PORT || 5000;

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(rateLimit({ windowMs: 60000, max: 20, message: { error: 'Too many requests.' }, skip: (req) => req.path === '/api/health' }));
app.use(express.json({ limit: '50kb' }));

app.use('/api/execute',  executeRoutes);
app.use('/api/ai',       aiRoutes);
app.use('/api/snippets', snippetRoutes);
app.get('/api/health',   (_req, res) => res.json({ status: 'ok' }));

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/compiler_mvp')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.warn('⚠️  MongoDB not connected:', err.message));

// ── Start server then attach WS (order matters) ──────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 HTTP server running on http://localhost:${PORT}`);
  attachTerminalWS(server);
});