<template>
  <div class="dashboard">
    <div class="main-container">
      <q-btn
        v-for="{id} in listCategories"
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

    </div>
  </div>
</template>

<script setup>

import {ref} from "vue";
import {useRouter} from "vue-router";
const router = useRouter()

const listCategories = ref([
  {id: 'top_up'},
  {id: 'access'},
  {id: 'access_proedus'},
  {id: 'tickets'},
  {id: 'vendor'},
  {id: 'report'},
])

function handleButton (id) {
  router.push({name: id})
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
      max-width: 120px;
    }
  }
}

</style>
