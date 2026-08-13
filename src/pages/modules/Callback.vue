<template>
  <q-page class="callback-module">
    <div class="callback-card" :class="{ 'callback-card--failed': !isSuccess }">
      <template v-if="isSuccess">
        <div class="callback-icon callback-icon--success">
          <q-icon name="check_circle" />
        </div>
        <h2 class="callback-title">Payment successful</h2>
        <p class="callback-subtitle">
          Your payment of <strong v-html="_formattedPrice(amount)" /> was successful.
        </p>
        <p v-if="balance !== null" class="callback-subtitle">
          Your Balance is: <strong v-html="_formattedPrice(balance)" />
        </p>
        <q-btn no-caps :label="newOrderLabel" class="callback-btn callback-btn--primary" @click="onNewOrder" />
      </template>

      <template v-else>
        <div class="callback-icon callback-icon--failed">
          <q-icon name="cancel" />
        </div>
        <h2 class="callback-title">Payment failed</h2>
        <p v-if="message" class="callback-subtitle">Reason: <strong>{{ message }}</strong></p>
        <div class="callback-actions">
          <q-btn
            v-if="orderSource === 'vendor'"
            no-caps
            label="Try another payment method"
            class="callback-btn callback-btn--primary"
            @click="onTryAnotherPaymentMethod"
          />
          <q-btn
            v-else
            no-caps
            label="Retry payment"
            class="callback-btn callback-btn--primary"
            :loading="store.isFetching === 'pay_card'"
            :disable="!amount"
            @click="onRetry"
          />
          <q-btn no-caps outline label="Cancel" class="callback-btn callback-btn--cancel" @click="onCancel" />
        </div>
      </template>
    </div>

    <VendorPaymentModal
      v-if="orderSource === 'vendor'"
      v-model="showPayment"
      :cart="retryCart"
      :cart-total="retryCartTotal"
    />

    <div v-if="SHOW_VIVA_DEBUG" class="callback-debug">
      <div class="callback-debug__title">Debug — Viva Pay</div>
      <div class="callback-debug__section">
        <strong>Trimis către Viva:</strong>
        <pre>{{ JSON.stringify(debugRequest, null, 2) }}</pre>
      </div>
      <div class="callback-debug__section">
        <strong>Primit înapoi (URL curent /callback):</strong>
        <pre>{{ JSON.stringify(route.query, null, 2) }}</pre>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, watch, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Cookies } from 'quasar'
import { useDataStore } from 'stores/data.js'
import { useVendorStore } from 'stores/vendor.js'
import { SHOW_VIVA_DEBUG } from 'stores/viva-pay.js'
import VendorPaymentModal from 'components/VendorPaymentModal.vue'
import _formattedPrice from '../../mixins/formattedPrice.js'

const route = useRoute()
const router = useRouter()
const store = useDataStore()
const vendorStore = useVendorStore()

const hasError = ref(false)
const errorMessage = ref('')
const orderSource = ref(null)
const pendingOrder = ref(null)
const showPayment = ref(false)
const debugRequest = ref(null)
const retryCart = computed(() => pendingOrder.value?.cart || [])
const retryCartTotal = computed(() => retryCart.value.reduce((sum, item) => sum + item.lineTotal, 0))

const status = computed(() => route.query.status)
const isSuccess = computed(() => status.value === 'success' && !hasError.value)
const amount = computed(() => Number(route.query.amount) || 0)
const balance = computed(() => route.query.balance !== undefined ? Number(route.query.balance) || 0 : null)
const message = computed(() => errorMessage.value || route.query.message || '')
const transactionId = computed(() => route.query.transactionId || '')
const shortOrderCode = computed(() => route.query.shortOrderCode || '')
const newOrderLabel = computed(() => orderSource.value === 'topup' ? 'Top up again' : 'New order')
const destinationRoute = computed(() => {
  if (orderSource.value === 'topup') return 'top_up'
  if (orderSource.value === 'vendor') return 'vendor'
  return 'tickets'
})

// watch pe route.query (nu onMounted) — "Try another payment method" pentru
// Card Festival rămâne pe aceeași instanță de Callback.vue (modalul se
// deschide inline, fără navigare), iar la succes doar face router.push spre
// aceeași rută cu query nou (:key din MainLayout.vue e route.path, nu
// fullPath, deci nu are loc remount). Fără watch pe query, acel retry n-ar
// mai declanșa deloc saveOrder/buy_tickets/charge_prepaid_card — userul ar
// vedea "Payment successful" fără ca plata să ajungă vreodată în backend.
// {immediate:true} acoperă și primul mount, la fel ca onMounted înainte.
watch(() => route.query, () => {
  debugRequest.value = Cookies.get('vivaDebugRequest')
  pendingOrder.value = Cookies.get('pendingOrder')

  if (!pendingOrder.value) {
    router.replace({ name: 'dashboard' })
    return
  }

  orderSource.value = pendingOrder.value.source

  // reset — un retry rulează acest handler din nou pe aceeași instanță;
  // hasError trebuie golit, altfel eșecul anterior ar bloca isSuccess
  // permanent (isSuccess = status === 'success' && !hasError)
  hasError.value = false
  errorMessage.value = ''

  // dacă userul dă refresh pe /callback după ce plata a fost deja trimisă
  // către backend (orderSaved: true, setat de buy_tickets/charge_prepaid_card/
  // saveOrder după succes), sărim peste retrimitere și îl ducem direct la
  // destinația lui, în loc să retrimitem aceeași comandă/plată a doua oară
  if (isSuccess.value && pendingOrder.value.orderSaved) {
    router.replace({ name: destinationRoute.value })
    return
  }

  if (isSuccess.value && pendingOrder.value.source === 'tickets') {
    store.buy_tickets({
      tickets: pendingOrder.value.tickets,
      method: 'card',
      transactionId: transactionId.value,
      shortOrderCode: shortOrderCode.value
    }).catch((e) => {
      console.error('buy_tickets failed', e)
      hasError.value = true
      errorMessage.value = 'Could not complete the order'
    })
  }

  if (isSuccess.value && pendingOrder.value.source === 'topup') {
    store.charge_prepaid_card({
      _id: pendingOrder.value.cardId,
      amount: amount.value,
      method: 'card',
      transactionId: transactionId.value,
      shortOrderCode: shortOrderCode.value
    }).catch((e) => {
      console.error('charge_prepaid_card failed', e)
      hasError.value = true
      errorMessage.value = 'Could not complete the top up'
    })
  }

  if (isSuccess.value && pendingOrder.value.source === 'vendor') {
    vendorStore.saveOrder(
      pendingOrder.value.cart || [],
      pendingOrder.value?.paymentMethod || 'card',
      transactionId.value,
      shortOrderCode.value
    ).then(() => {
      // orderSaved se setează DOAR la succes real (saveOrder aruncă la eșec) —
      // altfel o comandă netrimisă în DB ar bloca orice reîncercare ulterioară
      store.pendingOrder = { source: 'vendor', orderSaved: true }
      Cookies.set('pendingOrder', store.pendingOrder, { path: '/', expires: 1 })
    }).catch((e) => {
      console.error('[vendor/orders] error:', e?.response?.data || e)
      hasError.value = true
      errorMessage.value = 'Payment succeeded, but the order could not be sent. Please contact support.'
    })
  }
}, { immediate: true })

