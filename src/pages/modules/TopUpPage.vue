<template>
  <q-page class="topup-page">

    <div v-if="!cardData" class="nfc-scan-screen">
      <q-icon
        :name="nfcStatus === 'scanning' || nfcStatus === 'verifying' ? 'wifi_tethering' : 'nfc'"
        size="96px"
        class="nfc-icon"
        :class="{ 'nfc-icon--scanning': nfcStatus === 'scanning' || nfcStatus === 'verifying' }"
      />
      <p class="nfc-text">{{ nfcStatusText }}</p>
      <button
        v-if="nfcStatus !== 'scanning' && nfcStatus !== 'verifying'"
        class="nfc-scan-btn"
        @click="startNfcScan"
      >
        {{ nfcStatus === 'error' || nfcStatus === 'unsupported' ? 'Try again' : 'Scan card' }}
      </button>
      <p v-if="nfcError" class="nfc-error-text">{{ nfcError }}</p>
    </div>

    <div v-else class="topup-inner">
      <div class="card-details">
        <div class="card-details-header">
          <q-icon name="nfc" size="18px" />
          <span>Card detected</span>
          <q-btn
            flat
            dense
            no-caps
            icon="refresh"
            label="Rescan"
            size="sm"
            class="card-badge-close"
            @click="resetCard"
          />
        </div>

        <div class="card-details-row">
          <span class="card-details-label">TDID</span>
          <span class="card-details-value">{{ tdid }}</span>
        </div>
        <div v-if="cardData.user" class="card-details-row">
          <span class="card-details-label">User</span>
          <span class="card-details-value">{{ cardData.user }}</span>
        </div>
        <div v-if="cardData.balance !== undefined" class="card-details-row">
          <span class="card-details-label">Balance</span>
          <span class="card-details-value">{{ cardData.balance }} lei</span>
        </div>
      </div>

      <h1 class="topup-title">Select prepaid amount</h1>

      <!-- Grid sume -->
      <div class="amounts-grid">
        <button
          v-for="amount in amounts"
          :key="amount"
          class="amount-btn"
          :class="{ selected: selectedAmount === amount }"
          @click="selectAmount(amount)"
        >
          {{ amount }} lei
        </button>

        <button
          class="amount-btn amount-other"
          :class="{ selected: selectedAmount === 'other' }"
          @click="selectOther"
        >
          Other...
        </button>
      </div>

      <!-- Sumar suma selectata -->
      <transition name="fade">
        <div v-if="finalAmount" class="amount-summary">
          <span class="summary-label">Total to top up</span>
          <span class="summary-value">{{ finalAmount }} lei</span>
        </div>
      </transition>
    </div>

    <!-- Sticky bottom actions -->
    <div v-if="cardData" class="bottom-actions">
      <button
        class="btn-proceed"
        :disabled="!finalAmount"
        @click="onCashOut"
      >
        Confirm Top Up
      </button>
      <button class="btn-secondary" @click="onCheckBalance">
        Check Balance
      </button>
    </div>

    <!-- Dialog custom amount -->
    <q-dialog v-model="showCustomDialog" @show="onDialogShow">
      <q-card class="custom-dialog">
        <div class="dialog-body">
          <p class="dialog-label">Custom amount</p>
          <div class="dialog-input-row">
            <input
              ref="customInputRef"
              v-model="tempAmount"
              type="number"
              inputmode="numeric"
              placeholder="0"
              class="dialog-number-input"
              @wheel.prevent
              @keyup.enter="onDialogOk"
            />
            <span class="dialog-currency">lei</span>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn btn-cancel" @click="onDialogCancel">Cancel</button>
          <button
            class="dialog-btn btn-ok"
            :disabled="!(Number(tempAmount) > 0)"
            @click="onDialogOk"
          >
            OK
          </button>
        </div>
      </q-card>
    </q-dialog>

    <!-- Payment method dialog -->
    <q-dialog v-model="showPaymentModal" class="payment-method-dialog">
      <q-card class="payment-method-card">
        <div class="pm-header">
          <span class="pm-title">How would you like to pay?</span>
          <q-btn flat round dense icon="close" class="pm-close" @click="showPaymentModal = false" />
        </div>
        <div class="pm-options">
          <div class="pm-option pm-option--cash" @click="onCashClick">
            <div class="pm-option-icon">
              <q-icon name="payments" />
            </div>
            <span class="pm-option-label">Cash</span>
          </div>
          <div
            class="pm-option pm-option--card"
            :class="{ 'pm-option--loading': store.isFetching === 'pay_card' }"
            @click="onCardClick"
          >
            <div class="pm-option-icon">
              <q-spinner v-if="store.isFetching === 'pay_card'" size="28px" />
              <q-icon v-else name="credit_card" />
            </div>
            <span class="pm-option-label">Card</span>
          </div>
        </div>
      </q-card>
    </q-dialog>

    <!-- Cash confirm dialog -->
    <q-dialog v-model="showCashConfirm" persistent class="cash-confirm-dialog">
      <q-card class="cash-confirm-card">
        <div class="cc-icon-wrap">
          <q-icon name="payments" />
        </div>
        <div class="cc-title">Cash Payment</div>
        <div class="cc-amount" v-html="_formattedPrice(finalAmount * 100)" />
        <div class="cc-desc">Have you received the above amount from the customer?</div>
        <div class="cc-actions">
          <q-btn outline no-caps label="Cancel" class="cc-btn cc-btn--cancel" v-close-popup />
          <q-btn
            no-caps
            label="Confirm"
            class="cc-btn cc-btn--confirm"
            :loading="store.isFetching === 'pay_cash'"
            :disable="store.isFetching === 'pay_cash'"
            @click="onConfirmCash"
          />
        </div>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, nextTick, watch, onBeforeUnmount } from 'vue'
