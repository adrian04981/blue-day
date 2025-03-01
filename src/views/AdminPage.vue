<script setup>
import { ref, onMounted } from 'vue';
import { db } from '../firebase/config';
import { ref as dbRef, push, set, onValue } from "firebase/database";

const generatedLink = ref('');
const activeSessions = ref([]);

const generateSession = async () => {
  const sessionsRef = dbRef(db, 'sessions');
  const newSessionRef = push(sessionsRef);
  
  await set(newSessionRef, {
    createdAt: Date.now(),
    active: true,
    status: {
      online: false,
      lastSeen: null
    }
  });

  const sessionId = newSessionRef.key;
  generatedLink.value = `${window.location.origin}/session/${sessionId}`;
};

// Monitorear sesiones activas
onMounted(() => {
  const sessionsRef = dbRef(db, 'sessions');
  onValue(sessionsRef, (snapshot) => {
    const sessions = snapshot.val();
    if (sessions) {
      activeSessions.value = Object.entries(sessions)
        .map(([id, data]) => ({
          id,
          ...data,
          lastSeen: data.status?.lastSeen || data.createdAt
        }))
        .sort((a, b) => b.lastSeen - a.lastSeen);
    }
  });
});
</script>

<template>
  <div class="admin-container">
    <h1>Panel de Control</h1>
    <button @click="generateSession" class="generate-btn">
      Generar Nueva Sesión
    </button>

    <div v-if="generatedLink" class="link-container">
      <h3>Link Generado:</h3>
      <div class="link-box">
        {{ generatedLink }}
      </div>
    </div>

    <div class="sessions-list">
      <h3>Sesiones Activas</h3>
      <div v-for="session in activeSessions" :key="session.id" class="session-item">
        <div class="session-status" :class="{ online: session.status?.online }">
          {{ session.status?.online ? 'En línea' : 'Desconectado' }}
        </div>
        <div class="session-time">
          Última actividad: {{ new Date(session.lastSeen).toLocaleString() }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 20px;
}

.generate-btn {
  background-color: #4CAF50;
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1rem;
}

.link-container {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.link-box {
  padding: 1rem;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  word-break: break-all;
}

.sessions-list {
  margin-top: 2rem;
}

.session-item {
  padding: 1rem;
  border: 1px solid #ddd;
  margin-bottom: 1rem;
  border-radius: 4px;
}

.session-status {
  color: #f44336;
  &.online {
    color: #4CAF50;
  }
}

.session-time {
  font-size: 0.9em;
  color: #666;
  margin-top: 0.5rem;
}
</style>
