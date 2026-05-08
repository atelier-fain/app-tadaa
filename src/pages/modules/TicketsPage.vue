<template>
  <q-page class="tickets-module">
    <div class="main-container">
      <Tickets
        ref="ticketsRef"
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Tickets from "components/Tickets.vue";
import ButtonCart from "components/ButtonCart.vue";
import {useDataStore} from "stores/data.js";

const store = useDataStore()

const router = useRouter()
const ticketsRef = ref(null)
const totalQty = ref(0)
const totalPrice = ref(0)

async function onConfirmCash() {
  const tickets = ticketsRef.value.selectedTicketIds
  await store.pay_cash(tickets)
  ticketsRef.value.reset()
}

function onPayCard () {
  const data = {
    "event_id": "c7c284f16635351e8500002e",
    "last_name": "dsad",
    "first_name": "dsa",
    "email": "catalinmuresian@yahoo.com",
    "phone": "1234",
    "tickets": [
      "961201c230393831e800012b",
      "96130a3e6363662bc200023e"
    ],
    "marketing": false
  }
  store.pay_card(data)
}
</script>

<style lang="scss">
.tickets-module {
  padding-top: 20px;
  padding-bottom: 90px;
}
</style>
