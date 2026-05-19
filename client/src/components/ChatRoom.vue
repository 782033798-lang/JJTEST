<template>
  <div class="chat-room">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <div class="brand">
          <div class="brand-icon">
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="14" fill="url(#g2)" />
              <path d="M14 19C14 17.3431 15.3431 16 17 16H31C32.6569 16 34 17.3431 34 19V27C34 28.6569 32.6569 30 31 30H26L21 35V30H17C15.3431 30 14 28.6569 14 27V19Z" fill="white" opacity="0.95"/>
              <circle cx="21" cy="23" r="1.5" fill="url(#g2)" />
              <circle cx="27" cy="23" r="1.5" fill="url(#g2)" />
              <defs><linearGradient id="g2" x1="0" y1="0" x2="48" y2="48"><stop stop-color="#7c6ef0"/><stop offset="0.5" stop-color="#6c5ce7"/><stop offset="1" stop-color="#9b8afb"/></linearGradient></defs>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">SecureChat</span>
            <span class="brand-tag">v1.0</span>
          </div>
        </div>
      </div>

      <!-- Current user -->
      <div class="current-user">
        <div class="user-avatar" :style="{ background: user.avatar }">
          {{ user.username.charAt(0).toUpperCase() }}
          <span class="status-dot online"></span>
        </div>
        <div class="user-detail">
          <span class="uname">{{ user.username }}</span>
          <span class="ustatus">
            <svg v-if="user.passphrase" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            {{ user.passphrase ? '加密模式' : '标准模式' }}
          </span>
        </div>
        <button class="icon-btn logout-btn" @click="$emit('logout')" title="退出登录">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            频道
          </div>
          <div
            class="nav-item"
            :class="{ active: activeChannel === 'public' }"
            @click="switchChannel('public')"
          >
            <span class="nav-icon">#</span>
            <span class="nav-text">公共聊天</span>
            <span class="nav-count" v-if="onlineUsers.length">{{ onlineUsers.length }}</span>
          </div>
        </div>

        <div class="nav-section">
          <div class="nav-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            在线用户
            <span class="user-count">{{ dmableUsers.length }}</span>
          </div>
          <div
            v-for="u in dmableUsers"
            :key="u.username"
            class="nav-item dm-item"
            :class="{ active: activeChannel === getDmChannel(u.username) }"
            @click="openDm(u)"
          >
            <div class="avatar-sm" :style="{ background: u.avatar }">
              {{ u.username.charAt(0).toUpperCase() }}
              <span class="status-dot-sm online"></span>
            </div>
            <span class="nav-text">{{ u.username }}</span>
          </div>
          <div v-if="!dmableUsers.length" class="empty-hint">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>
            暂无其他在线用户
          </div>
        </div>
      </nav>

      <!-- Sidebar footer -->
      <div class="sidebar-footer">
        <div class="encrypt-control">
          <div class="encrypt-info">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>{{ encryptionEnabled ? '加密已开启' : '加密已关闭' }}</span>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="encryptionEnabled" :disabled="!user.passphrase" />
            <span class="switch-track">
              <span class="switch-thumb"></span>
            </span>
          </label>
        </div>
        <div v-if="!user.passphrase" class="encrypt-hint">登录时设置暗号以启用加密</div>
      </div>
    </aside>

    <!-- Main chat area -->
    <main class="chat-main">
      <!-- Header -->
      <div class="chat-header">
        <button class="menu-btn" @click="sidebarOpen = !sidebarOpen">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div class="header-info">
          <h2>{{ channelTitle }}</h2>
          <span class="header-sub">
            <span class="sub-dot" :class="{ encrypted: encryptionEnabled && user.passphrase }"></span>
            {{ channelSubtitle }}
          </span>
        </div>
        <div v-if="encryptionEnabled && user.passphrase" class="header-badge" title="加密模式">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        </div>
      </div>

      <!-- Passphrase prompt -->
      <div v-if="showPassphrasePrompt" class="passphrase-bar">
        <div class="passphrase-inner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          <span>输入暗号查看加密消息</span>
          <input
            v-model="viewPassphrase"
            :type="showViewPass ? 'text' : 'password'"
            placeholder="输入暗号"
            @keydown.enter="applyPassphrase"
          />
          <button @click="showViewPass = !showViewPass" class="pass-toggle">
            <svg v-if="!showViewPass" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </button>
          <button @click="applyPassphrase" class="pass-apply">解密</button>
          <button @click="showPassphrasePrompt = false" class="pass-close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages" ref="messagesContainer">
        <div v-if="loading" class="loading-wrap">
          <div class="spinner"></div>
          <span>加载消息中...</span>
        </div>
        <button v-if="hasMore && !loading" class="load-more" @click="loadMore">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 11 12 6 7 11"/><line x1="12" y1="18" x2="12" y2="6"/></svg>
          加载更多历史消息
        </button>

        <template v-for="(msg, idx) in messages" :key="msg.id">
          <!-- Date separator -->
          <div v-if="shouldShowDate(idx)" class="date-separator">
            <span>{{ formatDate(msg.createdAt) }}</span>
          </div>

          <!-- System message -->
          <div v-if="msg.type === 'system'" class="system-msg">
            <div class="system-msg-inner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ msg.content }}
            </div>
          </div>

          <!-- Chat message -->
          <div
            v-else
            :class="['msg-wrap', msg.username === user.username ? 'is-self' : 'is-other']"
          >
            <div class="msg-row">
              <!-- Other user avatar -->
              <div class="avatar-msg" :style="{ background: msg.avatar }" v-if="msg.username !== user.username && shouldShowAvatar(idx)">
                {{ msg.username.charAt(0).toUpperCase() }}
              </div>
              <div class="avatar-spacer" v-else-if="msg.username !== user.username"></div>

              <div class="msg-body">
                <!-- Name + time for others -->
                <div class="msg-meta" v-if="msg.username !== user.username && shouldShowAvatar(idx)">
                  <span class="msg-name">{{ msg.username }}</span>
                  <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
                </div>

                <!-- Time for self -->
                <div class="msg-meta-self" v-if="msg.username === user.username && shouldShowTime(idx)">
                  <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
                </div>

                <!-- Encrypted (locked) -->
                <div v-if="msg.encrypted && !msg._decrypted && msg._decryptFailed !== true" class="bubble encrypted-bubble" @click="showPassphrasePrompt = true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  <span>加密消息 — 点击解密</span>
                </div>

                <!-- Decrypt failed -->
                <div v-else-if="msg.encrypted && msg._decryptFailed" class="bubble encrypted-bubble failed">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  <span>暗号不匹配，无法解密</span>
                </div>

                <!-- Text message -->
                <div v-else-if="msg.type === 'text'" class="bubble text-bubble">
                  <span v-if="msg.encrypted" class="lock-badge" title="已加密">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  </span>
                  {{ msg._displayContent || msg.content }}
                </div>

                <!-- Image message -->
                <div v-else-if="msg.type === 'image'" class="bubble img-bubble">
                  <img
                    :src="getFileUrl(msg.fileUrl)"
                    :alt="msg.fileName"
                    @click="previewSrc = getFileUrl(msg.fileUrl)"
                    loading="lazy"
                  />
                </div>

                <!-- File message -->
                <div v-else-if="msg.type === 'file'" class="bubble file-bubble">
                  <div class="file-icon-wrap">
                    <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div class="file-detail">
                    <span class="fname">{{ msg.fileName }}</span>
                    <span class="fsize">{{ formatSize(msg.fileSize) }}</span>
                  </div>
                  <a :href="getFileUrl(msg.fileUrl)" :download="msg.fileName" class="dl-btn" title="下载文件">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Typing indicator -->
      <div v-if="currentTyping.length" class="typing-bar">
        <div class="typing-indicator">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
        <span>{{ currentTyping.join('、') }} 正在输入...</span>
      </div>

      <!-- Input area -->
      <div class="input-area">
        <div class="input-container">
          <div class="input-tools">
            <button class="tool-btn" @click="$refs.imageInput.click()" title="发送图片">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            </button>
            <button class="tool-btn" @click="$refs.fileInput.click()" title="发送文件">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
            </button>
            <div v-if="encryptionEnabled && user.passphrase" class="encrypt-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              加密
            </div>
          </div>
          <div class="input-row">
            <textarea
              v-model="inputText"
              :placeholder="encryptionEnabled && user.passphrase ? '输入加密消息...' : '输入消息... (Enter 发送)'"
              @keydown.enter.exact.prevent="sendText"
              @input="onTyping"
              rows="1"
            ></textarea>
            <button class="send-btn" @click="sendText" :disabled="!inputText.trim()" title="发送">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <input ref="imageInput" type="file" accept="image/*" multiple style="display:none" @change="handleFile($event, 'image')" />
      <input ref="fileInput" type="file" multiple style="display:none" @change="handleFile($event, 'file')" />
    </main>

    <!-- Image preview overlay -->
    <Teleport to="body">
      <transition name="preview-fade">
        <div v-if="previewSrc" class="preview-overlay" @click="previewSrc = null">
          <button class="preview-close">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <img :src="previewSrc" @click.stop />
        </div>
      </transition>
    </Teleport>

    <!-- Mobile overlay -->
    <transition name="fade">
      <div v-if="sidebarOpen" class="mobile-overlay" @click="sidebarOpen = false"></div>
    </transition>
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

