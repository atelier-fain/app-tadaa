<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated style="background-color: #e15350;">
      <q-toolbar class="main-container">
        <span class="text-weight-bold" style="font-size: 18px;">{{ store?.user?.user }}</span>
        <q-space />
        <q-btn
          v-if="route.name !== 'dashboard'"
          icon="home"
          flat
          round
          @click="router.push({ name: 'dashboard' })"
        />
      </q-toolbar>
    </q-header>
    <q-btn
      v-if="route.path === '/'"
      icon="logout"
      round
      size="md"
      class="fixed-bottom-left text-white"
      style="margin: 18px; z-index: 2000; background-color: #e15350 !important;"
      @click="store.logout()"
    />

    <q-page-container class="page-container">
      <router-view v-slot="{ Component, route }">
        <transition
          :duration="{ enter: 50, leave: 50 }"
          :enter-active-class="'animated fadeIn'"
          :leave-active-class="'animated fadeOut'"
          @before-leave="transitionOut" @enter="transitionIn"
          mode="out-in">
          <component :is="Component" :key="componentKey" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useDataStore } from 'stores/data.js'
import { useRoute, useRouter } from 'vue-router'
import {transitionIn, transitionOut} from "src/mixins/promiseTransitions.js";
import {computed} from "vue";

const store = useDataStore()
const route = useRoute()
const router = useRouter()

const componentKey = computed(() => {
  return route.path;
})
</script>

<style lang="scss">
</style>
