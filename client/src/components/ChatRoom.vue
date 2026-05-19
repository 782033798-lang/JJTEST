<template>
  <div class="chat-room">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <div class="brand">
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="12" fill="url(#g2)" />
            <path d="M12 16C12 14.8954 12.8954 14 14 14H26C27.1046 14 28 14.8954 28 16V22C28 23.1046 27.1046 24 26 24H22L18 28V24H14C12.8954 24 12 23.1046 12 22V16Z" fill="white" opacity="0.9"/>
            <defs><linearGradient id="g2" x1="0" y1="0" x2="40" y2="40"><stop stop-color="#6c5ce7"/><stop offset="1" stop-color="#a29bfe"/></linearGradient></defs>
          </svg>
          <span>SecureChat</span>
        </div>
      </div>

      <!-- Current user -->
      <div class="current-user">
        <div class="avatar-gradient" :style="{ background: user.avatar }">
          {{ user.username.charAt(0).toUpperCase() }}
        </div>
        <div class="user-detail">
          <span class="uname">{{ user.username }}</span>
          <span class="ustatus" v-if="user.passphrase">🔒 已加密</span>
          <span class="ustatus" v-else>未加密</span>
        </div>
        <button class="icon-btn" @click="$emit('logout')" title="退出登录">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>

      <!-- Conversations -->
      <div class="nav-section">
        <div class="nav-label">频道</div>
        <div
          class="nav-item"
          :class="{ active: activeChannel === 'public' }"
          @click="switchChannel('public')"
        >
          <span class="nav-icon">#</span>
          <span>公共聊天</span>
        </div>
      </div>

      <div class="nav-section">
        <div class="nav-label">私信</div>
        <div
          v-for="u in dmableUsers"
          :key="u.username"
          class="nav-item dm-item"
          :class="{ active: activeChannel === getDmChannel(u.username) }"
          @click="openDm(u)"
        >
          <div class="avatar-sm-gradient" :style="{ background: u.avatar }">
            {{ u.username.charAt(0).toUpperCase() }}
          </div>
          <span>{{ u.username }}</span>
          <span class="online-dot"></span>
        </div>
        <div v-if="!dmableUsers.length" class="empty-hint">暂无其他在线用户</div>
      </div>

      <!-- Encryption settings -->
      <div class="sidebar-footer">
        <div class="encrypt-toggle">
          <label class="switch-label">
            <input type="checkbox" v-model="encryptionEnabled" :disabled="!user.passphrase" />
            <span class="switch-slider"></span>
          </label>
          <span class="encrypt-text">{{ encryptionEnabled ? '加密已开启' : '加密已关闭' }}</span>
        </div>
        <div v-if="!user.passphrase" class="encrypt-hint">登录时设置暗号以启用</div>
      </div>
    </aside>

    <!-- Main -->
    <main class="chat-main">
      <div class="chat-header">
        <button class="menu-btn" @click="sidebarOpen = !sidebarOpen">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div class="header-info">
          <h2>{{ channelTitle }}</h2>
          <span class="header-sub">{{ channelSubtitle }}</span>
        </div>
        <div v-if="encryptionEnabled && user.passphrase" class="header-badge">🔒</div>
      </div>

      <!-- Passphrase prompt for viewing encrypted messages -->
      <div v-if="showPassphrasePrompt" class="passphrase-bar">
        <span>🔐 输入暗号查看加密消息：</span>
        <input
          v-model="viewPassphrase"
          :type="showViewPass ? 'text' : 'password'"
          placeholder="输入暗号"
          @keydown.enter="applyPassphrase"
        />
        <button @click="showViewPass = !showViewPass" class="icon-btn-sm">{{ showViewPass ? '🙈' : '👁️' }}</button>
        <button @click="applyPassphrase" class="apply-btn">解密</button>
        <button @click="showPassphrasePrompt = false" class="icon-btn-sm">✕</button>
      </div>

      <!-- Messages -->
      <div class="messages" ref="messagesContainer">
        <div v-if="loading" class="loading-wrap">
          <div class="spinner"></div>
          <span>加载中...</span>
        </div>
        <button v-if="hasMore && !loading" class="load-more" @click="loadMore">
          加载更多历史消息
        </button>

        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['msg-wrap', msg.type === 'system' ? 'is-system' : '', msg.username === user.username ? 'is-self' : 'is-other']"
        >
          <div v-if="msg.type === 'system'" class="system-msg">
            <span>{{ msg.content }}</span>
          </div>

          <div v-else class="msg-row">
            <div class="avatar-sm-gradient" :style="{ background: msg.avatar }" v-if="msg.username !== user.username">
              {{ msg.username.charAt(0).toUpperCase() }}
            </div>
            <div class="msg-body">
              <div class="msg-meta" v-if="msg.username !== user.username">
                <span class="msg-name">{{ msg.username }}</span>
                <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
              </div>
              <div class="msg-time-self" v-else>{{ formatTime(msg.createdAt) }}</div>

              <!-- Encrypted indicator -->
              <div v-if="msg.encrypted && !msg._decrypted && msg._decryptFailed !== true" class="bubble encrypted-bubble" @click="showPassphrasePrompt = true">
                <span class="lock-icon">🔒</span>
                <span>加密消息 — 点击输入暗号查看</span>
              </div>
              <div v-else-if="msg.encrypted && msg._decryptFailed" class="bubble encrypted-bubble failed">
                <span class="lock-icon">🔒</span>
                <span>暗号错误，无法解密</span>
              </div>

              <!-- Text -->
              <div v-else-if="msg.type === 'text'" class="bubble">
                <span v-if="msg.encrypted" class="lock-badge">🔒</span>
                {{ msg._displayContent || msg.content }}
              </div>

              <!-- Image -->
              <div v-else-if="msg.type === 'image'" class="bubble img-bubble">
                <img :src="getFileUrl(msg.fileUrl)" :alt="msg.fileName" @click="previewSrc = getFileUrl(msg.fileUrl)" loading="lazy" />
              </div>

              <!-- File -->
              <div v-else-if="msg.type === 'file'" class="bubble file-bubble">
                <div class="file-icon-wrap">
                  <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div class="file-detail">
                  <span class="fname">{{ msg.fileName }}</span>
                  <span class="fsize">{{ formatSize(msg.fileSize) }}</span>
                </div>
                <a :href="getFileUrl(msg.fileUrl)" :download="msg.fileName" class="dl-btn">
                  <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </a>
              </div>
            </div>
            <div class="avatar-sm-gradient" :style="{ background: msg.avatar }" v-if="msg.username === user.username">
              {{ msg.username.charAt(0).toUpperCase() }}
            </div>
          </div>
        </div>
      </div>

      <!-- Typing -->
      <div v-if="currentTyping.length" class="typing-bar">
        <div class="typing-dots"><span></span><span></span><span></span></div>
        {{ currentTyping.join(', ') }} 正在输入...
      </div>

      <!-- Input -->
      <div class="input-area">
        <div class="input-tools">
          <button class="tool-btn" @click="$refs.imageInput.click()" title="发送图片">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          </button>
          <button class="tool-btn" @click="$refs.fileInput.click()" title="发送文件">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
          </button>
        </div>
        <div class="input-row">
          <textarea
            v-model="inputText"
            :placeholder="encryptionEnabled && user.passphrase ? '输入加密消息...' : '输入消息...'"
            @keydown.enter.exact.prevent="sendText"
            @input="onTyping"
            rows="1"
          ></textarea>
          <button class="send-btn" @click="sendText" :disabled="!inputText.trim()">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>

      <input ref="imageInput" type="file" accept="image/*" multiple style="display:none" @change="handleFile($event, 'image')" />
      <input ref="fileInput" type="file" multiple style="display:none" @change="handleFile($event, 'file')" />
    </main>

    <!-- Image preview -->
    <Teleport to="body">
      <div v-if="previewSrc" class="preview-overlay" @click="previewSrc = null">
        <img :src="previewSrc" />
      </div>
    </Teleport>

    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" class="mobile-overlay" @click="sidebarOpen = false"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { io } from 'socket.io-client'