function shouldShowAvatar(idx) {
  if (idx === 0) return true
  const prev = messages.value[idx - 1]
  const curr = messages.value[idx]
  return prev.username !== curr.username || prev.type === 'system'
}

function shouldShowTime(idx) {
  if (idx === 0) return true
  const prev = messages.value[idx - 1]
  const curr = messages.value[idx]
  if (prev.username !== curr.username) return true
  const diff = new Date(curr.createdAt) - new Date(prev.createdAt)
  return diff > 5 * 60 * 1000
}

function shouldShowDate(idx) {
  if (idx === 0) return true
  const prev = messages.value[idx - 1]
  const curr = messages.value[idx]
  const d1 = new Date(prev.createdAt)
  const d2 = new Date(curr.createdAt)
  return d1.toDateString() !== d2.toDateString()
}

function formatDate(s) {
  if (!s) return ''
  const d = new Date(s)
  const now = new Date()
  const diff = now - d
  if (diff < 86400000 && d.getDate() === now.getDate()) return '今天'
  if (diff < 172800000) return '昨天'
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
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
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function formatSize(b) {
  if (!b) return ''
  if (b < 1024) return b + ' B'
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1048576).toFixed(1) + ' MB'
}
</script>

<style scoped>
/* ===== Layout ===== */
.chat-room {
  width: 100%;
  height: 100%;
  display: flex;
  background: var(--bg);
  position: relative;
}

