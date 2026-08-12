<template>
  <div class="dashboard">
    <div class="main-container">
      <template v-if="listCategories.length">
        <q-btn
          v-for="{id, path} in listCategories"
          type="a"
          v-ripple="false"
          flat
          :href="path"
          @click.prevent="handleButton(id)"
          :key="id">
          <img
            class="q-img"
            :src="$img(`icon_${id}.png`)"
            :alt="`icon_${id}.png`"
          >
        </q-btn>
      </template>
      <template v-else-if="checking">
        <div v-for="n in categories.length" :key="n" class="dashboard-skeleton-tile">
          <q-skeleton type="rect" class="dashboard-skeleton-icon" />
        </div>
      </template>

      <pre v-else class="debug-panel">{{ debugInfo }}</pre>
    </div>
  </div>
</template>

<script setup>

import {computed, ref, onMounted} from "vue";
import {useRouter} from "vue-router";
import {useDataStore} from "stores/data.js";
import {Cookies, useQuasar} from "quasar";

const $q = useQuasar();

const router = useRouter()
const store = useDataStore()

const categories = [
  {id: 'top_up', permission: 'app_topup', path: '/modules/top_up'},
  {id: 'access', permission: 'app_access', path: '/modules/access'},
  {id: 'tickets', permission: 'app_tickets', path: '/modules/tickets'},
  {id: 'vendor', permission: 'app_vendor', path: '/modules/vendor'},
  {id: 'report', permission: '', path: '/report'},
]

// store.user is hydrated synchronously from the 'user' cookie (see stores/data.js),
// so buttons render immediately from the cached value. check_token() below only
// refreshes that cache in the background — it never gates the initial render.
// empty permission (report) = accessible to any logged-in user, no store.user check needed
const listCategories = computed(() => categories.filter(({ permission }) => !permission || store.user?.[permission]))
const debugInfo = ref('')

// true doar cât timp NU avem încă date de undeva (cache sau alt check_token
// deja în zbor) — dacă listCategories are deja ceva, skeleton-ul nu apare
// niciodată, indiferent de checking (vezi v-if="listCategories.length" din
// template, care are prioritate).
const checking = ref(true)

onMounted(() => {
  Cookies.remove('pendingOrder', { path: '/' })
  Cookies.remove('scannedCard', { path: '/' })
  store.check_token()
    .then((user) => {
      debugInfo.value = JSON.stringify({ user }, null, 2)
    })
    .catch((e) => {
      debugInfo.value = JSON.stringify({ error: e?.message || String(e) }, null, 2)
      $q.notify({ type: 'negative', message: 'Session expired, please log in again', position: 'top' })
      router.push({name: 'login'})
    })
    .finally(() => {
      checking.value = false
    })
})

function handleButton (id) {
  router.push({ name: id })
}

</script>

<style lang="scss">
.dashboard {
  height: calc(100dvh - 50px);
  overflow: auto;
  .main-container {
    overflow: auto;
    display: flex;
    justify-content: center;
    gap: 20px;
    max-width: 540px;
    min-height: 100%;
    margin: 0 auto;
    flex-wrap: wrap;
    align-items: center;
    align-content: center;
    .q-btn {
      width: 100%;
      padding: 0;
      max-width: 40%;
    }

    .dashboard-skeleton-tile {
      width: 100%;
      max-width: 40%;
    }
    .dashboard-skeleton-icon {
      width: 100%;
      aspect-ratio: 1 / 1;
      border-radius: 12px;
    }

    .debug-panel {
      width: 100%;
      max-width: 90vw;
      background: #111;
      color: #0f0;
      padding: 12px;
      border-radius: 8px;
      font-size: 11px;
      text-align: left;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
}

</style>
