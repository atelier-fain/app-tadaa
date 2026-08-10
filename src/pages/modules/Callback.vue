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
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Cookies } from 'quasar'
import { useDataStore } from 'stores/data.js'
import { useVendorStore } from 'stores/vendor.js'
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

onMounted(() => {
  pendingOrder.value = Cookies.get('pendingOrder')

  if (!pendingOrder.value) {
    router.replace({ name: 'dashboard' })
    return
  }

  orderSource.value = pendingOrder.value.source

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
    const order = vendorStore.addOrder(pendingOrder.value.cart || [])
    vendorStore.reportOrderPayment(order, route.query.paymentMethod || 'card')
  }
})

function onNewOrder () {
  router.push({ name: destinationRoute.value })
}

function onRetry () {
  store.pay_card({ amount: 1, totalPrice: amount.value, user: store.user?.user })
}

// Deschide direct modalul de plată (Card Festival/Card) peste ecranul de
// eșec, fără nicio navigare — evită complet round-trip-ul prin router (care
// depindea de query param + onMounted pe alta pagină și se putea pierde din
// cauza guard-ului de permisiuni async care rulează la fiecare reload venit
// de la Viva).
function onTryAnotherPaymentMethod () {
  showPayment.value = true
}

function onCancel () {
  router.push({ name: destinationRoute.value })
}
</script>

<style lang="scss">
.callback-module {
  display: flex;
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
</style>