import { Cookies, Notify } from 'quasar'
import { useDataStore } from 'stores/data.js'
import _formattedPrice from '../../mixins/formattedPrice.js'

const store = useDataStore()

const tdid = ref(null)
const cardData = ref(null)
const nfcStatus = ref('idle') // idle | scanning | verifying | error | unsupported
const nfcError = ref('')
let nfcAbortController = null
let nfcReader = null

const nfcStatusText = computed(() => {
  if (nfcStatus.value === 'scanning') return 'Hold the card near the back of your phone...'
  if (nfcStatus.value === 'verifying') return 'Verifying card...'
  if (nfcStatus.value === 'unsupported') return 'NFC is not supported on this device'
  if (nfcStatus.value === 'error') return 'Could not read the card'
  return "Scan the customer's card to continue"
})

async function startNfcScan () {
  nfcError.value = ''

  if (!('NDEFReader' in window)) {
    nfcStatus.value = 'unsupported'
    return
  }

  try {
    nfcAbortController = new AbortController()
    const ndef = new NDEFReader()
    nfcReader = ndef
    await ndef.scan({ signal: nfcAbortController.signal })
    nfcStatus.value = 'scanning'
    document.addEventListener('visibilitychange', onVisibilityChange)

    ndef.onreading = (event) => {
      // Guard against events delivered after the session was already stopped
      // (e.g. leftover reads while tearing down on navigation/tab-hide).
      if (nfcStatus.value !== 'scanning') return

      stopNfcScan()

      const records = Array.from(event.message.records).map((record) => ({
        recordType: record.recordType,
        data: decodeRecordData(record)
      }))

      const scannedTdid = extractTdid(records)
      if (!scannedTdid) {
        onNfcError('This card does not contain a valid TDID')
        return
      }

      tdid.value = scannedTdid
      verifyCard(scannedTdid)
    }

    ndef.onreadingerror = () => {
      if (nfcStatus.value !== 'scanning') return
      stopNfcScan()
      onNfcError('The card could not be read, try again')
    }
  } catch (e) {
    console.error('NFC scan error:', e)
    onNfcError(e.message || 'Could not start NFC scan')
  }
}

function stopNfcScan () {
  document.removeEventListener('visibilitychange', onVisibilityChange)

  if (nfcReader) {
    nfcReader.onreading = null
    nfcReader.onreadingerror = null
    nfcReader = null
  }

  nfcAbortController?.abort()
  nfcAbortController = null
}

function onVisibilityChange () {
  if (document.hidden && nfcStatus.value === 'scanning') {
    stopNfcScan()
    nfcStatus.value = 'idle'
  }
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

function onNfcError (message) {
  nfcStatus.value = 'error'
  nfcError.value = message
  Notify.create({ type: 'negative', message, position: 'top' })
}

async function verifyCard (scannedTdid) {
  nfcStatus.value = 'verifying'

  try {
    const data = await store.check_prepaid_card(scannedTdid)
    cardData.value = data
    Cookies.set('scannedCard', { tdid: scannedTdid, ...data }, { path: '/', expires: 1 })
    nfcStatus.value = 'idle'
  } catch (e) {
    onNfcError(e?.response?.data?.message || 'Card verification failed')
  }
}

function resetCard () {
  stopNfcScan()
  tdid.value = null
  cardData.value = null
  nfcStatus.value = 'idle'
  nfcError.value = ''
  Cookies.remove('scannedCard', { path: '/' })
}

onBeforeUnmount(() => {
  stopNfcScan()
  Cookies.remove('scannedCard', { path: '/' })
})

const amounts = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550]
const selectedAmount = ref(null)
const customAmount = ref('')
const showCustomDialog = ref(false)
const tempAmount = ref('')
const customInputRef = ref(null)

