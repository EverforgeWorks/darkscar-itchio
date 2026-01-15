<template>
  <div id="app-wrapper">
    <div v-if="$route.path === '/'" class="landing">
      <h1>Darkscar Engine</h1>
      <router-link to="/debug" class="debug-launch-btn">Enter Debug Menu</router-link>
    </div>

    <router-view />
  </div>
</template>

<style>
/* Global Dark Theme */
body {
  margin: 0;
  background: #121212;
  font-family: 'Courier New', monospace;
}
.landing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
.debug-launch-btn {
  padding: 15px 30px;
  background: #ffcc00;
  color: black;
  text-decoration: none;
  font-weight: bold;
  border-radius: 4px;
}
</style>
