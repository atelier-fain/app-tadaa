<template>
  <q-page class="tickets-module">
    <!-- Skeleton cât timp /v2/tickets/domain/get/ e în zbor — refolosește
         chiar elementele/clasele reale din Tickets.vue (.title/.title-ticket/
         .right/.price/.handle-qty), doar cu q-skeleton în loc de conținut,
         ca spacing-ul și dimensiunile să fie identice cu cardul încărcat -->
    <div v-if="storeContent.loading" class="main-container">
      <div class="tickets">
        <q-card>
          <span class="title"><q-skeleton type="text" width="160px" /></span>
          <div class="list">
            <div class="ticket-container">
              <div class="ticket">
                <span class="title-ticket"><q-skeleton type="text" width="70%" /></span>
                <div class="right">
                  <div class="price"><q-skeleton type="text" width="70px" /></div>
                  <div class="handle-qty">
                    <q-skeleton type="QBtn" width="32px" height="32px" />
                    <q-skeleton type="rect" width="50px" height="32px" />
                    <q-skeleton type="QBtn" width="32px" height="32px" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card>
      </div>
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
  await store.pay_cash({
    tickets: ticketsRef.value.selectedTickets,
    source: 'tickets'
  })
  ticketsRef.value.reset()
}

function onPayCard () {
  const payload = {
    totalPrice: totalPrice.value,
    user: store?.user?.user,
    tickets: ticketsRef.value.selectedTickets,
    source: 'tickets'
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
</style>
