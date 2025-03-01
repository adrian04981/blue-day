<script setup>
// Remove existing imports
</script>

<template>
  <div class="app-container">
    <router-view></router-view>
  </div>
</template>

<style>
@import './assets/styles/variables.css';

body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  min-height: 100vh;
}

.app-container {
  min-height: 100vh;
  padding: 20px;
}

h1, h2, h3 {
  color: var(--text-primary);
  font-weight: 600;
}

button {
  font-family: inherit;
}
</style>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
