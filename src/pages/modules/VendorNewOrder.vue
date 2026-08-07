<template>
  <q-page class="new-order-page">
    <div class="page-header">
      <span class="page-title">New order</span>
    </div>

    <q-tabs
      v-model="activeCategory"
      dense
      no-caps
      align="left"
      class="category-tabs"
      indicator-color="transparent"
      active-color="primary"
    >
      <q-tab
        v-for="cat in vendorStore.categories"
        :key="cat"
        :name="cat"
        :label="cat"
        class="category-tab"
        :class="{ 'tab-active': activeCategory === cat }"
      />
    </q-tabs>

    <div class="products-list">
      <div
        v-for="product in productsInCategory"
        :key="product.id"
        class="product-row"
      >
        <div class="product-main">
          <div class="product-info">
            <span class="product-name">{{ product.name }}</span>
            <span class="product-price">{{ product.price }} RON</span>
          </div>
          <div class="product-actions">
            <q-btn
              v-if="product.extraGroups?.length"
              no-caps
              flat
              label="Extra"
              :icon-right="expandedId === product.id ? 'expand_less' : 'expand_more'"
              class="extra-btn"
              @click="toggleExpand(product)"
            />
            <q-btn
              v-if="expandedId !== product.id"
              no-caps
              unelevated
              label="Add"
              class="add-btn-row"
              @click="quickAdd(product)"
            />
          </div>
        </div>

        <div v-if="expandedId === product.id" class="extras-panel">
          <div
            v-for="group in product.extraGroups"
            :key="group.title"
            class="extras-group"
          >
            <div class="group-title">
              {{ group.title }} <span class="group-max">(max {{ group.max }} selections)</span>
            </div>
            <div
              v-for="opt in group.options"
              :key="opt.name"
              class="extras-row"
              :class="{ 'extras-row--disabled': !isSelected(opt, group) && selectedCount(group) >= group.max }"
              @click="toggleExtra(group, opt)"
            >
              <div class="extras-checkbox" :class="{ 'is-checked': isSelected(opt, group) }">
                <q-icon v-if="isSelected(opt, group)" name="check" size="17px" />
              </div>
              <span class="extras-name">{{ opt.name }}</span>
              <span class="extras-price" v-html="formatPrice(opt.price, true)" />
            </div>
          </div>

          <div class="extras-footer">
            <span class="extras-total" v-html="formatPrice(expandedTotal)" />
            <q-btn no-caps unelevated label="Add to order" class="add-btn" @click="confirmAdd(product)" />
          </div>
        </div>
      </div>
    </div>

    <!-- Coș sticky -->
    <q-page-sticky v-if="cart.length" position="bottom-right" :offset="[18, 18]">
      <div class="cart-sticky-group" :class="{ 'cart-pulse': cartBump }">
        <q-btn flat icon="info" class="cart-info-btn" @click="cartDialogOpen = true" />
        <q-btn no-caps unelevated class="cart-btn" @click="showPaymentModal = true">
          <span class="cart-count">{{ cartQty }}</span>
          <span class="cart-label">Place order</span>
          <span class="cart-total">{{ cartTotal }} RON</span>
        </q-btn>
      </div>
    </q-page-sticky>

    <q-page-sticky position="bottom-left" :offset="[18, 18]">
      <q-btn fab icon="arrow_back" color="grey-7" @click="router.push({ name: 'vendor' })" />
    </q-page-sticky>

    <!-- Popup comandă completă -->
    <q-dialog v-model="cartDialogOpen">
      <q-card class="cart-summary-card">
        <div class="cart-summary-header">
          <span class="cart-summary-title">Your order</span>
          <q-icon name="close" class="cart-summary-close" @click="cartDialogOpen = false" />
        </div>

        <div v-for="(item, i) in cart" :key="i" class="cart-summary-row">
          <div class="cart-summary-main">
            <span class="cart-summary-name">{{ item.qty }}× {{ item.name }}</span>
            <span class="cart-summary-price" v-html="formatPrice(item.lineTotal)" />
          </div>
          <div v-if="item.extras.length" class="cart-summary-extras">
            + {{ item.extras.map(e => e.name).join(', ') }}
          </div>
        </div>

        <div class="cart-summary-footer">
          <span>Total</span>
          <span class="cart-summary-total" v-html="formatPrice(cartTotal)" />
        </div>
      </q-card>
    </q-dialog>

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

        <div v-if="festivalStatus !== 'insufficient' && festivalStatus !== 'success'" class="nfc-scan-screen">
          <q-icon
            :name="['scanning', 'verifying', 'charging'].includes(festivalStatus) ? 'wifi_tethering' : 'nfc'"
            size="96px"
            class="nfc-icon"
            :class="{
              'nfc-icon--scanning': ['scanning', 'verifying', 'charging'].includes(festivalStatus),
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

        <div v-else-if="festivalStatus === 'insufficient'" class="festival-result festival-result--error">
          <q-icon name="cancel" size="64px" />
          <p class="festival-result-title">Insufficient credit</p>
          <p class="festival-result-desc">This card doesn't have enough balance for <span v-html="formatPrice(cartTotal, true)" />.</p>
          <button class="nfc-scan-btn" @click="resetFestivalScan">Try another card</button>
        </div>

        <div v-else class="festival-result festival-result--success">
          <q-icon name="check_circle" size="64px" />
          <p class="festival-result-title">Payment confirmed</p>
          <p class="festival-result-desc"><span v-html="formatPrice(cartTotal, true)" /> charged successfully.</p>
          <p v-if="festivalCardData?.balance !== undefined" class="festival-result-balance">
            Remaining balance: <span v-html="formatPrice(Number(festivalCardData.balance) / 100, true)" />
          </p>
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useVendorStore } from 'stores/vendor.js'
import { useDataStore } from 'stores/data.js'

