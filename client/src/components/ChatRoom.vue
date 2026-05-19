<template>
  <div class="chat-room">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>💬 聊天室</h2>
      </div>
      <div class="user-info">
        <div class="avatar" :style="{ background: user.avatar }">
          {{ user.username.charAt(0).toUpperCase() }}
        </div>
        <span class="username">{{ user.username }}</span>
        <button class="logout-btn" @click="$emit('logout')" title="退出">✕</button>
      </div>
      <div class="online-section">
        <h3>在线用户 ({{ onlineUsers.length }})</h3>
        <ul class="online-list">
          <li v-for="u in onlineUsers" :key="u.username">
            <div class="avatar-sm" :style="{ background: u.avatar }">
              {{ u.username.charAt(0).toUpperCase() }}
            </div>
            <span>{{ u.username }}</span>
          </li>
        </ul>
      </div>
    </aside>

    <!-- Main chat area -->
    <main class="chat-main">
      <div class="chat-header">
        <button class="menu-btn" @click="sidebarOpen = !sidebarOpen">☰</button>
        <h2>公共聊天</h2>
        <span class="online-count">{{ onlineUsers.length }} 人在线</span>
      </div>

      <!-- Messages -->
      <div class="messages" ref="messagesContainer" @scroll="handleScroll">
        <div v-if="loading" class="loading">加载中...</div>
        <button v-if="hasMore && !loading" class="load-more" @click="loadMore">
          加载更多历史消息
        </button>

        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="[
            'message-wrapper',
            msg.type === 'system' ? 'system' : '',
            msg.username === user.username ? 'self' : 'other',
          ]"
        >
          <!-- System message -->
          <div v-if="msg.type === 'system'" class="system-msg">
            {{ msg.content }}
          </div>

          <!-- User message -->
          <div v-else class="message-row">
            <div
              class="avatar-sm"
              :style="{ background: msg.avatar }"
              v-if="msg.username !== user.username"
            >
              {{ msg.username.charAt(0).toUpperCase() }}
            </div>
            <div class="message-content">
              <div class="message-meta" v-if="msg.username !== user.username">
                <span class="msg-username">{{ msg.username }}</span>
                <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
              </div>
              <div class="msg-time self-time" v-else>
                {{ formatTime(msg.createdAt) }}
              </div>

              <!-- Text -->
              <div v-if="msg.type === 'text'" class="bubble">
                {{ msg.content }}
              </div>

              <!-- Image -->
              <div v-else-if="msg.type === 'image'" class="bubble image-bubble">
                <img
                  :src="getFileUrl(msg.fileUrl)"
                  :alt="msg.fileName"
                  @click="previewImage(getFileUrl(msg.fileUrl))"
                  loading="lazy"
                />
                <div class="file-name">{{ msg.fileName }}</div>
              </div>

              <!-- File -->
              <div v-else-if="msg.type === 'file'" class="bubble file-bubble">
                <div class="file-icon">📄</div>
                <div class="file-info">
                  <div class="file-name">{{ msg.fileName }}</div>
                  <div class="file-size">{{ formatSize(msg.fileSize) }}</div>
                </div>
                <a :href="getFileUrl(msg.fileUrl)" :download="msg.fileName" class="download-btn">
                  ⬇
                </a>
              </div>
            </div>
            <div
              class="avatar-sm"
              :style="{ background: msg.avatar }"
              v-if="msg.username === user.username"
            >
              {{ msg.username.charAt(0).toUpperCase() }}
            </div>
          </div>
        </div>
      </div>

      <!-- Typing indicator -->
      <div v-if="typingUsers.length" class="typing-indicator">
        {{ typingUsers.join(', ') }} 正在输入...
      </div>

      <!-- Input area -->
      <div class="input-area">
        <div class="input-toolbar">
          <button class="tool-btn" @click="triggerFileInput('image')" title="发送图片">🖼️</button>
          <button class="tool-btn" @click="triggerFileInput('file')" title="发送文件">📎</button>
        </div>
        <div class="input-row">
          <textarea
            v-model="inputText"
            placeholder="输入消息，按 Enter 发送..."
            @keydown.enter.exact.prevent="sendText"
            @input="onTyping"
            rows="1"
            ref="textareaRef"
          ></textarea>
          <button class="send-btn" @click="sendText" :disabled="!inputText.trim()">发送</button>
        </div>
      </div>

      <!-- Hidden file inputs -->
      <input
        ref="imageInput"
        type="file"
        accept="image/*"
        multiple
        style="display: none"
        @change="handleFileSelect($event, 'image')"
      />
      <input
        ref="fileInput"
        type="file"
        multiple
        style="display: none"
        @change="handleFileSelect($event, 'file')"
      />
    </main>

    <!-- Image preview -->
    <div v-if="previewSrc" class="preview-overlay" @click="previewSrc = null">
      <img :src="previewSrc" />
    </div>

    <!-- Mobile sidebar overlay -->
    <div
      v-if="sidebarOpen"
      class="sidebar-overlay"
      @click="sidebarOpen = false"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { io } from 'socket.io-client'
