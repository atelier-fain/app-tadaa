<template>
  <!-- Modal metodă de plată -->
  <q-dialog v-model="showPaymentModal" class="payment-method-dialog">
    <q-card class="payment-method-card">
      <div class="pm-header">
        <span class="pm-title">How would you like to pay?</span>
        <q-btn flat round dense icon="close" class="pm-close" @click="showPaymentModal = false" />
      </div>
      <div class="pm-options">
        <div class="pm-option pm-option--festival" @click="onFestivalCardClick">
          <div class="pm-option-icon">
            <q-icon name="nfc" />
          </div>
          <span class="pm-option-label">Card Festival</span>
        </div>
        <div
          class="pm-option pm-option--card"
          :class="{ 'pm-option--loading': dataStore.isFetching === 'pay_card' }"
          @click="onCardClick"
        >
          <div class="pm-option-icon">
            <q-spinner v-if="dataStore.isFetching === 'pay_card'" size="28px" />
            <q-icon v-else name="credit_card" />
          </div>
          <span class="pm-option-label">Card</span>
        </div>
      </div>
    </q-card>
  </q-dialog>

  <!-- Ecran scanare Card Festival -->
  <q-dialog v-model="showFestivalScan" maximized persistent class="festival-scan-dialog">
    <q-card class="festival-scan-card">
      <div class="festival-scan-header">
        <q-btn flat round dense icon="arrow_back" @click="closeFestivalScan" />
        <span class="festival-scan-title">Card Festival</span>
      </div>

      <div v-if="festivalStatus !== 'insufficient'" class="nfc-scan-screen">
        <q-icon
          :name="['scanning', 'charging'].includes(festivalStatus) ? 'wifi_tethering' : 'nfc'"
          size="96px"
          class="nfc-icon"
          :class="{
            'nfc-icon--scanning': ['scanning', 'charging'].includes(festivalStatus),
            'nfc-icon--retry': ['error', 'unsupported'].includes(festivalStatus)
          }"
          @click="['error', 'unsupported'].includes(festivalStatus) && onFestivalScanClick()"
        />
        <p class="nfc-text">{{ festivalStatusText }}</p>
        <div class="nfc-amount" v-html="formatPrice(cartTotal, true)" />
        <p v-if="festivalError" class="nfc-error-text">{{ festivalError }}</p>
        <button
          v-if="['error', 'unsupported'].includes(festivalStatus)"
          class="nfc-scan-btn"
          @click="onFestivalScanClick"
        >
          Try again
        </button>
      </div>

      <div v-else class="festival-result festival-result--error">
        <q-icon name="cancel" size="64px" />
        <p class="festival-result-title">Insufficient credit</p>
        <p class="festival-result-desc">This card doesn't have enough balance for <span v-html="formatPrice(cartTotal, true)" />.</p>
        <p class="festival-result-desc">Your Balance is: <strong v-html="_formattedPrice(Number(festivalCardData?.balance) || 0)" /></p>
        <button class="nfc-scan-btn" @click="backToPaymentMethods">Try another payment method</button>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Cookies } from 'quasar'
import { useDataStore } from 'stores/data.js'
import _formattedPrice from '../mixins/formattedPrice.js'