import axios from 'axios'
import { encrypt, decrypt, isEncrypted } from '../utils/crypto.js'

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
const activeChannel = ref('public')
const activeDmUser = ref(null)
const encryptionEnabled = ref(!!props.user.passphrase)
const showPassphrasePrompt = ref(false)
const viewPassphrase = ref(props.user.passphrase || '')
const showViewPass = ref(false)

const messagesContainer = ref(null)

const dmableUsers = computed(() =>
  onlineUsers.value.filter((u) => u.username !== props.user.username)
)

const channelTitle = computed(() => {
  if (activeChannel.value === 'public') return '# 公共聊天'
  return activeDmUser.value ? activeDmUser.value.username : '私信'
})

const channelSubtitle = computed(() => {
  if (activeChannel.value === 'public') return `${onlineUsers.value.length} 人在线`
  return '私密对话'
})

const currentTyping = computed(() =>
  typingUsers.value
    .filter((t) => t.channel === activeChannel.value)
    .map((t) => t.username)
)

function getDmChannel(target) {
  const pair = [props.user.username, target].sort()
  return 'dm:' + pair.join(':')
}

let typingTimeout = null

onMounted(async () => {
  socket.emit('user:join', props.user)
  await loadMessages()
  scrollToBottom()

  socket.on('message:new', async (msg) => {
    if (msg.channel !== activeChannel.value) return
    await tryDecryptMsg(msg)
    messages.value.push(msg)
    nextTick(scrollToBottom)
  })

  socket.on('system:message', (msg) => {
    if (msg.channel !== activeChannel.value) return
    messages.value.push(msg)
    nextTick(scrollToBottom)
  })

  socket.on('users:online', (users) => {
    onlineUsers.value = users
  })

  socket.on('user:typing', ({ username, channel }) => {
    const existing = typingUsers.value.find((t) => t.username === username && t.channel === channel)
    if (!existing) typingUsers.value.push({ username, channel })
  })

  socket.on('user:stop-typing', ({ username, channel }) => {
    typingUsers.value = typingUsers.value.filter(
      (t) => !(t.username === username && t.channel === channel)
    )
  })
})

