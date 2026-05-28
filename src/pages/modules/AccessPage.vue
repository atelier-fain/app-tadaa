<template>
  <div class="access-page" :style="bgColor ? { backgroundColor: bgColor } : {}">
    <div class="access-inner">

      <div v-if="!ticketHtml" class="idle-state">
        <q-icon name="qr_code_scanner" size="96px" color="white" class="scan-icon" />
        <p class="idle-text">Scan the ticket</p>
      </div>

      <div v-else class="result-state">
        <div id="ticketCode" v-html="ticketHtml" />
      </div>

    </div>

    <input
      id="scanInput"
      ref="scanInputRef"
      v-model="scanValue"
      @keydown="onKeyDown"
      style="opacity: 0; pointer-events: none; position: absolute"
      autocomplete="off"
    />
  </div>
</template>

<script setup>
import {ref, onMounted, onBeforeUnmount, computed} from 'vue'
import { api } from 'src/boot/axios'
import {useDataStore} from "stores/data.js";
import { useQuasar } from 'quasar'

const storeData = useDataStore()
const $q = useQuasar()
const scanValue = ref('')
const ticketHtml = ref('')
const bgColor = ref('#1e1e2e')
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


  const dismiss = $q.notify({
    message: 'Se verifică...',
    spinner: true,
    timeout: 0,
    position: 'top',
  })

  const data = await storeData.check_ticket(scannedValue)
  dismiss()

  if (data.valid && data.istoday) {
    ticketHtml.value = `<strong><big>${data.qty} &times; </big> brățară ${data.color}</strong><br><br>Bilet valid<br>${data.ticket_name}<br>${data.ticket_category}`
    bgColor.value = '#4fb907'
  } else if (data.valid && !data.istoday) {
    ticketHtml.value = `Bilet valabil în altă zi:<br>${data.ticket_name}<br>${data.ticket_category}`
    bgColor.value = '#FF9800'
  } else {
    ticketHtml.value = 'Bilet invalid'
    bgColor.value = '#ce0b0b'
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

<style lang="scss">
.access-page {
  height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.35s ease;

  .access-inner {
    text-align: center;
    color: white;
    padding: 2rem;
    width: 100%;
    max-width: 480px;
  }

  .idle-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
    opacity: 0.85;

    .scan-icon {
      animation: pulse 2s ease-in-out infinite;
    }

    .idle-text {
      font-size: 1.4rem;
      font-weight: 400;
      margin: 0;
      letter-spacing: 0.03em;
    }
  }

  .result-state {
    #ticketCode {
      font-size: 1.6rem;
      line-height: 1.7;
      font-weight: 500;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 0.85; transform: scale(1); }
  50%       { opacity: 1;    transform: scale(1.06); }
}
</style>
