<script setup>
import { ref, onMounted } from 'vue';
import { db } from '../firebase/config';
import { ref as dbRef, push, set, onValue, update } from "firebase/database";

const generatedLink = ref('');
const activeSessions = ref([]);
const selectedSession = ref(null);

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

const deactivateSession = async (sessionId) => {
  if (!confirm('¿Estás seguro de desactivar esta sesión?')) return;
  
  const sessionRef = dbRef(db, `sessions/${sessionId}`);
  await update(sessionRef, {
    active: false,
    deactivatedAt: Date.now()
  });
};

const viewSessionDetails = (session) => {
  selectedSession.value = session;
  // Suscribirse a actualizaciones en tiempo real de las ubicaciones
  const locationsRef = dbRef(db, `sessions/${session.id}/locations`);
  onValue(locationsRef, (snapshot) => {
    const locations = snapshot.val();
    if (locations) {
      selectedSession.value = {
        ...selectedSession.value,
        locations: Object.values(locations).sort((a, b) => b.timestamp - a.timestamp)
      };
    }
  });
};

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
    <div class="main-panel">
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
        <h3>Sesiones</h3>
        <div v-for="session in activeSessions" :key="session.id" class="session-item">
          <div class="session-header">
            <div class="session-status" :class="{ online: session.status?.online }">
              {{ session.status?.online ? 'En línea' : 'Desconectado' }}
            </div>
            <div class="session-actions">
              <button @click="viewSessionDetails(session)" class="action-btn view">
                Ver Detalles
              </button>
              <button 
                v-if="session.active" 
                @click="deactivateSession(session.id)" 
                class="action-btn deactivate"
              >
                Desactivar
              </button>
            </div>
          </div>
          <div class="session-time">
            <div>Creada: {{ new Date(session.createdAt).toLocaleString() }}</div>
            <div>Última actividad: {{ new Date(session.lastSeen).toLocaleString() }}</div>
            <div v-if="!session.active" class="deactivated">
              Desactivada: {{ new Date(session.deactivatedAt).toLocaleString() }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedSession" class="details-panel">
      <h2>Detalles de Sesión</h2>
      <div class="session-info">
        <h3>Estado: {{ selectedSession.active ? 'Activa' : 'Desactivada' }}</h3>
        <div class="locations-list">
          <h4>Ubicaciones</h4>
          <div v-for="location in selectedSession.locations" :key="location.timestamp" class="location-item">
            <div class="location-coords">
              <span>Lat: {{ location.latitude }}</span>
              <span>Long: {{ location.longitude }}</span>
            </div>
            <div class="location-time">
              {{ new Date(location.timestamp).toLocaleString() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  max-width: 1200px;
  margin: 2rem auto;
  padding: 20px;
}

.main-panel {
  background-color: var(--bg-secondary);
  border-radius: 12px;
  padding: 20px;
}

.details-panel {
  background-color: var(--bg-secondary);
  border-radius: 12px;
  padding: 20px;
  width: 400px;
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  margin-left: 10px;
}

.action-btn.view {
  background-color: var(--accent-primary);
  color: var(--bg-primary);
}

.action-btn.deactivate {
  background-color: var(--error);
  color: var(--text-primary);
}

.location-item {
  background-color: var(--card-bg);
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.location-coords {
  display: flex;
  justify-content: space-between;
  font-family: monospace;
  margin-bottom: 4px;
}

.location-time {
  font-size: 0.8em;
  color: var(--text-secondary);
}

.deactivated {
  color: var(--error);
  margin-top: 4px;
}

.generate-btn {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: var(--text-primary);
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: transform 0.2s;
  box-shadow: 0 4px 15px rgba(0, 255, 213, 0.2);
}

.generate-btn:hover {
  transform: translateY(-2px);
}

.link-container {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: var(--card-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.link-box {
  padding: 1rem;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  word-break: break-all;
  color: var(--accent-primary);
}

.sessions-list {
  margin-top: 2rem;
}

.session-item {
  padding: 1.5rem;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  margin-bottom: 1rem;
  border-radius: 8px;
  transition: transform 0.2s;
}

.session-item:hover {
  transform: translateY(-2px);
}

.session-status {
  color: var(--error);
  font-weight: bold;
}

.session-status.online {
  color: var(--success);
}

.session-time {
  font-size: 0.9em;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}
</style>