onUnmounted(() => { socket.disconnect() })

watch(activeChannel, async () => {
  messages.value = []
  currentPage.value = 1
  hasMore.value = true
  await loadMessages()
  nextTick(scrollToBottom)
})

async function tryDecryptMsg(msg) {
  if (msg.encrypted && isEncrypted(msg.content)) {
    const pass = viewPassphrase.value || props.user.passphrase
    if (pass) {
      const plain = await decrypt(msg.content, pass)
      if (plain !== null) {
        msg._decrypted = true
        msg._displayContent = plain
      } else {
        msg._decryptFailed = true
      }
    }
  } else {
    msg._displayContent = msg.content
  }
}

async function applyPassphrase() {
  showPassphrasePrompt.value = false
  for (const msg of messages.value) {
    if (msg.encrypted && !msg._decrypted) {
      await tryDecryptMsg(msg)
    }
  }
}

async function loadMessages() {
  loading.value = true
  try {
    const { data } = await axios.get(`${API_BASE}/api/messages`, {
      params: { channel: activeChannel.value, page: currentPage.value, limit: 50 },
    })
    const msgs = data.messages
    for (const m of msgs) await tryDecryptMsg(m)
    if (currentPage.value === 1) {
      messages.value = msgs
    } else {
      messages.value = [...msgs, ...messages.value]
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
  const prevH = container.scrollHeight
  await loadMessages()
  nextTick(() => { container.scrollTop = container.scrollHeight - prevH })
}

function switchChannel(ch) {
  activeChannel.value = ch
  activeDmUser.value = null
  sidebarOpen.value = false
}

function openDm(u) {
  const ch = getDmChannel(u.username)
  activeChannel.value = ch
  activeDmUser.value = u
  socket.emit('dm:open', { target: u.username })
  sidebarOpen.value = false
}

async function sendText() {
  const text = inputText.value.trim()
  if (!text) return

  let content = text
  let encrypted = false
  if (encryptionEnabled.value && props.user.passphrase) {
    content = await encrypt(text, props.user.passphrase)
    encrypted = true
  }

  const target = activeDmUser.value ? activeDmUser.value.username : null
  socket.emit('message:send', { content, target, encrypted })
  inputText.value = ''
  socket.emit('user:stop-typing', { target })
}

function onTyping() {
  const target = activeDmUser.value ? activeDmUser.value.username : null
  socket.emit('user:typing', { target })
  clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => socket.emit('user:stop-typing', { target }), 2000)
}

async function handleFile(event, type) {
  const files = event.target.files
  if (!files.length) return
  for (const file of files) {
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { data } = await axios.post(`${API_BASE}/api/upload`, fd)
      const isImg = type === 'image' || data.mimeType.startsWith('image/')
      const target = activeDmUser.value ? activeDmUser.value.username : null
      socket.emit('message:file', {
        type: isImg ? 'image' : 'file',
        fileName: data.fileName, fileSize: data.fileSize, fileUrl: data.fileUrl,
        target,
        encrypted: false,
      })
    } catch { alert('上传失败') }
  }
  event.target.value = ''
}

