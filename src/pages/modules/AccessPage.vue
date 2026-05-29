<template>
  <div class="access-page">
    <div class="access-inner">
<!--      <pre v-if="debugData" style="background:#000;color:#0f0;padding:12px;border-radius:8px;text-align:left;font-size:12px;word-break:break-all;white-space:pre-wrap;margin-bottom:12px">{{ debugData }}</pre>-->

      <div v-if="!ticketHtml" class="idle-state">
        <q-icon
          :name="isChecking ? 'wifi_tethering' : 'qr_code_scanner'"
          size="96px"
          color="white"
          :class="isChecking ? 'scanning-icon' : 'scan-icon'"
        />
        <p class="idle-text">{{ isChecking ? 'Scanning...' : 'Scan the ticket' }}</p>
      </div>

      <div v-else class="result-card" :class="isError ? 'result-card--error' : 'result-card--success'" @click="reset">
        <q-icon
          :name="isError ? 'cancel' : 'check_circle'"
          size="72px"
          :class="isError ? 'error-icon' : 'success-icon'"
        />
        <p class="result-text" v-html="ticketHtml" />
        <span class="ticket-code-badge">#{{ lastCode }}</span>
      </div>

    </div>

    <input
      id="scanInput"
      ref="scanInputRef"
      v-model="scanValue"
      @keydown="onKeyDown"
      @blur="setTimeout(() => scanInputRef?.focus(), 50)"
      style="opacity: 0; pointer-events: none; position: absolute"
      autocomplete="off"
      inputmode="none"
      autofocus
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useDataStore } from 'stores/data.js'

const storeData = useDataStore()
const scanValue = ref('')
const ticketHtml = ref('')
const lastCode = ref('')
const debugData = ref(null)
const isChecking = ref(false)
const isError = ref(false)
const scanInputRef = ref(null)
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
  if (e.key !== 'Enter') return

  const scannedValue = scanValue.value
  scanValue.value = ''

  await requestWakeLock()

  lastCode.value = scannedValue
  isChecking.value = true
  ticketHtml.value = ''

  const data = await storeData.check_ticket(scannedValue)
  debugData.value = JSON.stringify(data, null, 2)
  isChecking.value = false

  if (!data) {
    isError.value = true
    ticketHtml.value = 'Eroare de rețea'
    return
  }

  isError.value = !!data.error
  ticketHtml.value = data.message
}

function reset() {
  ticketHtml.value = ''
  isError.value = false
  lastCode.value = ''
  setTimeout(() => scanInputRef.value?.focus(), 50)
}

onMounted(() => {
  scanInputRef.value?.focus()
})

onBeforeUnmount(() => {
  wakeLock?.release()
})
</script>

<style lang="scss">
.access-page {
  position: relative;
  height: calc(100dvh - 60px);
  background-color: #1e1e2e;
  display: flex;
  align-items: center;
  justify-content: center;

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

    .scanning-icon {
      animation: spin 1s linear infinite;
    }

    .idle-text {
      font-size: 1.4rem;
      font-weight: 400;
      margin: 0;
      letter-spacing: 0.03em;
    }
  }

  .result-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem 2rem;
    border-radius: 20px;
    animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

    &--success {
      background-color: #4fb907;
      .success-icon { color: white; }
    }

    &--error {
      background-color: #ce0b0b;
      .error-icon {
        color: white;
        animation: shake 0.4s ease;
      }
    }

    .result-text {
      font-size: 1.3rem;
      line-height: 135%;
      font-weight: 500;
      margin: 0;
      color: white;
    }

    .ticket-code-badge {
      position: absolute;
      top: 0.6rem;
      right: 0.8rem;
      font-size: 0.7rem;
      font-family: monospace;
      color: rgba(255, 255, 255, 0.5);
      letter-spacing: 0.05em;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 0.85; transform: scale(1); }
  50%       { opacity: 1;    transform: scale(1.06); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes pop {
  0%   { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1);   opacity: 1; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-10px); }
  40%       { transform: translateX(10px); }
  60%       { transform: translateX(-8px); }
  80%       { transform: translateX(8px); }
}
</style>
