<template>
  <div class="login-panel">
    <div class="login-bg"></div>
    <div class="login-card">
      <div class="logo">
        <div class="logo-icon">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="12" fill="url(#g1)" />
            <path d="M12 16C12 14.8954 12.8954 14 14 14H26C27.1046 14 28 14.8954 28 16V22C28 23.1046 27.1046 24 26 24H22L18 28V24H14C12.8954 24 12 23.1046 12 22V16Z" fill="white" opacity="0.9"/>
            <defs><linearGradient id="g1" x1="0" y1="0" x2="40" y2="40"><stop stop-color="#6c5ce7"/><stop offset="1" stop-color="#a29bfe"/></linearGradient></defs>
          </svg>
        </div>
        <h1>SecureChat</h1>
      </div>
      <p class="subtitle">端到端加密的实时聊天</p>

      <form @submit.prevent="onSubmit">
        <div class="field">
          <label>昵称</label>
          <input
            v-model="username"
            type="text"
            placeholder="输入你的昵称"
            maxlength="20"
            autofocus
          />
        </div>
        <div class="field">
          <label>加密暗号 <span class="optional">(可选)</span></label>
          <div class="password-wrap">
            <input
              v-model="passphrase"
              :type="showPass ? 'text' : 'password'"
              placeholder="设置消息加密暗号"
            />
            <button type="button" class="eye-btn" @click="showPass = !showPass">
              {{ showPass ? '🙈' : '👁️' }}
            </button>
          </div>
          <p class="hint">设置后，消息将在本地加密后传输，对方需输入相同暗号才能查看</p>
        </div>
        <button type="submit" class="submit-btn" :disabled="!username.trim()">
          进入聊天
          <span class="arrow">→</span>
        </button>
      </form>
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
  'linear-gradient(135deg, #6c5ce7, #a29bfe)',
  'linear-gradient(135deg, #00cec9, #81ecec)',
  'linear-gradient(135deg, #e17055, #fab1a0)',
  'linear-gradient(135deg, #fdcb6e, #ffeaa7)',
  'linear-gradient(135deg, #d63031, #ff7675)',
  'linear-gradient(135deg, #00b894, #55efc4)',
  'linear-gradient(135deg, #e84393, #fd79a8)',
  'linear-gradient(135deg, #0984e3, #74b9ff)',
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
  max-width: 440px;
  padding: 20px;
  position: relative;
  z-index: 1;
}

.login-bg {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(108, 92, 231, 0.15), transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(0, 206, 201, 0.1), transparent 50%),
    var(--bg);
  z-index: -1;
}

.login-card {
  background: rgba(30, 30, 58, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-light);
  border-radius: 24px;
  padding: 48px 40px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 8px;
}

.logo h1 {
  font-size: 26px;
  font-weight: 700;
  background: linear-gradient(135deg, #fff, var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: var(--text-muted);
  margin-bottom: 36px;
  font-size: 14px;
}

.field {
  margin-bottom: 20px;
}

label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.optional {
  font-weight: 400;
  text-transform: none;
  color: var(--text-muted);
  letter-spacing: 0;
}

input {
  width: 100%;
  padding: 14px 16px;
  background: var(--bg-input);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 15px;
  transition: border-color var(--transition), box-shadow var(--transition);
}

input::placeholder {
  color: var(--text-muted);
}

input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.2);
}

.password-wrap {
  position: relative;
}

.password-wrap input {
  padding-right: 48px;
}

.eye-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  font-size: 18px;
  padding: 4px;
}

.hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
  line-height: 1.5;
}

.submit-btn {
  width: 100%;
  padding: 15px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all var(--transition);
  margin-top: 8px;
}

.submit-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(108, 92, 231, 0.4);
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.arrow {
  transition: transform var(--transition);
}

.submit-btn:hover:not(:disabled) .arrow {
  transform: translateX(4px);
}
</style>
