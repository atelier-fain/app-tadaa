<template>
  <div class="scanning" :style="{ backgroundColor: bgColor }">
    <pre>{{ test }}</pre>
    <input
      id="scanInput"
      ref="scanInputRef"
      v-model="scanValue"
      @keydown="onKeyDown"
      autocomplete="off"
    />
    <div id="ticketCode" v-html="ticketHtml" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { api } from 'src/boot/axios' // sau axios direct
const test = ref('')
const scanValue = ref('')
const ticketHtml = ref('')
const bgColor = ref('')
const scanInputRef = ref(null)
let focusInterval = null
let wakeLock = null

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen')
    wakeLock.addEventListener('release', () => console.log('Wake Lock released'))
  } catch (err) {
    console.error(`${err.name}, ${err.message}`)
  }
}

async function onKeyDown(e) {
  await requestWakeLock()
  if (e.key !== 'Enter') return

  const scannedValue = scanValue.value
  scanValue.value = ''

  try {
    test.value = scannedValue
    // const { data } = await api.post('/php/check_ticket.php', { code: scannedValue })
    //
    // if (data.valid && data.istoday) {
    //   ticketHtml.value = `<strong><big>${data.qty} &times; </big> brățară ${data.color}</strong><br><br>Bilet valid<br>${data.ticket_name}<br>${data.ticket_category}`
    //   bgColor.value = '#4fb907'
    // } else if (data.valid && !data.istoday) {
    //   ticketHtml.value = `Bilet valabil in alta zi:<br>${data.ticket_name}<br>${data.ticket_category}`
    //   bgColor.value = '#FF9800'
    // } else {
    //   ticketHtml.value = 'Bilet invalid'
    //   bgColor.value = '#ce0b0b'
    // }
  } catch (err) {
    console.error(err)
  }
}

onMounted(() => {
  focusInterval = setInterval(() => {
    scanInputRef.value?.focus()
  }, 1000)
})

onBeforeUnmount(() => {
  clearInterval(focusInterval)
  wakeLock?.release()
})
</script>