/* ===== Sidebar ===== */
.sidebar {
  width: 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  filter: drop-shadow(0 2px 8px rgba(124, 110, 240, 0.25));
}

.brand-text {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.brand-name {
  font-weight: 700;
  font-size: 16px;
  background: linear-gradient(135deg, var(--text), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-tag {
  font-size: 10px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.04);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

/* Current user */
.current-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.01);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.status-dot {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2.5px solid var(--bg-secondary);
}

.status-dot.online {
  background: var(--success);
}

.user-detail {
  flex: 1;
  min-width: 0;
}

.uname {
  font-weight: 600;
  font-size: 14px;
  display: block;
}

.ustatus {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.ustatus svg {
  color: var(--success);
}

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

.logout-btn:hover {
  background: rgba(248, 113, 113, 0.1);
  color: var(--danger);
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.nav-section {
  padding: 8px 10px 4px;
}

.nav-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 4px 10px 10px;
}

.nav-label svg {
  opacity: 0.5;
}

.user-count {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.06);
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition);
  margin-bottom: 2px;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.nav-item.active {
  background: var(--primary-bg);
  color: var(--primary-light);
  font-weight: 600;
}

.nav-icon {
  font-size: 17px;
  font-weight: 800;
  width: 24px;
  text-align: center;
  color: var(--text-muted);
}

.nav-item.active .nav-icon {
  color: var(--primary-light);
}

.nav-count {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 8px;
  border-radius: 10px;
  color: var(--text-muted);
}

.nav-item.active .nav-count {
  background: rgba(124, 110, 240, 0.15);
  color: var(--primary-light);
}

.avatar-sm {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 11px;
  flex-shrink: 0;
  position: relative;
}

.status-dot-sm {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid var(--bg-secondary);
}

.status-dot-sm.online {
  background: var(--success);
}

.empty-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
  padding: 12px;
  opacity: 0.7;
}

/* Sidebar footer */
.sidebar-footer {
  margin-top: auto;
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.1);
}

