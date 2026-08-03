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

        <q-btn
          v-if="!isChecking"
          round
          size="lg"
          color="white"
          text-color="dark"
          icon="photo_camera"
          class="camera-trigger-btn"
          @click="openCameraScanner"
        />
        <p class="camera-trigger-text">or scan with camera</p>
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
      @blur="refocusInput"
      style="opacity: 0; pointer-events: none; position: absolute"
      autocomplete="off"
      inputmode="none"
      autofocus
    />

    <q-dialog v-model="showCameraDialog" maximized @hide="stopCameraScanner">
      <q-card class="camera-dialog-card">
        <q-btn
          icon="close"
          flat
          round
          size="lg"
          color="white"
          class="camera-close-btn"
          @click="showCameraDialog = false"
        />

        <div class="camera-video-section">
          <video ref="videoRef" class="camera-video" autoplay muted playsinline />
          <p v-if="!ticketHtml" class="camera-hint">Point the camera at the ticket's QR code</p>
        </div>

        <div class="camera-result-section">
          <div
            v-if="ticketHtml"
            class="result-card"
            :class="isError ? 'result-card--error' : 'result-card--success'"
          >
            <q-icon
              :name="isError ? 'cancel' : 'check_circle'"
              size="56px"
              :class="isError ? 'error-icon' : 'success-icon'"
            />
            <p class="result-text" v-html="ticketHtml" />
            <span class="ticket-code-badge">#{{ lastCode }}</span>
          </div>
          <div v-else-if="isChecking" class="camera-result-placeholder">
            <q-spinner color="white" size="2rem" />
            <p>Verifying...</p>
          </div>
          <div v-else class="camera-result-placeholder">
            <q-icon name="qr_code_scanner" size="2rem" color="white" />
            <p>The verification result will appear here</p>
          </div>
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useDataStore } from 'stores/data.js'
import QrScanner from 'qr-scanner'

const storeData = useDataStore()
const scanValue = ref('')
const ticketHtml = ref('')
const lastCode = ref('')
const debugData = ref(null)
const isChecking = ref(false)
const isError = ref(false)
const scanInputRef = ref(null)
const showCameraDialog = ref(false)
const videoRef = ref(null)
let wakeLock = null
let qrScanner = null
let cameraResumeTimeout = null

const successSound = new Audio('/sounds/success.mp3')
const errorSound = new Audio('/sounds/error.mp3')

function playResultSound(hasError) {
  const sound = hasError ? errorSound : successSound
  sound.currentTime = 0
  sound.play().catch((err) => console.error('Sound play error:', err))
}

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen')
    wakeLock.addEventListener('release', () => console.log('Wake Lock released'))
  } catch (err) {
    console.error(`${err.name}, ${err.message}`)
  }
}

async function processScan(scannedValue) {
  if (!scannedValue) return

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
    playResultSound(true)
    return
  }

  isError.value = !!data.error
  ticketHtml.value = data.message
  playResultSound(isError.value)
}

async function onKeyDown(e) {
  if (e.key !== 'Enter') return

  const scannedValue = scanValue.value
  scanValue.value = ''

  await processScan(scannedValue)
}

async function openCameraScanner() {
  ticketHtml.value = ''
  isError.value = false
  lastCode.value = ''
  showCameraDialog.value = true

  await nextTick()

  qrScanner = new QrScanner(
    videoRef.value,
    (result) => onCameraDecode(result.data),
    {
      highlightScanRegion: false,
      highlightCodeOutline: false,
      preferredCamera: 'environment',
      maxScansPerSecond: 5,
    }
  )

  try {
    await qrScanner.start()
  } catch (err) {
    console.error('Camera error:', err)
    showCameraDialog.value = false
  }
}

function stopCameraScanner() {
  clearTimeout(cameraResumeTimeout)
  qrScanner?.stop()
  qrScanner?.destroy()
  qrScanner = null
  showCameraDialog.value = false
  ticketHtml.value = ''
  isError.value = false
  lastCode.value = ''
  refocusInput()
}

async function onCameraDecode(code) {
  qrScanner?.stop()

  scanValue.value = code
  await processScan(code)
  scanValue.value = ''

  if (!showCameraDialog.value) return

  cameraResumeTimeout = setTimeout(async () => {
    ticketHtml.value = ''
    isError.value = false
    lastCode.value = ''

    if (!showCameraDialog.value) return

    try {
      await qrScanner?.start()
    } catch (err) {
      console.error('Camera resume error:', err)
    }
  }, 2500)
}

function refocusInput() {
  setTimeout(() => scanInputRef.value?.focus(), 50)
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
  clearTimeout(cameraResumeTimeout)
  wakeLock?.release()
  qrScanner?.stop()
  qrScanner?.destroy()
  qrScanner = null
})
</script>

<style lang="scss">
.access-page {
  position: relative;
  height: calc(100dvh - 50px);
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

    .camera-trigger-btn {
      margin-top: 0.8rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }

    .camera-trigger-text {
      font-size: 0.85rem;
      font-weight: 400;
      margin: 0;
      opacity: 0.7;
      letter-spacing: 0.02em;
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

.camera-dialog-card {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #000;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .camera-video-section {
    position: relative;
    flex: 0 0 60%;
    height: 60%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background-color: #000;
  }

  .camera-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .camera-close-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 2;
    background-color: rgba(0, 0, 0, 0.4);
  }

  .camera-hint {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    background-color: rgba(0, 0, 0, 0.55);
    padding: 0.6rem 1.2rem;
    border-radius: 999px;
    font-size: 0.95rem;
    margin: 0;
    text-align: center;
    white-space: nowrap;
    z-index: 1;
  }

  .camera-result-section {
    flex: 0 0 40%;
    height: 40%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    background-color: #1e1e2e;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.4);

    .result-card {
      width: 100%;
      max-width: 480px;
    }

    .camera-result-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6rem;
      color: rgba(255, 255, 255, 0.6);

      p {
        margin: 0;
        font-size: 0.95rem;
      }
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
