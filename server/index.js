const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

// --- Database setup ---
const dbPath = path.join(__dirname, 'chat.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    avatar TEXT,
    type TEXT NOT NULL DEFAULT 'text',
    content TEXT,
    fileName TEXT,
    fileSize INTEGER,
    fileUrl TEXT,
    thumbUrl TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const insertMsg = db.prepare(`
  INSERT INTO messages (id, username, avatar, type, content, fileName, fileSize, fileUrl, thumbUrl, createdAt)
  VALUES (@id, @username, @avatar, @type, @content, @fileName, @fileSize, @fileUrl, @thumbUrl, @createdAt)
`);

const getMessages = db.prepare(`
  SELECT * FROM messages ORDER BY createdAt ASC
`);

const getMessagesPaginated = db.prepare(`
  SELECT * FROM messages ORDER BY createdAt DESC LIMIT @limit OFFSET @offset
`);

const countMessages = db.prepare(`SELECT COUNT(*) AS total FROM messages`);

// --- Socket.IO ---
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 50 * 1024 * 1024,
});

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Serve uploaded files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// --- File upload with multer ---
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// --- REST API ---

// Upload file
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    fileName: req.file.originalname,
    fileSize: req.file.size,
    fileUrl,
    mimeType: req.file.mimetype,
  });
});

// Get chat history (paginated)
app.get('/api/messages', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const offset = (page - 1) * limit;

  const rows = getMessagesPaginated.all({ limit, offset });
  const { total } = countMessages.get();

  res.json({
    messages: rows.reverse(),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// --- Socket.IO events ---
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins
  socket.on('user:join', (user) => {
    onlineUsers.set(socket.id, {
      username: user.username,
      avatar: user.avatar,
    });
    io.emit('users:online', Array.from(onlineUsers.values()));
    io.emit('system:message', {
      id: uuidv4(),
      type: 'system',
      content: `${user.username} joined the chat`,
      createdAt: new Date().toISOString(),
    });
  });

  // Text message
  socket.on('message:send', (data) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;

    const msg = {
      id: uuidv4(),
      username: user.username,
      avatar: user.avatar,
      type: 'text',
      content: data.content,
      fileName: null,
      fileSize: null,
      fileUrl: null,
      thumbUrl: null,
      createdAt: new Date().toISOString(),
    };

    insertMsg.run(msg);
    io.emit('message:new', msg);
  });

  // File / image message
  socket.on('message:file', (data) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;

    const msg = {
      id: uuidv4(),
      username: user.username,
      avatar: user.avatar,
      type: data.type || 'file',
      content: data.content || null,
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileUrl: data.fileUrl,
      thumbUrl: data.thumbUrl || null,
      createdAt: new Date().toISOString(),
    };

    insertMsg.run(msg);
    io.emit('message:new', msg);
  });

  // Typing indicator
  socket.on('user:typing', () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      socket.broadcast.emit('user:typing', { username: user.username });
    }
  });

  socket.on('user:stop-typing', () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      socket.broadcast.emit('user:stop-typing', { username: user.username });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    onlineUsers.delete(socket.id);
    io.emit('users:online', Array.from(onlineUsers.values()));
    if (user) {
      io.emit('system:message', {
        id: uuidv4(),
        type: 'system',
        content: `${user.username} left the chat`,
        createdAt: new Date().toISOString(),
      });
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

// --- Serve Vue frontend in production ---
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);
});