const showPaymentModal = ref(false)
const showCashConfirm = ref(false)

const finalAmount = computed(() => {
  if (selectedAmount.value === 'other') return Number(customAmount.value) || null
  return selectedAmount.value
})

watch(() => store.isFetching, (val, oldVal) => {
  if (oldVal === 'pay_cash' && val === null) showCashConfirm.value = false
  if (oldVal === 'pay_card' && val === null) showPaymentModal.value = false
})

const selectAmount = (amount) => {
  selectedAmount.value = amount
  customAmount.value = ''
}

const selectOther = () => {
  tempAmount.value = customAmount.value
  showCustomDialog.value = true
}

const onDialogShow = async () => {
  await nextTick()
  customInputRef.value?.focus()
}

const onDialogOk = () => {
  if (!(Number(tempAmount.value) > 0)) return
  selectedAmount.value = 'other'
  customAmount.value = tempAmount.value
  showCustomDialog.value = false
}

const onDialogCancel = () => {
  showCustomDialog.value = false
}

const onCashOut = () => {
  showPaymentModal.value = true
}

const onCashClick = () => {
  showPaymentModal.value = false
  showCashConfirm.value = true
}

const onCardClick = () => {
  if (store.isFetching === 'pay_card') return
  store.pay_card({ amount: finalAmount.value, source: 'topup' })
}

const onConfirmCash = () => {
  store.pay_cash({ amount: finalAmount.value }, () => {
    showCashConfirm.value = false
    selectedAmount.value = null
    customAmount.value = ''
  })
}

const onCheckBalance = () => {
  console.log('Check balance')
}
</script>

<style lang="scss">
.topup-page {
  display: flex;
  flex-direction: column;
  background: white;
  min-height: 100vh;
  padding: 0 16px;
}

/* NFC scan screen */
.nfc-scan-screen {
  flex: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  padding: 2rem;
  text-align: center;
}

.nfc-icon {
  color: #2e7d1f;
  animation: nfc-pulse 2s ease-in-out infinite;

  &--scanning {
    animation: nfc-spin 1s linear infinite;
  }
}

.nfc-text {
  font-size: 1.1rem;
  font-weight: 500;
  color: #1a1a1a;
  margin: 0;
}

.nfc-scan-btn {
  padding: 14px 28px;
  border: none;
  border-radius: 999px;
  background: #2e7d1f;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;

  &:active {
    transform: scale(0.96);
  }

  &:hover {
    background: #3a9426;
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

/* Card details */
.card-details {
  width: 100%;
  border-radius: 12px;
  background: #f0f9ee;
  border: 1px solid #2e7d1f;
  padding: 10px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-details-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #2e7d1f;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 2px;

  span {
    flex: 1;
  }

  .card-badge-close {
    color: #2e7d1f;
  }
}

.card-details-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;

  .card-details-label {
    color: #5a7a52;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    flex-shrink: 0;
  }

  .card-details-value {
    color: #1a1a1a;
    font-family: monospace;
    word-break: break-all;
    text-align: right;
  }
}

.card-details-empty {
  font-size: 12px;
  color: #5a7a52;
  margin: 2px 0 0;
}

.topup-inner {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 32px 0 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.topup-title {
  font-size: 22px;
  font-weight: 500;
  color: #1a1a1a;
  text-align: center;
}

.amounts-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 5px;
  width: 100%;

  @media (max-width: 550px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.amount-btn {
  aspect-ratio: 1;
  border: none;
  border-radius: 6px;
  background: #2e7d1f;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    transform: scale(0.95);
  }

  &.selected {
    background: #1a4f10;
    outline: 3px solid #f5c518;
    outline-offset: -3px;
  }

  &:hover:not(.selected) {
    background: #3a9426;
  }
}

.amount-other {
  background: #8db800;

  &:hover:not(.selected) {
    background: #a0d400;
  }

  &.selected {
    background: #5a7a00;
    outline: 3px solid #f5c518;
    outline-offset: -3px;
  }
}

/* Sumar */
.amount-summary {
  width: 100%;
  background: #f0f9ee;
  border: 1.5px solid #2e7d1f;
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .summary-label {
    font-size: 14px;
    color: #555;
  }

  .summary-value {
    font-size: 22px;
    font-weight: 700;
    color: #2e7d1f;
  }
}

/* Sticky footer */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 14px 20px calc(env(safe-area-inset-bottom) + 14px);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 10;
}

.btn-proceed {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 10px;
  background: #2e7d1f;
  color: white;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.3px;
  transition: background 0.15s, transform 0.1s, opacity 0.15s;

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: #3a9426;
  }
}