const router = useRouter()
const vendorStore = useVendorStore()
const dataStore = useDataStore()
const isDev = !!process.env.DEV

watch(() => dataStore.isFetching, (val, oldVal) => {
  if (oldVal === 'pay_card' && val === null) showPaymentModal.value = false
})

const activeCategory = ref(vendorStore.categories[0])
const productsInCategory = computed(
  () => vendorStore.products.filter(p => p.category === activeCategory.value)
)

// ----- panou extra-uri (expand inline) -----
const expandedId = ref(null)
const selectedExtras = ref([]) // [{ group, name, price }]

function toggleExpand (product) {
  if (expandedId.value === product.id) {
    expandedId.value = null
    return
  }
  expandedId.value = product.id
  selectedExtras.value = []
}

function isSelected (opt, group) {
  return selectedExtras.value.some(e => e.group === group.title && e.name === opt.name)
}

function selectedCount (group) {
  return selectedExtras.value.filter(e => e.group === group.title).length
}

// Regula "max N selecții": blochează adăugarea unei noi opțiuni în grup
// odată ce selectedCount(group) a atins group.max — deselectarea rămâne
// mereu posibilă, ca userul să poată înlocui o alegere.
function toggleExtra (group, opt) {
  const idx = selectedExtras.value.findIndex(e => e.group === group.title && e.name === opt.name)
  if (idx >= 0) {
    selectedExtras.value.splice(idx, 1)
    return
  }
  if (selectedCount(group) >= group.max) return
  selectedExtras.value.push({ group: group.title, name: opt.name, price: opt.price })
}

const expandedProduct = computed(
  () => productsInCategory.value.find(p => p.id === expandedId.value)
)
const expandedTotal = computed(
  () => (expandedProduct.value?.price || 0) + selectedExtras.value.reduce((sum, e) => sum + e.price, 0)
)

function formatPrice (value, withUnit = false) {
  return `${Math.floor(value)}<sup>00</sup>${withUnit ? ' RON' : ''}`
}

function quickAdd (product) {
  cart.value.push({
    name: product.name,
    qty: 1,
    extras: [],
    lineTotal: product.price,
  })
  bumpCart()
}

function confirmAdd (product) {
  cart.value.push({
    name: product.name,
    qty: 1,
    extras: selectedExtras.value.map(e => ({ name: e.name, price: e.price })),
    lineTotal: expandedTotal.value,
  })
  expandedId.value = null
  selectedExtras.value = []
  bumpCart()
}