.encrypt-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.encrypt-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.encrypt-info svg {
  color: var(--primary-light);
  opacity: 0.7;
}

.switch {
  position: relative;
  cursor: pointer;
}

.switch input {
  display: none;
}

.switch-track {
  display: block;
  width: 40px;
  height: 22px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 11px;
  transition: background var(--transition);
  position: relative;
}

.switch-thumb {
  position: absolute;
  width: 16px;
  height: 16px;
  left: 3px;
  top: 3px;
  background: var(--text-muted);
  border-radius: 50%;
  transition: all var(--transition);
}

.switch input:checked + .switch-track {
  background: var(--primary);
}

.switch input:checked + .switch-track .switch-thumb {
  transform: translateX(18px);
  background: white;
}

.switch input:disabled + .switch-track {
  opacity: 0.3;
  cursor: not-allowed;
}

.encrypt-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 8px;
}

/* ===== Chat main ===== */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

/* Header */
.chat-header {
  padding: 14px 20px;
  background: rgba(19, 19, 40, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10;
}

.chat-header h2 {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.header-info {
  flex: 1;
}

.header-sub {
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 1px;
}

.sub-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
}

.sub-dot.encrypted {
  background: var(--primary);
  box-shadow: 0 0 6px var(--primary-glow);
}

.header-badge {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--primary-bg);
  color: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-btn {
  display: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--bg-hover);
  color: var(--text-secondary);
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text);
}

/* Passphrase bar */
.passphrase-bar {
  padding: 10px 20px;
  background: rgba(124, 110, 240, 0.08);
  border-bottom: 1px solid rgba(124, 110, 240, 0.15);
}

.passphrase-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--primary-light);
  flex-wrap: wrap;
}

.passphrase-inner input {
  padding: 7px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  color: var(--text);
  font-size: 13px;
  width: 180px;
  transition: all var(--transition);
}

.passphrase-inner input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-glow);
}

.pass-toggle, .pass-close {
  background: none;
  color: var(--text-muted);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all var(--transition);
}

.pass-toggle:hover, .pass-close:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
}

.pass-apply {
  padding: 7px 16px;
  background: var(--primary);
  color: white;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  transition: all var(--transition);
}

.pass-apply:hover {
  background: var(--primary-dark);
}

/* ===== Messages ===== */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(124, 110, 240, 0.03), transparent 60%),
    var(--bg-chat);
}

.loading-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  color: var(--text-muted);
  font-size: 13px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-light);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.load-more {
  align-self: center;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: 20px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  color: var(--primary-light);
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 16px;
  transition: all var(--transition);
}

.load-more:hover {
  background: var(--primary-bg);
  border-color: rgba(124, 110, 240, 0.2);
}

/* Date separator */
.date-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0 12px;
}

.date-separator span {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 4px 14px;
  border-radius: 10px;
  letter-spacing: 0.03em;
}

/* System message */
.system-msg {
  display: flex;
  justify-content: center;
  padding: 6px 0;
  animation: fadeIn 0.3s ease-out;
}

.system-msg-inner {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.02);
  padding: 5px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.system-msg-inner svg {
  opacity: 0.5;
  flex-shrink: 0;
}

/* Message rows */
.msg-wrap {
  animation: fadeInUp 0.25s ease-out;
}

.msg-row {
  display: flex;
  gap: 10px;
  max-width: 72%;
  align-items: flex-end;
}

.msg-wrap.is-self .msg-row {
  margin-left: auto;
  flex-direction: row-reverse;
}

.msg-wrap.is-other .msg-row {
  margin-right: auto;
}

