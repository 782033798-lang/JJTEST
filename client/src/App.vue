<template>
  <div class="app">
    <transition name="view-switch" mode="out-in">
      <LoginPanel v-if="!user" @login="handleLogin" key="login" />
      <ChatRoom v-else :user="user" @logout="handleLogout" key="chat" />
    </transition>
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
}

.view-switch-enter-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.view-switch-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.view-switch-enter-from {
  opacity: 0;
  transform: scale(0.97);
}

.view-switch-leave-to {
  opacity: 0;
  transform: scale(1.02);
}
</style>
