<template>
  <q-dialog
    :model-value="visible"
    seamless
    persistent
    class="btn-cart-mobile"
    position="bottom">
    <q-card class="cart-bar-card">
      <div class="cart-bar-inner" @click="onContinue">
        <div class="cart-bar-left">
          <span class="cart-bar-label">Continue</span>
          <span class="cart-bar-price" v-html="_formattedPrice(props.totalPrice)" />
        </div>
        <div class="cart-bar-right">
          <transition
            :appear="startAnimations"
            :key="props.qtyCart"
            enter-active-class="animated swing">
            <div class="cart-bar-icon">
              <q-icon name="shopping_bag" />
              <span class="cart-bar-qty">{{ props.qtyCart }}</span>
            </div>
          </transition>
        </div>
      </div>
    </q-card>
  </q-dialog>

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
        <div class="pm-option pm-option--card" :class="{ 'pm-option--loading': store.isFetching === 'pay_card' }" @click="onCardClick">
          <div class="pm-option-icon">
            <q-spinner v-if="store.isFetching === 'pay_card'" size="28px" />
            <q-icon v-else name="credit_card" />
          </div>
          <span class="pm-option-label">Card</span>
        </div>
      </div>
    </q-card>
  </q-dialog>

  <q-dialog v-model="showCashConfirm" persistent class="cash-confirm-dialog">
    <q-card class="cash-confirm-card">
      <div class="cc-icon-wrap">
        <q-icon name="payments" />
      </div>
      <div class="cc-title">Cash Payment</div>
      <div class="cc-amount" v-html="_formattedPrice(props.totalPrice)" />
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
</template>

<script setup>
import { ref, watch } from 'vue'
import _formattedPrice from "../mixins/formattedPrice.js";
import { useDataStore } from 'stores/data.js'

const store = useDataStore()

const props = defineProps({
  qtyCart: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 }
})

const emit = defineEmits(['pay', 'confirm-cash'])

const showCashConfirm = ref(false)
const showPaymentModal = ref(false)
const startAnimations = ref(true)
const visible = ref(false)

watch(() => store.isFetching, (val, oldVal) => {
  if (oldVal === 'pay_cash' && val === null) {
    showCashConfirm.value = false
  }
  if (oldVal === 'pay_card' && val === null) {
    showPaymentModal.value = false
  }
})

watch(() => props.qtyCart, (val) => {
  if (!val) {
    visible.value = false
    showPaymentModal.value = false
    return
  }
  visible.value = true
}, { immediate: true })

function onContinue() {
  showPaymentModal.value = true
}

function onCashClick() {
  showPaymentModal.value = false
  showCashConfirm.value = true
}

function onCardClick() {
  if (store.isFetching === 'pay_card') return
  emit('pay', 'card')
}

function onConfirmCash() {
  emit('confirm-cash')
}
</script>

<style lang="scss">

/* ── Bottom cart bar ──────────────────────────────── */
.q-dialog.btn-cart-mobile {
  width: 100%;

  .q-dialog__inner {
    padding: 0 !important;
  }

  .cart-bar-card {
    width: 100%;
    border-radius: 0 !important;
    overflow: hidden;
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12) !important;
  }

  .cart-bar-inner {
    display: flex;
    height: 72px;
    cursor: pointer;
    touch-action: manipulation;
    user-select: none;

    &:active {
      filter: brightness(0.9);
    }
  }

  .cart-bar-left {
    flex: 1;
    background: $dark;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-left: 22px;
    gap: 3px;
  }

  .cart-bar-label {
    font-size: 16px;
    font-weight: 700;
    color: white;
    line-height: 1;
  }

  .cart-bar-price {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1;
  }

  .cart-bar-right {
    width: 80px;
    flex-shrink: 0;
    background: $dark;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cart-bar-icon {
    position: relative;

    .q-icon {
      font-size: 32px;
      color: white;
    }

    .cart-bar-qty {
      position: absolute;
      top: -5px;
      right: -8px;
      color: white;
      background: $negative;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }
  }
}

/* ── Payment method modal ─────────────────────────── */
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