.btn-secondary {
  width: 100%;
  padding: 12px;
  border: 1.5px solid #ddd;
  border-radius: 10px;
  background: transparent;
  color: #555;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: #2e7d1f;
    color: #2e7d1f;
  }
}

/* Dialog custom amount */
.custom-dialog {
  width: 300px;
  border-radius: 14px !important;
  overflow: hidden;
}

.dialog-body {
  padding: 28px 24px 20px;
}

.dialog-label {
  font-size: 13px;
  font-weight: 500;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin: 0 0 12px;
}

.dialog-input-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  border-bottom: 2px solid #2e7d1f;
  padding-bottom: 6px;
}

.dialog-number-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 36px;
  font-weight: 700;
  color: #1a1a1a;
  width: 100%;

  &::placeholder {
    color: #ddd;
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  &[type='number'] {
    -moz-appearance: textfield;
  }
}

.dialog-currency {
  font-size: 18px;
  font-weight: 600;
  color: #2e7d1f;
  flex-shrink: 0;
}

.dialog-actions {
  display: flex;
  border-top: 1px solid #f0f0f0;
}

.dialog-btn {
  flex: 1;
  padding: 16px;
  border: none;
  background: transparent;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;

  &:active {
    background: #f5f5f5;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
}

.btn-cancel {
  color: #999;
  border-right: 1px solid #f0f0f0;
}

.btn-ok {
  color: #2e7d1f;
}

/* Transition */
.fade-enter-active {
  transition: opacity 0.18s ease;
}

.fade-leave-active {
  transition: opacity 0.2s ease, max-height 0.25s ease, padding-top 0.25s ease, padding-bottom 0.25s ease;
  max-height: 100px;
  overflow: hidden;
}

.fade-enter-from {
  opacity: 0;
}

.fade-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* ── Payment method dialog ─────────────────────────── */
.payment-method-dialog {
  .q-dialog__inner {
    padding: 16px;
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

    .pm-title {
      font-size: 17px;
      font-weight: 700;
      color: $dark;
    }

    .pm-close {
      color: $grey-6;
    }
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

    &--cash {
      background: #F0FAF5;

      .pm-option-icon {
        background: #D4F0E3;
        color: #1D9E75;
      }

      .pm-option-label { color: #1D9E75; }
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
}

/* ── Cash confirm dialog ──────────────────────────── */
.cash-confirm-dialog {
  .cash-confirm-card {
    width: 300px;
    border-radius: 20px !important;

    > div:not(.q--avoid-card-border) {
      border-radius: 20px !important;
    }
    padding: 28px 24px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14) !important;
  }

  .cc-icon-wrap {
    width: 64px;
    height: 64px;
    border-radius: 20px;
    background: #D4F0E3;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;

    .q-icon {
      font-size: 32px;
      color: #1D9E75;
    }
  }

  .cc-title {
    font-size: 18px;
    font-weight: 700;
    color: $dark;
    margin-top: 2px;
  }

  .cc-amount {
    font-size: 28px;
    font-weight: 800;
    color: $dark;
    margin: 4px 0 2px;
  }

  .cc-desc {
    font-size: 13px;
    color: $grey-6;
    text-align: center;
    margin-bottom: 10px;
  }

  .cc-actions {
    display: flex;
    gap: 10px;
    width: 100%;
    margin-top: 6px;

    .cc-btn {
      flex: 1;
      height: 44px;
      border-radius: 10px !important;
      font-size: 14px;
      font-weight: 600;

      &--cancel {
        border-color: rgba(0, 0, 0, 0.18) !important;
        color: $grey-7 !important;
      }

      &--confirm {
        background: #1D9E75 !important;
        color: white !important;
      }
    }
  }
}
</style>

