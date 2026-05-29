<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  screen.orientation?.lock('portrait').catch(() => {})
})
</script>