import axios from 'axios'

const props = defineProps({ user: Object })
defineEmits(['logout'])

const API_BASE = import.meta.env.VITE_API_URL || ''
const socket = io(API_BASE || window.location.origin, { transports: ['websocket', 'polling'] })

const messages = ref([])
const onlineUsers = ref([])
const inputText = ref('')
const typingUsers = ref([])
const loading = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const previewSrc = ref(null)
const sidebarOpen = ref(false)

const messagesContainer = ref(null)
const textareaRef = ref(null)
const imageInput = ref(null)
const fileInput = ref(null)

let typingTimeout = null

onMounted(async () => {
  socket.emit('user:join', props.user)
  await loadMessages()
  scrollToBottom()

  socket.on('message:new', (msg) => {
    messages.value.push(msg)
    nextTick(scrollToBottom)
  })

  socket.on('system:message', (msg) => {
    messages.value.push(msg)
    nextTick(scrollToBottom)
  })

  socket.on('users:online', (users) => {
    onlineUsers.value = users
  })

  socket.on('user:typing', ({ username }) => {
    if (!typingUsers.value.includes(username)) {
      typingUsers.value.push(username)
    }
  })

  socket.on('user:stop-typing', ({ username }) => {
    typingUsers.value = typingUsers.value.filter((u) => u !== username)
  })
})

onUnmounted(() => {
  socket.disconnect()
})

async function loadMessages() {
  loading.value = true
  try {
    const { data } = await axios.get(`${API_BASE}/api/messages`, {
      params: { page: currentPage.value, limit: 50 },
    })
    if (currentPage.value === 1) {
      messages.value = data.messages
    } else {
      messages.value = [...data.messages, ...messages.value]
    }
    hasMore.value = currentPage.value < data.totalPages
  } catch (err) {
    console.error('Failed to load messages:', err)
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  currentPage.value++
  const container = messagesContainer.value
  const prevHeight = container.scrollHeight
  await loadMessages()
  nextTick(() => {
    container.scrollTop = container.scrollHeight - prevHeight
  })
}

function sendText() {
  const text = inputText.value.trim()
  if (!text) return
  socket.emit('message:send', { content: text })
  inputText.value = ''
  socket.emit('user:stop-typing')
}

function onTyping() {
  socket.emit('user:typing')
  clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => {
    socket.emit('user:stop-typing')
  }, 2000)
}

function triggerFileInput(type) {
  if (type === 'image') imageInput.value.click()
  else fileInput.value.click()
}

async function handleFileSelect(event, type) {
  const files = event.target.files
  if (!files.length) return

  for (const file of files) {
    await uploadAndSend(file, type)
  }
  event.target.value = ''
}

async function uploadAndSend(file, type) {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const { data } = await axios.post(`${API_BASE}/api/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    const isImage = type === 'image' || data.mimeType.startsWith('image/')
    socket.emit('message:file', {
      type: isImage ? 'image' : 'file',
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileUrl: data.fileUrl,
    })
  } catch (err) {
    console.error('Upload failed:', err)
    alert('文件上传失败，请重试')
  }
}

function getFileUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${API_BASE}${url}`
}

function previewImage(src) {
  previewSrc.value = src
}

function scrollToBottom() {
  const container = messagesContainer.value
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

function handleScroll() {
  // Auto-load more when scrolling to top
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()

  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return time
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<style scoped>
.chat-room {
  width: 100%;
  height: 100%;
  display: flex;
  background: var(--bg);
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: var(--white);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border);
}

.sidebar-header h2 {
  font-size: 18px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.username {
  flex: 1;
  font-weight: 600;
  font-size: 14px;
}

.logout-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--text-light);
  transition: background 0.2s;
}

.logout-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.online-section {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.online-section h3 {
  font-size: 12px;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.online-list {
  list-style: none;
}

.online-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  font-size: 14px;
}

/* Avatars */
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
}

.avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 13px;
  flex-shrink: 0;
}