const props = defineProps({
  cart: { type: Array, required: true },
  cartTotal: { type: Number, required: true },
  modelValue: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const dataStore = useDataStore()
const isDev = !!process.env.DEV

const cartTotal = computed(() => props.cartTotal)

function formatPrice (value, withUnit = false) {
  return `${Math.floor(value)}<sup>00</sup>${withUnit ? ' lei' : ''}`
}

// ----- metodă de plată -----
// v-model pe modelValue (nu ref+defineExpose): starea se controlează din
// părinte printr-un simplu boolean reactiv, care ajunge la copil prin props
// indiferent de momentul în care se montează — fără nicio dependență de
// timing-ul de mount al componentei/ref-ului.
const showPaymentModal = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

function onCardClick () {
  if (dataStore.isFetching === 'pay_card') return

  dataStore.pay_card({
    totalPrice: cartTotal.value * 100,
    user: dataStore.user?.user,
    source: 'vendor',
    cart: props.cart,
    // explicit, ca vendor să nu depindă tacit de default-ul din viva-pay.js
    paymentMethod: 'card'
  })
}

// ----- Card Festival (scanare NFC + debitare sold) -----
const showFestivalScan = ref(false)
const festivalStatus = ref('idle') // idle | scanning | insufficient | charging | error | unsupported
const festivalError = ref('')
const festivalTdid = ref(null)
const festivalCardData = ref(null)
let nfcAbortController = null
let nfcReader = null

const festivalStatusText = computed(() => {
  if (festivalStatus.value === 'scanning') return 'Hold the card near the back of your phone...'
  if (festivalStatus.value === 'charging') return 'Charging card...'
  if (festivalStatus.value === 'unsupported') return 'NFC is not supported on this device'
  if (festivalStatus.value === 'error') return 'Could not read the card'
  return "Scan the customer's festival card to pay"
})

function onFestivalCardClick () {
  showPaymentModal.value = false
  showFestivalScan.value = true
  resetFestivalScan()
}

function closeFestivalScan () {
  stopNfcScan()
  showFestivalScan.value = false
}

function backToPaymentMethods () {
  stopNfcScan()
  showFestivalScan.value = false
  showPaymentModal.value = true
}

function resetFestivalScan () {
  stopNfcScan()
  festivalStatus.value = 'idle'
  festivalError.value = ''
  festivalTdid.value = null
  festivalCardData.value = null
  onFestivalScanClick()
}

function onFestivalScanClick () {
  if (isDev) {
    simulateFestivalScan()
    return
  }
  startFestivalNfcScan()
}

async function startFestivalNfcScan () {
  festivalError.value = ''

  if (!('NDEFReader' in window)) {
    festivalStatus.value = 'unsupported'
    return
  }

  try {
    nfcAbortController = new AbortController()
    const ndef = new NDEFReader()
    nfcReader = ndef
    await ndef.scan({ signal: nfcAbortController.signal })
    festivalStatus.value = 'scanning'

    ndef.onreading = (event) => {
      if (festivalStatus.value !== 'scanning') return
      stopNfcScan()

      const records = Array.from(event.message.records).map((record) => ({
        recordType: record.recordType,
        data: decodeRecordData(record)
      }))

      const scannedTdid = extractTdid(records)
      if (!scannedTdid) {
        onFestivalNfcError('This card does not contain a valid TDID')
        return
      }

      festivalTdid.value = scannedTdid
      chargeFestivalCard(scannedTdid)
    }

    ndef.onreadingerror = () => {
      if (festivalStatus.value !== 'scanning') return
      stopNfcScan()
      onFestivalNfcError('The card could not be read, try again')
    }
  } catch (e) {
    onFestivalNfcError(e.message || 'Could not start NFC scan')
  }
}

function stopNfcScan () {
  if (nfcReader) {
    nfcReader.onreading = null
    nfcReader.onreadingerror = null
    nfcReader = null
  }
  nfcAbortController?.abort()
  nfcAbortController = null
}

function decodeRecordData (record) {
  try {
    if (record.recordType === 'text' || record.recordType === 'url') {
      const decoder = new TextDecoder(record.encoding || 'utf-8')
      return decoder.decode(record.data)
    }
    return Array.from(new Uint8Array(record.data.buffer))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join(' ')
  } catch (e) {
    return '(unreadable)'
  }
}

function extractTdid (records) {
  for (const record of records) {
    if (record.recordType !== 'text') continue
    try {
      const parsed = JSON.parse(record.data)
      if (parsed?.TDID) return String(parsed.TDID)
    } catch (e) {
      // not JSON, ignore
    }
  }
  return null
}

function simulateFestivalScan () {
  festivalError.value = ''
  festivalTdid.value = '5cf92e5a323132060400025b'
  chargeFestivalCard(festivalTdid.value)
}

function onFestivalNfcError (message) {
  festivalStatus.value = 'error'
  festivalError.value = message
}

// Plată directă: cardul scanat (TDID) se trimite direct la purchase_prepaid_card,
// fără pasul de check_prepaid_card în prealabil — backend-ul face verificarea de
// sold și debitarea într-un singur apel. La succes, plata se predă lui /callback:
// acolo se creează comanda și se arată confirmarea — la fel ca la Card (Viva) și
// celelalte fluxuri de plată, ca să existe un singur loc pentru ecranul de confirmare.
async function chargeFestivalCard (scannedTdid) {
  festivalStatus.value = 'charging'

  try {
    const data = await dataStore.purchase_prepaid_card(scannedTdid, cartTotal.value * 100)
    festivalCardData.value = data

    if (data.error) {
      festivalStatus.value = 'insufficient'
      return
    }

    dataStore.pendingOrder = { source: 'vendor', cart: props.cart }
    Cookies.set('pendingOrder', dataStore.pendingOrder, { path: '/', expires: 1 })

    stopNfcScan()
    showFestivalScan.value = false
    router.push({
      name: 'tickets-callback',
      query: {
        status: 'success',
        amount: String(cartTotal.value * 100),
        paymentMethod: 'prepaid',
        balance: String(data.balance)
      }
    })
  } catch (e) {
    onFestivalNfcError(e?.response?.data?.message || 'Payment could not be confirmed')
  }
}

onBeforeUnmount(() => {
  stopNfcScan()
})
</script>

<style scoped lang="scss">
/* Modal metodă de plată */
.payment-method-dialog {
  :deep(.q-dialog__inner) {
    padding: 16px;
  }
}
.payment-method-card {
  width: 320px;
  border-radius: 20px !important;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14) !important;
}
.pm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 18px 4px;
}
.pm-title {
  font-size: 17px;
  font-weight: 700;
  color: $dark;
}
.pm-close {
  color: $grey-6;
}
.pm-options {
  display: flex;
  gap: 10px;
  padding: 14px 18px 20px;
}
.pm-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 110px;
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.1s;
  user-select: none;
  touch-action: manipulation;

  &:active {
    transform: scale(0.95);
  }

  .pm-option-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;

    .q-icon {
      font-size: 28px;
    }
  }

  .pm-option-label {
    font-size: 14px;
    font-weight: 700;
  }

  &--festival {
    background: #FEF6E7;

    .pm-option-icon {
      background: #FBE8BE;
      color: #B7791F;
    }

    .pm-option-label { color: #B7791F; }
  }

  &--card {
    background: #F0F4FF;

    .pm-option-icon {
      background: #D6E4FF;
      color: #2563EB;
    }

    .pm-option-label { color: #2563EB; }
  }

  &--loading {
    opacity: 0.6;
    pointer-events: none;
  }
}

/* Ecran scanare Card Festival */
.festival-scan-dialog {
  :deep(.q-dialog__inner) {
    padding: 0;
  }
}
.festival-scan-card {
  width: 100%;
  height: 100%;
  background: $grey-1;
  display: flex;
  flex-direction: column;
  border-radius: 0 !important;
}
.festival-scan-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.75rem 1rem 0.5rem;
  flex-shrink: 0;
}
.festival-scan-title {
  font-size: 18px;
  font-weight: 700;
  color: $dark;
}

