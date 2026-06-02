<template>
  <RouterView />
</template>

<script setup lang="ts">
</script>

<style>
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Pretendard', 'Apple SD Gothic Neo', -apple-system, sans-serif;
  background: #f5f4f0;
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
}

#app {
  min-height: 100vh;
}
</style>
