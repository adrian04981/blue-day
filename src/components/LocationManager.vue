<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { db } from '../firebase/config';
import { ref as dbRef, set, onValue, remove } from "firebase/database";

const locations = ref([]);
const loading = ref(false);
const error = ref(null);
const locationUpdateInterval = ref(null);

const updateLocation = () => {
  loading.value = true;
  error.value = null;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          id: Date.now(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString()
        };

        const locationRef = dbRef(db, 'locations/' + locationData.id);
        set(locationRef, locationData)
          .then(() => console.log('Ubicación guardada'))
          .catch(err => console.error('Error guardando:', err));

        loading.value = false;
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

onMounted(() => {
  updateLocation();
  locationUpdateInterval.value = setInterval(updateLocation, 30000);

  const locationsRef = dbRef(db, 'locations');
  onValue(locationsRef, (snapshot) => {
    const data = snapshot.val();
    locations.value = data ? Object.values(data) : [];
  });
});

onUnmounted(() => {
  if (locationUpdateInterval.value) {
    clearInterval(locationUpdateInterval.value);
  }
});

const deleteLocation = (id) => {
  const locationRef = dbRef(db, 'locations/' + id);
  remove(locationRef);
};
</script>

<template>
  <div class="location-manager">
    <h2>Rastreador de Ubicación</h2>
    
    <div v-if="loading" class="status">
      Actualizando ubicación...
    </div>
    
    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div class="locations-list">
      <div v-for="location in locations" :key="location.id" class="location-item">
        <p>Latitud: {{ location.latitude }}</p>
        <p>Longitud: {{ location.longitude }}</p>
        <p>Fecha: {{ new Date(location.timestamp).toLocaleString() }}</p>
        <button @click="deleteLocation(location.id)">Eliminar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.location-manager {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.location-item {
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.status, .error {
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  text-align: center;
}

.error {
  background-color: #ffebee;
  color: #c62828;
}

button {
  background-color: #ff4444;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
