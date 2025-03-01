<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '../firebase/config';
import { ref as dbRef, set, onValue, serverTimestamp } from "firebase/database";

const route = useRoute();
const sessionId = route.params.sessionId;
const loading = ref(false);
const error = ref(null);
const locationUpdateInterval = ref(null);
const isTracking = ref(false);

// Guardar sesión en localStorage
const saveSession = () => {
  localStorage.setItem('tracking_session', JSON.stringify({
    sessionId,
    startTime: Date.now()
  }));
};

// Actualizar estado de conexión
const updateConnectionState = () => {
  const connectedRef = dbRef(db, `.info/connected`);
  const sessionStatusRef = dbRef(db, `sessions/${sessionId}/status`);
  
  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      // Cuando nos desconectemos, actualizar estado
      set(sessionStatusRef, {
        online: true,
        lastSeen: serverTimestamp()
      });

      // Configurar actualización de estado al desconectarse
      set(sessionStatusRef, {
        online: false,
        lastSeen: serverTimestamp()
      }, { onDisconnect: true });
    }
  });
};

const updateLocation = () => {
  if (!sessionId || !isTracking.value) return;
  
  loading.value = true;
  error.value = null;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now()
        };

        const locationRef = dbRef(db, `sessions/${sessionId}/locations/${Date.now()}`);
        set(locationRef, locationData)
          .then(() => {
            loading.value = false;
          })
          .catch(err => {
            error.value = 'Error al guardar ubicación';
            loading.value = false;
          });
      },
      (err) => {
        error.value = `Error: ${err.message}`;
        loading.value = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }
};

// Iniciar tracking
const startTracking = () => {
  isTracking.value = true;
  saveSession();
  updateConnectionState();
  updateLocation();
  locationUpdateInterval.value = setInterval(updateLocation, 10000);
};

// Restaurar sesión
const restoreSession = () => {
  const savedSession = localStorage.getItem('tracking_session');
  if (savedSession) {
    const { sessionId: savedSessionId } = JSON.parse(savedSession);
    if (savedSessionId === sessionId) {
      startTracking();
    }
  }
};

onMounted(() => {
  const sessionRef = dbRef(db, `sessions/${sessionId}`);
  onValue(sessionRef, (snapshot) => {
    const session = snapshot.val();
    if (!session || !session.active) {
      error.value = 'Sesión no válida o inactiva';
      return;
    }
    
    if (!isTracking.value) {
      startTracking();
    }
  });

  // Restaurar sesión si existe
  restoreSession();

  // Manejar cuando la página se vuelve visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      restoreSession();
    }
  });
});

onUnmounted(() => {
  if (locationUpdateInterval.value) {
    clearInterval(locationUpdateInterval.value);
  }
});
</script>

<template>
  <div class="tracker-container">
    <div v-if="loading" class="status">
      Actualizando ubicación...
    </div>
    
    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div v-if="!error && isTracking" class="tracking-active">
      Rastreo activo y persistente
      <div class="session-info">ID Sesión: {{ sessionId }}</div>
    </div>
  </div>
</template>

<style scoped>
.tracker-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 20px;
  text-align: center;
}

.status, .error, .tracking-active {
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 4px;
}

.error {
  background-color: #ffebee;
  color: #c62828;
}

.tracking-active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.session-info {
  font-size: 0.8em;
  margin-top: 0.5em;
  opacity: 0.7;
}
</style>
