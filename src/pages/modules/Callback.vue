<template>
  <q-page class="callback-module">
    <div class="callback-card" :class="{ 'callback-card--failed': !isSuccess }">
      <template v-if="isSuccess">
        <div class="callback-icon callback-icon--success">
          <q-icon name="check_circle" />
        </div>
        <h2 class="callback-title">Plată reușită</h2>
        <p class="callback-subtitle">
          Plata ta de <strong v-html="_formattedPrice(amount)" /> a fost efectuată cu succes.
        </p>
        <q-btn no-caps label="Comandă nouă" class="callback-btn callback-btn--primary" @click="onNewOrder" />
      </template>

      <template v-else>
        <div class="callback-icon callback-icon--failed">
          <q-icon name="cancel" />
        </div>
        <h2 class="callback-title">Plată eșuată</h2>
        <p v-if="message" class="callback-subtitle">Motiv: <strong>{{ message }}</strong></p>
        <div class="callback-actions">
          <q-btn
            no-caps
            label="Reîncearcă plata"
            class="callback-btn callback-btn--primary"
            :loading="store.isFetching === 'pay_card'"
            :disable="!amount"
            @click="onRetry"
          />
          <q-btn no-caps outline label="Anulează" class="callback-btn callback-btn--cancel" @click="onCancel" />
        </div>
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore } from 'stores/data.js'
import _formattedPrice from '../../mixins/formattedPrice.js'

const route = useRoute()
const router = useRouter()
const store = useDataStore()

const status = computed(() => route.query.status)
const isSuccess = computed(() => status.value === 'success')
const amount = computed(() => Number(route.query.amount) || 0)
const message = computed(() => route.query.message || '')

onMounted(() => {
  if (!store.pendingOrder) {
    router.replace({ name: 'dashboard' })
    return
  }

  if (isSuccess.value && store.pendingOrder?.source === 'tickets') {
    store.buy_tickets()
  }
})

function onNewOrder () {
  router.push({ name: 'tickets' })
}

function onRetry () {
  store.pay_card({ amount: 1, totalPrice: amount.value, user: store.user?.user })
}

function onCancel () {
  router.push({ name: 'tickets' })
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
