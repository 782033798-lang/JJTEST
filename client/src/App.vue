<template>
  <div class="app">
    <LoginPanel v-if="!user" @login="handleLogin" />
    <ChatRoom v-else :user="user" @logout="handleLogout" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LoginPanel from './components/LoginPanel.vue'
import ChatRoom from './components/ChatRoom.vue'

const user = ref(null)

onMounted(() => {
  const saved = localStorage.getItem('chat_user')
  if (saved) {
    try { user.value = JSON.parse(saved) } catch { /* ignore */ }
  }
})

function handleLogin(u) {
  user.value = u
  localStorage.setItem('chat_user', JSON.stringify(u))
}

function handleLogout() {
  user.value = null
  localStorage.removeItem('chat_user')
}
</script>

<style scoped>
.app {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(108, 92, 231, 0.08), transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(0, 206, 201, 0.05), transparent 50%);
}
</style>