/* Chat main */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  padding: 16px 20px;
  background: var(--white);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-header h2 {
  font-size: 16px;
  flex: 1;
}

.online-count {
  font-size: 13px;
  color: var(--text-light);
}

.menu-btn {
  display: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f3f4f6;
  font-size: 18px;
}

/* Messages */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-chat);
}

.loading {
  text-align: center;
  color: var(--text-light);
  padding: 12px;
  font-size: 14px;
}

.load-more {
  align-self: center;
  padding: 8px 16px;
  border-radius: 20px;
  background: var(--white);
  color: var(--primary);
  font-size: 13px;
  margin-bottom: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: background 0.2s;
}

.load-more:hover {
  background: #eef2ff;
}

/* System message */
.system-msg {
  text-align: center;
  color: var(--system);
  font-size: 12px;
  padding: 4px 0;
}

/* Message row */
.message-row {
  display: flex;
  gap: 8px;
  max-width: 75%;
  align-items: flex-start;
}

.message-wrapper.self .message-row {
  margin-left: auto;
  flex-direction: row;
}

.message-wrapper.other .message-row {
  margin-right: auto;
}

.message-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.message-meta {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 2px;
}

.msg-username {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
}

.msg-time {
  font-size: 11px;
  color: var(--text-light);
}

.self-time {
  font-size: 11px;
  color: var(--text-light);
  text-align: right;
  margin-bottom: 2px;
}

/* Bubbles */
.bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  max-width: 100%;
}

.message-wrapper.self .bubble {
  background: var(--msg-self);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-wrapper.other .bubble {
  background: var(--msg-other);
  color: var(--text);
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Image bubble */
.image-bubble {
  padding: 6px;
}

.image-bubble img {
  max-width: 280px;
  max-height: 280px;
  border-radius: 8px;
  cursor: pointer;
  display: block;
  object-fit: cover;
}

.image-bubble .file-name {
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.7;
}

/* File bubble */
.file-bubble {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 200px;
}

.file-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-info .file-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-info .file-size {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 2px;
}

.download-btn {
  font-size: 18px;
  text-decoration: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.message-wrapper.self .download-btn {
  color: white;
}
.message-wrapper.self .download-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}
.message-wrapper.other .download-btn {
  color: var(--primary);
}
.message-wrapper.other .download-btn:hover {
  background: #eef2ff;
}

/* Typing */
.typing-indicator {
  padding: 4px 20px 0;
  font-size: 12px;
  color: var(--text-light);
  background: var(--bg-chat);
}

/* Input area */
.input-area {
  background: var(--white);
  border-top: 1px solid var(--border);
  padding: 12px 16px;
}

.input-toolbar {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.tool-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: transparent;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.tool-btn:hover {
  background: #f3f4f6;
}

.input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

textarea {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid var(--border);
  border-radius: 10px;
  font-size: 14px;
  resize: none;
  min-height: 42px;
  max-height: 120px;
  transition: border-color 0.2s;
  line-height: 1.4;
}

textarea:focus {
  border-color: var(--primary);
}

.send-btn {
  padding: 10px 20px;
  background: var(--primary);
  color: white;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: var(--primary-light);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Image preview overlay */
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
}

.preview-overlay img {
  max-width: 90%;
  max-height: 90%;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Sidebar overlay for mobile */
.sidebar-overlay {
  display: none;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -260px;
    top: 0;
    bottom: 0;
    z-index: 100;
    transition: left 0.3s;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 99;
  }

  .chat-room:has(.sidebar-overlay) .sidebar {
    left: 0;
  }

  .menu-btn {
    display: flex;
  }

  .message-row {
    max-width: 85%;
  }
}
</style>