function getFileUrl(url) {
  if (!url) return ''
  return url.startsWith('http') ? url : `${API_BASE}${url}`
}

function scrollToBottom() {
  const c = messagesContainer.value
  if (c) c.scrollTop = c.scrollHeight
}

function formatTime(s) {
  if (!s) return ''
  const d = new Date(s)
  const now = new Date()
  const same = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  const t = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return same ? t : `${d.getMonth() + 1}/${d.getDate()} ${t}`
}

function formatSize(b) {
  if (!b) return ''
  if (b < 1024) return b + ' B'
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1048576).toFixed(1) + ' MB'
}
</script>

<style scoped>
.chat-room {
  width: 100%;
  height: 100%;
  display: flex;
  background: var(--bg);
}

/* ===== Sidebar ===== */
.sidebar {
  width: 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 16px;
  color: var(--text);
}

.current-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.user-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.uname { font-weight: 600; font-size: 14px; }
.ustatus { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}
.icon-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--danger);
}

.nav-section {
  padding: 12px 12px 0;
}

.nav-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 0 8px 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition);
}
.nav-item:hover { background: rgba(255, 255, 255, 0.04); color: var(--text); }
.nav-item.active { background: var(--primary-bg); color: var(--primary-light); font-weight: 600; }

.nav-icon {
  font-size: 18px;
  font-weight: 700;
  width: 24px;
  text-align: center;
  color: var(--text-muted);
}
.nav-item.active .nav-icon { color: var(--primary-light); }

.dm-item { gap: 10px; }

.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--online);
  margin-left: auto;
}

.empty-hint {
  font-size: 12px;
  color: var(--text-muted);
  padding: 8px 12px;
}

.sidebar-footer {
  margin-top: auto;
  padding: 16px 20px;
  border-top: 1px solid var(--border);
}

.encrypt-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
}

.switch-label {
  position: relative;
  width: 38px;
  height: 20px;
  cursor: pointer;
}
.switch-label input { display: none; }
.switch-slider {
  position: absolute;
  inset: 0;
  background: var(--bg-card);
  border-radius: 10px;
  transition: background var(--transition);
}
.switch-slider::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  left: 2px;
  top: 2px;
  background: var(--text-muted);
  border-radius: 50%;
  transition: all var(--transition);
}
.switch-label input:checked + .switch-slider { background: var(--primary); }
.switch-label input:checked + .switch-slider::after { transform: translateX(18px); background: white; }
.switch-label input:disabled + .switch-slider { opacity: 0.3; }

.encrypt-text { font-size: 12px; color: var(--text-secondary); }
.encrypt-hint { font-size: 11px; color: var(--text-muted); margin-top: 6px; }

/* ===== Avatars ===== */
.avatar-gradient {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}
.avatar-sm-gradient {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

/* ===== Chat main ===== */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  padding: 14px 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
}
.chat-header h2 { font-size: 15px; font-weight: 600; }
.header-info { flex: 1; }
.header-sub { font-size: 12px; color: var(--text-muted); }
.header-badge { font-size: 16px; }

.menu-btn {
  display: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  align-items: center;
  justify-content: center;
}