// ----- coș -----
const cart = ref([])
const cartQty = computed(() => cart.value.reduce((sum, item) => sum + item.qty, 0))
const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + item.lineTotal, 0))
const cartDialogOpen = ref(false)

// declanșează un puls dublu pe box-shadow-ul butonului "Place order" la fiecare adăugare
const cartBump = ref(false)
let bumpTimeout = null

function bumpCart () {
  cartBump.value = false
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { cartBump.value = true })
  })
  clearTimeout(bumpTimeout)
  bumpTimeout = setTimeout(() => { cartBump.value = false }, 1200)
}

function placeOrder () {
  const order = vendorStore.addOrder(cart.value)
  console.log('Order placed:', order)
  router.push({ name: 'vendor' })
}

// ----- metodă de plată -----
const showPaymentModal = ref(false)

function onCardClick () {
  if (dataStore.isFetching === 'pay_card') return

  dataStore.pay_card({
    totalPrice: cartTotal.value * 100,
    user: dataStore.user?.user,
    source: 'vendor',
    cart: cart.value
  })
}

// ----- Card Festival (scanare NFC + debitare sold) -----
const showFestivalScan = ref(false)
const festivalStatus = ref('idle') // idle | scanning | verifying | insufficient | charging | success | error | unsupported
const festivalError = ref('')
const festivalTdid = ref(null)
const festivalCardData = ref(null)
let nfcAbortController = null
let nfcReader = null

const festivalStatusText = computed(() => {
  if (festivalStatus.value === 'scanning') return 'Hold the card near the back of your phone...'
  if (festivalStatus.value === 'verifying') return 'Verifying card...'
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
      verifyFestivalCard(scannedTdid)
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
  verifyFestivalCard(festivalTdid.value)
}

function onFestivalNfcError (message) {
  festivalStatus.value = 'error'
  festivalError.value = message
}

async function verifyFestivalCard (scannedTdid) {
  festivalStatus.value = 'verifying'

  try {
    const data = await dataStore.check_prepaid_card(scannedTdid)
    festivalCardData.value = data

    if ((Number(data.balance) || 0) < cartTotal.value * 100) {
      festivalStatus.value = 'insufficient'
      return
    }

    await chargeFestivalCard()
  } catch (e) {
    onFestivalNfcError(e?.response?.data?.message || 'Card verification failed')
  }
}

async function chargeFestivalCard () {
  festivalStatus.value = 'charging'

  try {
    const { balance } = vendorStore.debitFestivalCard(
      festivalCardData.value._id,
      cartTotal.value * 100,
      Number(festivalCardData.value.balance) || 0
    )
    festivalCardData.value.balance = balance

    festivalStatus.value = 'success'

    setTimeout(() => {
      showFestivalScan.value = false
      placeOrder()
    }, 1500)
  } catch (e) {
    onFestivalNfcError(e?.response?.data?.message || 'Payment could not be confirmed')
  }
}

onBeforeUnmount(() => {
  stopNfcScan()
})
</script>

<style scoped lang="scss">
.new-order-page {
  background: $grey-1;
  min-height: 100vh;
  padding-bottom: 5rem;
}

.page-header {
  padding: 0.75rem 1rem 0.5rem;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: $dark;
  letter-spacing: -0.3px;
}

/* Tabs categorii */
.category-tabs {
  padding: 0 1rem 0.75rem;
  background: transparent;

  :deep(.q-tabs__content) {
    gap: 6px;
  }
}
.category-tab {
  border-radius: 22px;
  padding: 8px 18px;
  font-size: 14px;
  border: 1.5px solid rgba(0, 0, 0, 0.15);
  background: white;
  color: $grey-7;
  min-height: 44px;
  transition: background 0.15s, color 0.15s, border-color 0.15s;

  &.tab-active {
    background: #EAF2FC;
    color: $primary;
    border-color: $primary;
  }

  :deep(.q-tab__label) {
    font-size: 14px;
    font-weight: 600;
  }
}

/* Listă produse */
.products-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 1rem;
}
.product-row {
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.07);
  overflow: hidden;
}
.product-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
}
.product-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.product-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.extra-btn {
  color: $grey-7 !important;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 12px;
  min-height: 44px;

  :deep(.q-icon.on-right) {
    margin-left: 0;
  }
}
.add-btn-row {
  background: white !important;
  color: $primary !important;
  border: 1.5px solid $primary;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  padding: 8px 18px;
  min-height: 44px;
}
.product-name {
  font-size: 14px;
  font-weight: 600;
  color: $dark;
}
.product-price {
  font-size: 13px;
  color: $grey-6;
}