.nfc-scan-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.1rem;
  padding: 2rem;
  text-align: center;
}
.nfc-icon {
  color: $primary;
  animation: nfc-pulse 2s ease-in-out infinite;

  &--scanning {
    animation: nfc-spin 1s linear infinite;
  }

  &--retry {
    color: $negative;
    cursor: pointer;
  }
}
.nfc-text {
  font-size: 1.1rem;
  font-weight: 500;
  color: $dark;
  margin: 0;
}
.nfc-amount {
  font-size: 26px;
  font-weight: 800;
  color: $dark;

  :deep(sup) {
    font-size: 14px;
  }
}
.nfc-scan-btn {
  padding: 14px 28px;
  border: none;
  border-radius: 999px;
  background: $primary;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  min-height: 48px;
  transition: transform 0.1s, opacity 0.15s;

  &:active {
    transform: scale(0.96);
  }
}
.nfc-error-text {
  font-size: 13px;
  color: $negative;
  margin: 0;
}

@keyframes nfc-pulse {
  0%, 100% { opacity: 0.85; transform: scale(1); }
  50%       { opacity: 1;    transform: scale(1.06); }
}

@keyframes nfc-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Rezultat plată Card Festival */
.festival-result {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
  color: #D32F2F;
}
.festival-result-title {
  font-size: 20px;
  font-weight: 700;
  color: $dark;
  margin: 0;
}
.festival-result-desc {
  font-size: 14px;
  color: $grey-6;
  margin: 0;
  max-width: 280px;
}
</style>
