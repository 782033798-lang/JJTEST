<template>
  <div class="login-panel">
    <div class="login-card">
      <div class="login-icon">💬</div>
      <h1>加入聊天</h1>
      <p class="subtitle">输入你的昵称即可开始</p>
      <form @submit.prevent="onSubmit">
        <input
          v-model="username"
          type="text"
          placeholder="请输入昵称"
          maxlength="20"
          autofocus
        />
        <button type="submit" :disabled="!username.trim()">进入聊天室</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['login'])
const username = ref('')

const AVATARS = [
  '#4f46e5', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
]

function onSubmit() {
  const name = username.value.trim()
  if (!name) return
  const color = AVATARS[Math.floor(Math.random() * AVATARS.length)]
  emit('login', { username: name, avatar: color })
}
</script>

<style scoped>
.login-panel {
  width: 100%;
  max-width: 420px;
  padding: 20px;
}

.login-card {
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 48px 36px;
  text-align: center;
}

.login-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-light);
  margin-bottom: 28px;
  font-size: 14px;
}

input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border);
  border-radius: 8px;
  font-size: 15px;
  transition: border-color 0.2s;
  margin-bottom: 16px;
}

input:focus {
  border-color: var(--primary);
}

button {
  width: 100%;
  padding: 12px;
  background: var(--primary);
  color: white;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: var(--primary-light);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
