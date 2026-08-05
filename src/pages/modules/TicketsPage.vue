<template>
  <q-page class="tickets-module">
    <div v-if="storeContent.loading" class="tickets-loading">
      <q-spinner color="primary" size="2.5rem" />
    </div>

    <div v-else class="main-container">
      <Tickets
        ref="ticketsRef"
        :tickets="tickets"
        @update:totalQty="totalQty = $event"
        @update:totalPrice="totalPrice = $event"
      />
      <ButtonCart
        :qty-cart="totalQty"
        :total-price="totalPrice"
        @confirm-cash="onConfirmCash"
        @pay="onPayCard"
      />
    </div>
  </q-page>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue'
import { useRouter } from 'vue-router'
import Tickets from "components/Tickets.vue";
import ButtonCart from "components/ButtonCart.vue";
import {useDataStore} from "stores/data.js";
import {useContentStore} from "stores/content.js";

const store = useDataStore()
const storeContent = useContentStore()

const router = useRouter()
const ticketsRef = ref(null)
const totalQty = ref(0)
const totalPrice = ref(0)

const tickets = computed(() => storeContent.content?.events?.[0])
const eventID = computed(() => storeContent.content?.events?.[0]?.slug)


async function onConfirmCash() {
  const tickets = ticketsRef.value.selectedTicketIds
  await store.pay_cash(tickets)
  ticketsRef.value.reset()
}

function onPayCard () {
  const payload = {
    totalPrice: totalPrice.value,
    user: store?.user?.user
  }
  store.pay_card(payload)
}

onMounted(async () => {
  await storeContent.get_data({router})
  console.log(eventID.value)
})
</script>

<style lang="scss">
.tickets-module {
  padding-top: 20px;
  padding-bottom: 90px;
}

.tickets-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
</style>
