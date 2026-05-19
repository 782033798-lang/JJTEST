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
    channel TEXT NOT NULL DEFAULT 'public',
    username TEXT NOT NULL,
    avatar TEXT,
    type TEXT NOT NULL DEFAULT 'text',
    content TEXT,
    fileName TEXT,
    fileSize INTEGER,
    fileUrl TEXT,
    thumbUrl TEXT,
    encrypted INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Add channel column if upgrading from old schema
try { db.exec(`ALTER TABLE messages ADD COLUMN channel TEXT NOT NULL DEFAULT 'public'`); } catch {}
try { db.exec(`ALTER TABLE messages ADD COLUMN encrypted INTEGER NOT NULL DEFAULT 0`); } catch {}

const insertMsg = db.prepare(`
  INSERT INTO messages (id, channel, username, avatar, type, content, fileName, fileSize, fileUrl, thumbUrl, encrypted, createdAt)
  VALUES (@id, @channel, @username, @avatar, @type, @content, @fileName, @fileSize, @fileUrl, @thumbUrl, @encrypted, @createdAt)
`);

const getChannelMessages = db.prepare(`
  SELECT * FROM messages WHERE channel = @channel ORDER BY createdAt DESC LIMIT @limit OFFSET @offset
`);

const countChannelMessages = db.prepare(`
  SELECT COUNT(*) AS total FROM messages WHERE channel = @channel
`);

function dmChannel(a, b) {
  return 'dm:' + [a, b].sort().join(':');
}

// --- Socket.IO ---
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 50 * 1024 * 1024,
});

// --- Middleware ---
app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// --- File upload ---
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({
    fileName: req.file.originalname,
    fileSize: req.file.size,
    fileUrl: `/uploads/${req.file.filename}`,
    mimeType: req.file.mimetype,
  });
});

// Get messages for a channel (public or dm)
app.get('/api/messages', (req, res) => {
  const channel = req.query.channel || 'public';
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const offset = (page - 1) * limit;

  const rows = getChannelMessages.all({ channel, limit, offset });
  const { total } = countChannelMessages.get({ channel });

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
  socket.on('user:join', (user) => {
    onlineUsers.set(socket.id, { username: user.username, avatar: user.avatar });
    socket.join('public');
    io.emit('users:online', Array.from(onlineUsers.values()));
    io.to('public').emit('system:message', {
      id: uuidv4(),
      channel: 'public',
      type: 'system',
      content: `${user.username} 加入了聊天`,
      createdAt: new Date().toISOString(),
    });
  });

  // Join a DM channel
  socket.on('dm:open', ({ target }) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    const channel = dmChannel(user.username, target);
    socket.join(channel);
  });

  // Send message (public or DM)
  socket.on('message:send', (data) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;

    const channel = data.target
      ? dmChannel(user.username, data.target)
      : 'public';

    const msg = {
      id: uuidv4(),
      channel,
      username: user.username,
      avatar: user.avatar,
      type: 'text',
      content: data.content,
      fileName: null,
      fileSize: null,
      fileUrl: null,
      thumbUrl: null,
      encrypted: data.encrypted ? 1 : 0,
      createdAt: new Date().toISOString(),
    };

    insertMsg.run(msg);

    if (data.target) {
      // DM: send to both participants
      const targetSocketIds = [];
      for (const [sid, u] of onlineUsers) {
        if (u.username === data.target) targetSocketIds.push(sid);
      }
      socket.emit('message:new', msg);
      for (const sid of targetSocketIds) {
        io.to(sid).emit('message:new', msg);
      }
    } else {
      io.to('public').emit('message:new', msg);
    }
  });

  // File message (public or DM)
  socket.on('message:file', (data) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;

    const channel = data.target
      ? dmChannel(user.username, data.target)
      : 'public';

    const msg = {
      id: uuidv4(),
      channel,
      username: user.username,
      avatar: user.avatar,
      type: data.type || 'file',
      content: data.content || null,
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileUrl: data.fileUrl,
      thumbUrl: data.thumbUrl || null,
      encrypted: data.encrypted ? 1 : 0,
      createdAt: new Date().toISOString(),
    };

    insertMsg.run(msg);

    if (data.target) {
      const targetSocketIds = [];
      for (const [sid, u] of onlineUsers) {
        if (u.username === data.target) targetSocketIds.push(sid);
      }
      socket.emit('message:new', msg);
      for (const sid of targetSocketIds) {
        io.to(sid).emit('message:new', msg);
      }
    } else {
      io.to('public').emit('message:new', msg);
    }
  });

  socket.on('user:typing', (data) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    if (data && data.target) {
      for (const [sid, u] of onlineUsers) {
        if (u.username === data.target) {
          io.to(sid).emit('user:typing', { username: user.username, channel: dmChannel(user.username, data.target) });
        }
      }
    } else {
      socket.broadcast.emit('user:typing', { username: user.username, channel: 'public' });
    }
  });

  socket.on('user:stop-typing', (data) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    if (data && data.target) {
      for (const [sid, u] of onlineUsers) {
        if (u.username === data.target) {
          io.to(sid).emit('user:stop-typing', { username: user.username, channel: dmChannel(user.username, data.target) });
        }
      }
    } else {
      socket.broadcast.emit('user:stop-typing', { username: user.username, channel: 'public' });
    }
  });

  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    onlineUsers.delete(socket.id);
    io.emit('users:online', Array.from(onlineUsers.values()));
    if (user) {
      io.to('public').emit('system:message', {
        id: uuidv4(),
        channel: 'public',
        type: 'system',
        content: `${user.username} 离开了聊天`,
        createdAt: new Date().toISOString(),
      });
    }
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