.avatar-msg {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.avatar-spacer {
  width: 32px;
  flex-shrink: 0;
}

.msg-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.msg-meta {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 4px;
  padding-left: 2px;
}

.msg-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.msg-time {
  font-size: 11px;
  color: var(--text-muted);
  opacity: 0.7;
}

.msg-meta-self {
  text-align: right;
  margin-bottom: 4px;
  padding-right: 2px;
}

/* Bubbles */
.bubble {
  padding: 10px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.65;
  word-break: break-word;
  position: relative;
}

.is-self .bubble {
  background: var(--msg-self);
  color: white;
  border-bottom-right-radius: 6px;
  box-shadow: 0 2px 12px rgba(124, 110, 240, 0.2);
}

.is-other .bubble {
  background: var(--msg-other);
  color: var(--text);
  border-bottom-left-radius: 6px;
  border: 1px solid var(--border);
}

.lock-badge {
  display: inline-flex;
  align-items: center;
  margin-right: 4px;
  opacity: 0.7;
  vertical-align: middle;
}

.is-self .lock-badge svg {
  stroke: rgba(255, 255, 255, 0.7);
}

.is-other .lock-badge svg {
  stroke: var(--primary-light);
}

.encrypted-bubble {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  opacity: 0.7;
  transition: opacity var(--transition);
}

.encrypted-bubble:hover {
  opacity: 1;
}

.encrypted-bubble.failed {
  color: var(--danger);
  opacity: 0.8;
}

/* Image bubble */
.img-bubble {
  padding: 4px;
  overflow: hidden;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.img-bubble img {
  max-width: 300px;
  max-height: 300px;
  border-radius: 14px;
  cursor: pointer;
  display: block;
  object-fit: cover;
  transition: transform var(--transition), filter var(--transition);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.img-bubble img:hover {
  transform: scale(1.02);
  filter: brightness(1.05);
}

/* File bubble */
.file-bubble {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 240px;
}

.file-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(124, 110, 240, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--primary-light);
}

.is-self .file-icon-wrap {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.file-detail {
  flex: 1;
  min-width: 0;
}

.fname {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.fsize {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
  display: block;
}

.is-self .fsize {
  color: rgba(255, 255, 255, 0.6);
}

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

.is-self .dl-btn {
  color: rgba(255, 255, 255, 0.7);
}

.is-self .dl-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.is-other .dl-btn {
  color: var(--primary-light);
}

.is-other .dl-btn:hover {
  background: var(--primary-bg);
}

/* Typing indicator */
.typing-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 24px;
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-chat);
}

.typing-indicator {
  display: flex;
  gap: 3px;
  padding: 4px 0;
}

.typing-indicator .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--primary-light);
  opacity: 0.4;
  animation: typingBounce 1.4s infinite;
}

.typing-indicator .dot:nth-child(2) { animation-delay: 0.15s; }
.typing-indicator .dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}

/* Input area */
.input-area {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  padding: 16px 20px;
}

.input-container {
  background: var(--bg-input);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  overflow: hidden;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.input-container:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.input-tools {
  display: flex;
  gap: 2px;
  padding: 8px 12px 0;
  align-items: center;
}

.tool-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
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

.encrypt-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  color: var(--primary-light);
  background: var(--primary-bg);
  padding: 4px 10px;
  border-radius: 6px;
}

.input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding: 4px 8px 8px 12px;
}

textarea {
  flex: 1;
  padding: 8px 4px;
  background: transparent;
  border: none;
  color: var(--text);
  font-size: 14px;
  resize: none;
  min-height: 36px;
  max-height: 120px;
  line-height: 1.5;
}

textarea::placeholder {
  color: var(--text-muted);
}

.send-btn {
  width: 40px;
  height: 40px;
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
  box-shadow: 0 4px 12px rgba(124, 110, 240, 0.3);
}

.send-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

/* Preview overlay */
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: pointer;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.preview-overlay img {
  max-width: 90%;
  max-height: 85%;
  border-radius: 12px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
  cursor: default;
}

.preview-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
  backdrop-filter: blur(8px);
}

.preview-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Transitions */
.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.25s ease;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.mobile-overlay { display: none; }

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -280px;
    top: 0;
    bottom: 0;
    z-index: 100;
    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 8px 0 32px rgba(0, 0, 0, 0.4);
  }

  .sidebar.open {
    left: 0;
  }

  .mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 99;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  .menu-btn {
    display: flex;
  }

  .msg-row {
    max-width: 88%;
  }

  .input-area {
    padding: 12px 12px;
  }
}
</style>