/* Panou extra-uri (expand inline) */
.extras-panel {
  background: #F5F8FC;
  color: $dark;
  padding: 16px 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
.extras-group {
  margin-bottom: 14px;
}
.group-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
  color: $dark;
}
.group-max {
  font-size: 13px;
  font-weight: 400;
  color: $grey-6;
}
.extras-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 0;
  min-height: 44px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;

  &:last-child {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }
}
.extras-checkbox {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 7px;
  border: 1.5px solid $grey-5;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s;

  &.is-checked {
    background: $primary;
    border-color: $primary;
    color: white;
  }
}
.extras-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: $dark;
}
.extras-price {
  font-size: 14px;
  font-weight: 700;
  color: $dark;

  :deep(sup) {
    font-size: 10px;
  }
}
.extras-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}
.extras-total {
  font-size: 22px;
  font-weight: 700;
  color: $dark;

  :deep(sup) {
    font-size: 12px;
  }
}
.add-btn {
  background: white !important;
  color: $primary !important;
  border: 1.5px solid $primary;
  border-radius: 12px;
  padding: 8px 22px;
  min-height: 48px;
  font-size: 15px;
  font-weight: 700;
}

/* Coș sticky */
.cart-sticky-group {
  display: flex;
  align-items: stretch;
  border-radius: 30px;
  overflow: hidden;
  background: white;
  border: 1.5px solid $primary;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);

  &.cart-pulse {
    animation: cart-pulse 0.9s ease-out 1;
  }
}

@keyframes cart-pulse {
  0%   { box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05), 0 0 0 0 rgba(25, 118, 210, 0.45); }
  70%  { box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05), 0 0 0 14px rgba(25, 118, 210, 0); }
  100% { box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05), 0 0 0 0 rgba(25, 118, 210, 0); }
}
.cart-info-btn {
  background: white !important;
  color: $primary !important;
  border-radius: 0 !important;
  padding: 0 18px !important;
  min-height: 52px;
  border-right: 1.5px solid $primary;
}
.cart-btn {
  background: white !important;
  color: $primary !important;
  border-radius: 0 !important;
  padding: 14px 22px;
  min-height: 52px;

  :deep(.q-btn__content) {
    gap: 10px;
  }
}
.cart-count {
  background: $primary;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}
.cart-label {
  font-size: 15px;
  font-weight: 600;
}
.cart-total {
  font-size: 15px;
  font-weight: 700;
}

/* Popup comandă completă */
.cart-summary-card {
  width: 100%;
  max-width: 380px;
  background: white;
  color: $dark;
  padding: 20px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}
.cart-summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.cart-summary-title {
  font-size: 18px;
  font-weight: 700;
  color: $dark;
}
.cart-summary-close {
  cursor: pointer;
  font-size: 20px;
  color: $grey-7;
}
.cart-summary-row {
  padding: 10px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.08);

  &:last-of-type {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
}
.cart-summary-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.cart-summary-name {
  font-size: 14px;
  font-weight: 500;
  color: $dark;
}
.cart-summary-price {
  font-size: 14px;
  font-weight: 700;
  color: $dark;

  :deep(sup) {
    font-size: 10px;
  }
}
.cart-summary-extras {
  font-size: 12px;
  color: $grey-6;
  margin-top: 3px;
}
.cart-summary-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 14px;
  font-weight: 600;
  color: $dark;
}
.cart-summary-total {
  font-size: 20px;
  font-weight: 700;
  color: $primary;

  :deep(sup) {
    font-size: 11px;
  }
}

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

  &--error {
    color: #D32F2F;
  }

  &--success {
    color: #1D9E75;
  }
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
.festival-result-balance {
  font-size: 14px;
  font-weight: 600;
  color: $dark;
  margin: 8px 0 0;

  :deep(sup) {
    font-size: 10px;
  }
}
</style>