/* Passphrase bar */
.passphrase-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(108, 92, 231, 0.1);
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  color: var(--primary-light);
  flex-wrap: wrap;
}
.passphrase-bar input {
  padding: 6px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  color: var(--text);
  font-size: 13px;
  width: 180px;
}
.icon-btn-sm {
  background: none;
  color: var(--text-muted);
  font-size: 14px;
  padding: 4px;
}
.apply-btn {
  padding: 6px 14px;
  background: var(--primary);
  color: white;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

/* ===== Messages ===== */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--bg-chat);
}

.loading-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  color: var(--text-muted);
  font-size: 13px;
}
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-light);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.load-more {
  align-self: center;
  padding: 8px 20px;
  border-radius: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  color: var(--primary-light);
  font-size: 12px;
  margin-bottom: 8px;
  transition: all var(--transition);
}
.load-more:hover { background: var(--primary-bg); }

.system-msg {
  text-align: center;
  padding: 4px 0;
}
.system-msg span {
  font-size: 12px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.03);
  padding: 3px 14px;
  border-radius: 12px;
}

.msg-row {
  display: flex;
  gap: 10px;
  max-width: 70%;
  align-items: flex-end;
}
.msg-wrap.is-self .msg-row { margin-left: auto; }
.msg-wrap.is-other .msg-row { margin-right: auto; }

.msg-body { display: flex; flex-direction: column; min-width: 0; }

.msg-meta { display: flex; gap: 8px; align-items: baseline; margin-bottom: 3px; }
.msg-name { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
.msg-time { font-size: 11px; color: var(--text-muted); }
.msg-time-self { font-size: 11px; color: var(--text-muted); text-align: right; margin-bottom: 3px; }

/* Bubbles */
.bubble {
  padding: 10px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  position: relative;
}

.is-self .bubble {
  background: var(--msg-self);
  color: white;
  border-bottom-right-radius: 6px;
}
.is-other .bubble {
  background: var(--msg-other);
  color: var(--text);
  border-bottom-left-radius: 6px;
  border: 1px solid var(--border);
}

.lock-badge {
  font-size: 11px;
  margin-right: 4px;
}

.encrypted-bubble {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  opacity: 0.7;
}
.encrypted-bubble.failed { color: var(--danger); }
.lock-icon { font-size: 16px; }

.img-bubble {
  padding: 4px;
  overflow: hidden;
}
.img-bubble img {
  max-width: 280px;
  max-height: 280px;
  border-radius: 12px;
  cursor: pointer;
  display: block;
  object-fit: cover;
}

.file-bubble {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
}
.file-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(108, 92, 231, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--primary-light);
}
.file-detail { flex: 1; min-width: 0; }
.fname {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.fsize { font-size: 11px; color: var(--text-muted); margin-top: 2px; display: block; }
.dl-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
  flex-shrink: 0;
  text-decoration: none;
}
.is-self .dl-btn { color: rgba(255, 255, 255, 0.8); }
.is-self .dl-btn:hover { background: rgba(255, 255, 255, 0.15); }
.is-other .dl-btn { color: var(--primary-light); }
.is-other .dl-btn:hover { background: var(--primary-bg); }

/* Typing */
.typing-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 20px;
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-chat);
}
.typing-dots {
  display: flex;
  gap: 3px;
}
.typing-dots span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: blink 1.4s infinite;
}
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }

/* Input area */
.input-area {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  padding: 14px 16px;
}

.input-tools {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
}

.tool-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}
.tool-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
}

.input-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

textarea {
  flex: 1;
  padding: 12px 16px;
  background: var(--bg-input);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  color: var(--text);
  font-size: 14px;
  resize: none;
  min-height: 44px;
  max-height: 120px;
  line-height: 1.4;
  transition: border-color var(--transition), box-shadow var(--transition);
}
textarea::placeholder { color: var(--text-muted); }
textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.15);
}

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
  flex-shrink: 0;
}
.send-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: scale(1.05);
}
.send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* Preview */
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: pointer;
  backdrop-filter: blur(8px);
}
.preview-overlay img {
  max-width: 90%;
  max-height: 90%;
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}

.mobile-overlay { display: none; }

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -280px;
    top: 0;
    bottom: 0;
    z-index: 100;
    transition: left 0.3s;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
  }
  .sidebar.open { left: 0; }
  .mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
  }
  .menu-btn { display: flex; }
  .msg-row { max-width: 85%; }
}
</style>