// odată ce userul pleacă de pe /callback (navigare internă Vue Router —
// New order/Cancel/redirect-ul automat de mai sus), ștergem cookie-ul DOAR
// dacă plata + trimiterea către backend au reușit (orderSaved: true, setat
// de buy_tickets/charge_prepaid_card/saveOrder după succes) — la eșec,
// păstrăm pendingOrder-ul original (cart/tickets/cardId), ca userul să nu
// piardă contextul dacă navighează în afara ecranului de eroare. NU se
// golește aici la un retry Card (window.open(..., '_self') iese complet
// din SPA înainte să apuce să ruleze acest hook, deci cookie-ul
// supraviețuiește round-trip-ul prin Viva, exact cât trebuie).
onBeforeUnmount(() => {
  if (!store.pendingOrder?.orderSaved) return

  store.pendingOrder = null
  Cookies.remove('pendingOrder', { path: '/' })
})

// replace (nu push) — /callback nu rămâne în istoric, ca un back de pe
// pagina următoare să nu aterizeze din nou pe ecranul de succes
function onNewOrder () {
  router.replace({ name: destinationRoute.value })
}

function onRetry () {
  store.pay_card({ amount: 1, totalPrice: amount.value, user: store.user?.user })
}

// Comenzile "de meniu" (item-uri cu productId, venite din VendorNewOrder.vue)
// se reiau direct pe /new-order — VendorNewOrder.vue preia cart-ul eșuat din
// pendingOrder la mount (vezi acolo) — ca userul să poată și adăuga produse,
// nu doar retrimite/șterge din coșul deja existent. Comenzile "Custom amount"
// (VendorPage.vue, vendor value_only, fără productId — nu au nicio pagină de
// produse unde s-ar putea duce) rămân pe modalul inline, ca înainte: se
// deschide direct peste ecranul de eșec, fără nicio navigare — evită complet
// round-trip-ul prin router (care depindea de query param + onMounted pe altă
// pagină și se putea pierde din cauza guard-ului de permisiuni async care
// rulează la fiecare reload venit de la Viva).
function onTryAnotherPaymentMethod () {
  const isMenuOrder = retryCart.value.some(item => item.productId)
  if (isMenuOrder) {
    router.replace({ name: 'vendor-new-order' })
    return
  }

  showPayment.value = true
}

function onCancel () {
  router.replace({ name: destinationRoute.value })
}
</script>

<style lang="scss">
.callback-module {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  min-height: 70vh;
}

.callback-card {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;

  .callback-icon {
    width: 72px;
    height: 72px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;

    .q-icon {
      font-size: 40px;
    }

    &--success {
      background: #D4F0E3;
      color: #1D9E75;
    }

    &--failed {
      background: #FBDCDC;
      color: $negative;
    }
  }

  .callback-title {
    font-size: 20px;
    font-weight: 700;
    color: $dark;
    margin: 0;
  }

  .callback-subtitle {
    font-size: 14px;
    color: $grey-7;
    margin: 4px 0 0;

    strong {
      color: $dark;
    }
  }

  .callback-btn {
    height: 44px;
    border-radius: 10px !important;
    font-size: 14px;
    font-weight: 600;
    width: 100%;
    margin-top: 16px;

    &--primary {
      background: #1D9E75 !important;
      color: white !important;
    }

    &--cancel {
      border-color: rgba(0, 0, 0, 0.18) !important;
      color: $grey-7 !important;
    }
  }

  .callback-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;

    .callback-btn { margin-top: 0; }
  }
}

.callback-debug {
  width: 100%;
  margin: 24px auto 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: #1a1a1a;
  color: #d6d6d6;
  font-size: 11px;

  &__title {
    font-weight: 700;
    color: #fff;
    margin-bottom: 8px;
  }

  &__section {
    margin-top: 8px;

    strong {
      color: #9adbc0;
    }
  }

  pre {
    margin: 4px 0 0;
    white-space: pre-wrap;
    word-break: break-all;
    font-family: monospace;
  }
}
</style>
