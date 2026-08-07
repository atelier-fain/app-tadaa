<template>
  <q-btn flat round dense @click="toggle">
    <q-icon :name="enabled ? 'volume_up' : 'volume_off'" />
  </q-btn>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useQuasar, Cookies } from 'quasar'

const props = defineProps({
  trigger: { type: Number, default: 0 },
  notification: {
    type: Object,
    default: () => ({})
  }
})

const $q = useQuasar()
const enabled = ref(Cookies.get('notif_sound_enabled') !== 'false')
const audio = new Audio(`${import.meta.env.BASE_URL}sounds/ding.mp3`)

function toggle() {
  enabled.value = !enabled.value
  Cookies.set('notif_sound_enabled', String(enabled.value), { expires: 365 })
}

watch(() => props.trigger, (val) => {
  if (!val) return

  if (enabled.value) {
    audio.currentTime = 0
    audio.play().catch(() => {})
    if (navigator.vibrate) navigator.vibrate(200)
  }

  $q.notify({
    position: 'top',
    timeout: 7000,
    progress: true,
    color: 'dark',
    icon: props.notification.icon ?? 'receipt_long',
    message: props.notification.message ?? 'Notificare nouă',
    caption: props.notification.caption ?? '',
    actions: props.notification.actions ?? []
  })
})
</script>
