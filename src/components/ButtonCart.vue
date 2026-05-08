<template>
  <teleport to="body">
    <transition enter-active-class="animated fadeIn faster" leave-active-class="animated fadeOut faster">
      <div v-if="showOverlay" class="btn-cart-overlay" @click="goBack" />
    </transition>
  </teleport>

  <q-dialog
    :model-value="visible"
    seamless
    persistent
    class="btn-cart-mobile"
    position="bottom">
    <q-card>
      <q-card-section class="row items-center no-wrap">
        <transition
          enter-active-class="animated fadeIn faster"
          mode="out-in">

          <q-btn v-if="!confirmed"
                 key="continua"
                 dense
                 no-caps
                 color="dark"
                 @click="onContinue">
            <span class="label">Continue</span>
            <transition
              :appear="startAnimations"
              :key="props.qtyCart"
              enter-active-class="animated swing">
              <div class="container-icon">
                <q-icon name="shopping_bag" />
                <span class="qty">{{ props.qtyCart }}</span>
              </div>
            </transition>
          </q-btn>

          <div v-else key="payment" class="payment-buttons">
            <q-btn
              dense
              no-caps
              color="dark"
              icon="payments"
              label="Cash"
              @click="showCashConfirm = true"
            />
            <q-btn
              dense
              no-caps
              color="dark"
              icon="credit_card"
              label="Card"
              :loading="store.isFetching === 'pay_card'"
              :disable="store.isFetching === 'pay_card'"
              @click="emit('pay', 'card')"
            />
          </div>

        </transition>
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-dialog v-model="showCashConfirm" persistent class="cash-confirm-dialog">
    <q-card style="min-width: 300px;">
      <q-card-section>
        <div class="text-body1">Please confirm that you have received <strong v-html="_formattedPrice(props.totalPrice)"></strong> in cash from the customer.</div>
      </q-card-section>
      <q-card-actions>
        <q-btn label="No" no-caps class="col" v-close-popup />
        <q-btn bordered label="Yes" no-caps color="positive" class="col"
               :loading="store.isFetching === 'pay_cash'"
               :disable="store.isFetching === 'pay_cash'"
               @click="onConfirmCash" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import _formattedPrice from "../mixins/formattedPrice.js";
import { useDataStore } from 'stores/data.js'

const store = useDataStore()

const props = defineProps({
  qtyCart: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 }
})

const emit = defineEmits(['pay', 'confirm-cash'])

const showCashConfirm = ref(false)
const totalLei = computed(() => (props.totalPrice / 100).toFixed(2))

const confirmed = ref(false)
const showOverlay = ref(false)
const startAnimations = ref(true)
const visible = ref(false)

watch(() => store.isFetching, (val, oldVal) => {
  if (oldVal === 'pay_cash' && val === null) {
    showCashConfirm.value = false
    showOverlay.value = false
  }
})

watch(() => props.qtyCart, (val) => {
  if (!val) {
    visible.value = false
    confirmed.value = false
    showOverlay.value = false
    return
  }
  if (confirmed.value) {
    goBack()
  } else {
    visible.value = true
  }
}, { immediate: true })

function onContinue() {
  visible.value = false
  setTimeout(() => {
    confirmed.value = true
    showOverlay.value = true
    visible.value = true
  }, 300)
}

function onConfirmCash() {
  emit('confirm-cash')
}

function goBack() {
  showOverlay.value = false
  visible.value = false
  setTimeout(() => {
    confirmed.value = false
    visible.value = !!props.qtyCart
  }, 300)
}
</script>

<style lang="scss">
.cash-confirm-dialog {
  .q-card__section {
    text-align: center;
  }

  .q-card__actions {
    display: flex;
    justify-content: center;

    .q-btn {
      flex: 1;

      @media (min-width: 550px) {
        max-width: 160px;
      }
    }
  }
}

.btn-cart-overlay {
  position: fixed;
  inset: 0;
  z-index: 5999;
  background: rgba(0, 0, 0, 0.5);
}

@media (max-width: 768px) {
  .q-dialog.btn-cart-mobile {
    width: 100%;

    .q-card {
      border-radius: 0;
      border: 1px solid $dark;
    }

    .q-card__section {
      padding: 0;

      .q-btn {
        width: 100%;
        height: 76px;
        border-radius: 0;

        .q-btn__content {
          .label {
            font-size: 16px;
            font-weight: 700;
            margin-right: 12px;
          }

          .container-icon {
            position: relative;

            .q-icon {
              font-size: 36px;
            }

            .qty {
              position: absolute;
              z-index: 112332321321321;
              color: white;
              background: $negative;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              display: flex;
              font-size: 13px;
              font-weight: 700;
              top: -5px;
              right: -8px;
              align-items: center;
              justify-content: center;
            }
          }
        }
      }

      .payment-buttons {
        width: 100%;
        display: flex;

        .q-btn {
          flex: 1;
          min-height: 76px !important;
          height: 76px !important;
          font-size: 16px;
        }
      }
    }
  }
}
</style>
