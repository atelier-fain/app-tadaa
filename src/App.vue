<template>
  <router-view />
  <div v-if="isLandscape" class="rotate-overlay">
    <q-icon name="screen_rotation" size="64px" />
    <p>Rotește dispozitivul</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const isLandscape = ref(false)

function checkOrientation() {
  isLandscape.value = window.matchMedia('(orientation: landscape)').matches
}

function lockOrientation() {
  screen.orientation?.lock('portrait').catch(() => {})
}

onMounted(() => {
  lockOrientation()
  checkOrientation()
  window.addEventListener('resize', checkOrientation)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkOrientation)
})
</script>

<style lang="scss">
.rotate-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #1e1e2e;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: white;

  .q-icon {
    animation: rotate-hint 1.5s ease-in-out infinite;
  }

  p {
    font-size: 1.2rem;
    font-weight: 500;
    margin: 0;
  }
}

@keyframes rotate-hint {
  0%, 100% { transform: rotate(0deg); }
  50%       { transform: rotate(90deg); }
}
</style>
