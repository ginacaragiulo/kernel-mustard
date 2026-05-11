<script>
import { computed } from 'vue';
import { useNotificationsStore } from '../stores/notifications';

export default {
  name: 'ToastViewport',
  setup() {
    const notificationsStore = useNotificationsStore();

    const toasts = computed(() => notificationsStore.toasts);

    return {
      notificationsStore,
      toasts,
    };
  },
};
</script>

<template>
  <div class="fixed top-4 right-4 z-[100] space-y-2 w-[320px] max-w-[calc(100vw-2rem)]">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="card p-3 border-l-4"
      :class="{
        'border-indigo-600': toast.type === 'info',
        'border-green-600': toast.type === 'success',
        'border-red-600': toast.type === 'error',
        'border-yellow-600': toast.type === 'warning'
      }"
      role="status"
      aria-live="polite"
    >
      <div class="flex items-start gap-3">
        <div class="flex-1">
          <div class="text-sm font-bold text-gray-900 dark:text-gray-100">
            {{ toast.title || (toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Notice') }}
          </div>
          <div class="text-sm text-gray-700 dark:text-gray-200 mt-1">
            {{ toast.message }}
          </div>
        </div>

        <button
          type="button"
          class="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          aria-label="Dismiss notification"
          @click="notificationsStore.removeToast(toast.id)"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>
