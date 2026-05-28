<template>
  <q-page class="q-pa-md access-page">
    <q-input v-model="input" autofocus dense flat borderless style="pointer-events: none"/>
    <h4 class="text-center text-white">Ready to scan</h4>
    <pre>{{ input }}</pre>

  </q-page>
</template>

<script setup>

import {ref, watch} from "vue";

const input = ref('')

watch(() => input.value, (value) => {
  console.log(value)
})
</script>

<style lang="scss">
.access-page {
  background-color: #333;
}

</style>
