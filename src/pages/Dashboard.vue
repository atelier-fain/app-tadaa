<template>
  <div class="dashboard">
    <div class="main-container">
      <q-btn
        v-for="{id} in categories"
        type="a"
        v-ripple="false"
        flat
        :href="`/modules/${id}`"
        @click.prevent="handleButton(id)"
        :key="id">
        <q-img
          :src="$img(`icon_${id}.png`)"
          no-spinner
          :alt="`icon_${id}.png`"
        />
      </q-btn>

      <pre v-if="loaded && !listCategories.length" class="debug-panel">{{ debugInfo }}</pre>
    </div>
  </div>
</template>

<script setup>

import {ref, onMounted} from "vue";
import {useRouter} from "vue-router";
import {useDataStore} from "stores/data.js";

const router = useRouter()
const store = useDataStore()

const categories = [
  {id: 'top_up', permission: 'app_topup'},
  {id: 'access', permission: 'app_access'},
  {id: 'tickets', permission: 'app_tickets'},
  {id: 'vendor', permission: 'app_vendor'},
]

const listCategories = ref([])
const loaded = ref(false)
const debugInfo = ref('')

onMounted(async () => {
  try {
    const user = await store.check_token()
    listCategories.value = categories.filter(({ permission }) => user?.[permission])
    debugInfo.value = JSON.stringify({ user }, null, 2)
  } catch (e) {
    debugInfo.value = JSON.stringify({ error: e?.message || String(e) }, null, 2)
    await router.push({name: 'login'})
  } finally {
    loaded.value = true
  }
})

function handleButton (id) {
  router.push({ name: id })
}

</script>

<style lang="scss">
.dashboard {
  padding-top: 20px;
  padding-bottom: 20px;
  height: calc(100dvh - 60px);
  overflow-y: auto;
  .main-container {
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
