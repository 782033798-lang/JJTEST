<template>
  <div class="login-panel">
    <!-- Animated background -->
    <div class="login-bg">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="grid-overlay"></div>
    </div>

    <div class="login-card">
      <!-- Logo -->
      <div class="logo-section">
        <div class="logo-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="14" fill="url(#logo-grad)" />
            <path d="M14 19C14 17.3431 15.3431 16 17 16H31C32.6569 16 34 17.3431 34 19V27C34 28.6569 32.6569 30 31 30H26L21 35V30H17C15.3431 30 14 28.6569 14 27V19Z" fill="white" opacity="0.95"/>
            <circle cx="21" cy="23" r="1.5" fill="url(#logo-grad)" />
            <circle cx="27" cy="23" r="1.5" fill="url(#logo-grad)" />
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="48" y2="48">
                <stop stop-color="#7c6ef0"/>
                <stop offset="0.5" stop-color="#6c5ce7"/>
                <stop offset="1" stop-color="#9b8afb"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 class="app-name">SecureChat</h1>
        <p class="tagline">安全、私密、即时通讯</p>
      </div>

      <!-- Features -->
      <div class="features">
        <div class="feature-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span>端到端加密</span>
        </div>
        <div class="feature-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <span>实时通讯</span>
        </div>
        <div class="feature-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          <span>文件传输</span>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="onSubmit" class="login-form">
        <div class="field">
          <label>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            昵称
          </label>
          <div class="input-wrap">
            <input
              v-model="username"
              type="text"
              placeholder="给自己取个名字"
              maxlength="20"
              autofocus
            />
          </div>
        </div>

        <div class="field">
          <label>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            加密暗号
            <span class="optional">可选</span>
          </label>
          <div class="input-wrap has-action">
            <input
              v-model="passphrase"
              :type="showPass ? 'text' : 'password'"
              placeholder="设置消息加密暗号"
            />
            <button type="button" class="input-action" @click="showPass = !showPass">
              <svg v-if="!showPass" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>
          <p class="hint">设置暗号后消息将加密传输，对方需输入相同暗号查看</p>
        </div>

        <button type="submit" class="submit-btn" :disabled="!username.trim()">
          <span class="btn-text">开始聊天</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </form>

      <p class="footer-note">无需注册，即开即用</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['login'])
const username = ref('')
const passphrase = ref('')
const showPass = ref(false)

const COLORS = [
  'linear-gradient(135deg, #7c6ef0, #b4abff)',
  'linear-gradient(135deg, #22d3ee, #67e8f9)',
  'linear-gradient(135deg, #f97316, #fdba74)',
  'linear-gradient(135deg, #f43f5e, #fb7185)',
  'linear-gradient(135deg, #34d399, #6ee7b7)',
  'linear-gradient(135deg, #a78bfa, #c4b5fd)',
  'linear-gradient(135deg, #fb923c, #fcd34d)',
  'linear-gradient(135deg, #38bdf8, #7dd3fc)',
]

function onSubmit() {
  const name = username.value.trim()
  if (!name) return
  const avatar = COLORS[Math.floor(Math.random() * COLORS.length)]
  emit('login', { username: name, avatar, passphrase: passphrase.value || '' })
}
</script>

<style scoped>
.login-panel {
  width: 100%;
  max-width: 460px;
  padding: 24px;
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.6s ease-out;
}

/* Animated background */
.login-bg {
  position: fixed;
  inset: 0;
  background: var(--bg);
  overflow: hidden;
  z-index: -1;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(124, 110, 240, 0.4), transparent 70%);
  top: -10%;
  right: -5%;
  animation: float 8s ease-in-out infinite;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.3), transparent 70%);
  bottom: 10%;
  left: -5%;
  animation: float 10s ease-in-out infinite 2s;
}

.orb-3 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(249, 115, 22, 0.2), transparent 70%);
  top: 40%;
  left: 50%;
  animation: float 12s ease-in-out infinite 4s;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* Card */
.login-card {
  background: rgba(19, 19, 40, 0.75);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  padding: 48px 40px 40px;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

/* Logo */
.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  display: inline-flex;
  margin-bottom: 16px;
  filter: drop-shadow(0 4px 12px rgba(124, 110, 240, 0.3));
}

.app-name {
  font-size: 30px;
  font-weight: 800;
  background: linear-gradient(135deg, #fff 20%, var(--primary-light) 80%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.tagline {
  color: var(--text-muted);
  font-size: 14px;
  margin-top: 6px;
  letter-spacing: 0.05em;
}

/* Features */
.features {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 36px;
  padding: 14px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.feature-item svg {
  color: var(--primary-light);
  opacity: 0.7;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.field label svg {
  color: var(--text-muted);
}

.optional {
  font-weight: 400;
  text-transform: none;
  color: var(--text-muted);
  letter-spacing: 0;
  font-size: 11px;
  margin-left: 4px;
  background: rgba(255, 255, 255, 0.05);
  padding: 1px 8px;
  border-radius: 4px;
}

.input-wrap {
  position: relative;
}

.input-wrap input {
  width: 100%;
  padding: 14px 16px;
  background: var(--bg-input);
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 15px;
  transition: all var(--transition);
}

.input-wrap.has-action input {
  padding-right: 48px;
}

.input-wrap input::placeholder {
  color: var(--text-muted);
}

.input-wrap input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
  background: rgba(255, 255, 255, 0.06);
}

.input-action {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all var(--transition);
}

.input-action:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
}

.hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
  line-height: 1.5;
  padding-left: 2px;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background: var(--msg-self);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all var(--transition);
  margin-top: 8px;
  position: relative;
  overflow: hidden;
}

.submit-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
  opacity: 0;
  transition: opacity var(--transition);
}

.submit-btn:hover:not(:disabled)::before {
  opacity: 1;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(124, 110, 240, 0.4);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.submit-btn svg {
  transition: transform var(--transition);
}

.submit-btn:hover:not(:disabled) svg {
  transform: translateX(4px);
}

.footer-note {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 20px;
  letter-spacing: 0.03em;
}

@media (max-width: 480px) {
  .login-card {
    padding: 36px 24px 32px;
    border-radius: 20px;
  }

  .features {
    gap: 12px;
  }

  .feature-item span {
    display: none;
  }
}
</style>
