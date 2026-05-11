<script>
import { ref, watch } from 'vue';
import { useServersStore } from '../stores/servers';
import { useNotificationsStore } from '../stores/notifications';

export default {
  name: 'EditServerModal',
  props: {
    server: {
      type: Object,
      default: () => ({})
    },
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const serversStore = useServersStore();
    const notificationsStore = useNotificationsStore();

    const form = ref({
      name: '',
      hostname: '',
      ip_address: '',
      status: 'online',
      location: '',
      os: 'Linux'
    });

    const errors = ref({});
    const isSubmitting = ref(false);

    const resetFormFromProps = () => {
      const s = props.server ?? {};
      form.value = {
        name: s.name ?? '',
        hostname: s.hostname ?? '',
        ip_address: s.ip_address ?? '',
        status: s.status ?? 'online',
        location: s.location ?? '',
        os: s.os ?? 'Linux'
      };
    };

    // Watch for server prop changes to populate form (only while modal is visible)
    watch(
      () => props.server,
      () => {
        if (!props.isVisible) return;
        resetFormFromProps();
      },
      { immediate: true }
    );

    // Watch for modal visibility to reset errors + form
    watch(
      () => props.isVisible,
      (isVisible) => {
        if (!isVisible) return;
        errors.value = {};
        serversStore.clearError();
        resetFormFromProps();
      }
    );

    const validateForm = () => {
      errors.value = {};

      if (!form.value.name.trim()) {
        errors.value.name = 'Server name is required';
      }

      if (!form.value.hostname.trim()) {
        errors.value.hostname = 'Hostname is required';
      }

      if (!form.value.ip_address.trim()) {
        errors.value.ip_address = 'IP Address is required';
      } else if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(form.value.ip_address)) {
        errors.value.ip_address = 'Invalid IP address format';
      }

      return Object.keys(errors.value).length === 0;
    };

    const handleSubmit = async () => {
      if (!validateForm()) return;

      isSubmitting.value = true;
      serversStore.clearError();

      try {
        const payload = {
          name: form.value.name,
          hostname: form.value.hostname,
          ip_address: form.value.ip_address,
          status: form.value.status,
          location: form.value.location,
          os: form.value.os
        };

        const updated = await serversStore.updateServer(props.server.id, payload);

        notificationsStore.addToast({
          type: 'success',
          title: 'Server updated',
          message: `Updated ${updated?.name || props.server?.name || 'server'}.`
        });

        emit('saved', { ...props.server, ...payload });
        emit('close');
      } catch (err) {
        const message = serversStore.error || err?.response?.data?.error || 'Failed to update server';

        notificationsStore.addToast({
          type: 'error',
          title: 'Update failed',
          message
        });
      } finally {
        isSubmitting.value = false;
      }
    };

    const handleCancel = () => {
      errors.value = {};
      serversStore.clearError();
      resetFormFromProps();
      emit('close');
    };

    const handleBackdropClick = (event) => {
      if (event.target === event.currentTarget) {
        handleCancel();
      }
    };

    return {
      form,
      errors,
      isSubmitting,
      serversStore,
      handleSubmit,
      handleCancel,
      handleBackdropClick
    };
  }
};
</script>

<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50"
    @click="handleBackdropClick"
  >
    <div class="relative top-20 mx-auto p-0 border dark:border-gray-600 max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
          Edit Server: {{ server.name }}
        </h3>
        <button
          @click="handleCancel"
          class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          :disabled="isSubmitting"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <form
        @submit.prevent="handleSubmit"
        class="px-6 py-4"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Server Name -->
          <div>
            <label
              for="edit-name"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Server Name *
            </label>
            <input
              v-model="form.name"
              id="edit-name"
              type="text"
              required
              class="form-input"
              :class="{ 'border-red-300 dark:border-red-500': errors.name }"
              :disabled="isSubmitting"
            />
            <p
              v-if="errors.name"
              class="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              {{ errors.name }}
            </p>
          </div>

          <!-- Hostname -->
          <div>
            <label
              for="edit-hostname"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Hostname *
            </label>
            <input
              v-model="form.hostname"
              id="edit-hostname"
              type="text"
              required
              class="form-input"
              :class="{ 'border-red-300 dark:border-red-500': errors.hostname }"
              :disabled="isSubmitting"
            />
            <p
              v-if="errors.hostname"
              class="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              {{ errors.hostname }}
            </p>
          </div>

          <!-- IP Address -->
          <div>
            <label
              for="edit-ip"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              IP Address *
            </label>
            <input
              v-model="form.ip_address"
              id="edit-ip"
              type="text"
              required
              placeholder="192.168.1.100"
              class="form-input"
              :class="{ 'border-red-300 dark:border-red-500': errors.ip_address }"
              :disabled="isSubmitting"
            />
            <p
              v-if="errors.ip_address"
              class="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              {{ errors.ip_address }}
            </p>
          </div>

          <!-- Status -->
          <div>
            <label
              for="edit-status"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Status
            </label>
            <select
              v-model="form.status"
              id="edit-status"
              class="form-input"
              :disabled="isSubmitting"
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
              <option value="error">Error</option>
            </select>
          </div>

          <!-- Location -->
          <div>
            <label
              for="edit-location"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Location
            </label>
            <input
              v-model="form.location"
              id="edit-location"
              type="text"
              placeholder="US-East"
              class="form-input"
              :disabled="isSubmitting"
            />
          </div>

          <!-- Operating System -->
          <div>
            <label
              for="edit-os"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Operating System
            </label>
            <input
              v-model="form.os"
              id="edit-os"
              type="text"
              placeholder="Ubuntu 20.04"
              class="form-input"
              :disabled="isSubmitting"
            />
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="serversStore.error"
          class="mt-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded text-sm"
          role="alert"
        >
          {{ serversStore.error }}
        </div>

        <!-- Modal Footer -->
        <div class="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            @click="handleCancel"
            class="btn btn-secondary"
            :disabled="isSubmitting"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="btn btn-primary"
          >
            {{ isSubmitting ? 'Updating...' : 'Update Server' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
