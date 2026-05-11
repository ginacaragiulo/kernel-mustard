import { defineStore } from 'pinia';
import { ref } from 'vue';

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const useNotificationsStore = defineStore('notifications', () => {
  const toasts = ref([]);

  const removeToast = (id) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  const addToast = ({ message, type = 'info', durationMs = 4000, title = '' }) => {
    const id = createId();

    const toast = {
      id,
      type,
      title,
      message: message || '',
    };

    toasts.value = [toast, ...toasts.value].slice(0, 5);

    if (durationMs > 0) {
      window.setTimeout(() => removeToast(id), durationMs);
    }

    return id;
  };

  return {
    toasts,
    addToast,
    removeToast,
  };
});
