<script>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useServersStore } from '../stores/servers';
import { useNotificationsStore } from '../stores/notifications';

export default {
  name: 'ServerFormView',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const serversStore = useServersStore();
    const notificationsStore = useNotificationsStore();

    const isEdit = computed(() => !!route.params.id);
    const serverId = computed(() => parseInt(route.params.id));

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

    const submitForm = async () => {
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

        if (isEdit.value) {
          await serversStore.updateServer(serverId.value, payload);
          notificationsStore.addToast({
            type: 'success',
            title: 'Server updated',
            message: `Updated ${payload.name}.`
          });
        } else {
          await serversStore.createServer(payload);
          notificationsStore.addToast({
            type: 'success',
            title: 'Server created',
            message: `Created ${payload.name}.`
          });
        }

        router.push('/servers');
      } catch (err) {
        const message = serversStore.error || err?.response?.data?.error || 'Failed to save server';

        notificationsStore.addToast({
          type: 'error',
          title: 'Save failed',
          message
        });
      } finally {
        isSubmitting.value = false;
      }
    };

    const cancel = () => {
      router.push('/servers');
    };

    const hydrateFormFromServer = (server) => {
      if (!server) return;

      Object.assign(form.value, {
        name: server.name,
        hostname: server.hostname,
        ip_address: server.ip_address,
        status: server.status,
        location: server.location,
        os: server.os
      });
    };

    onMounted(async () => {
      serversStore.clearError();

      if (!isEdit.value) return;

      const existing = serversStore.getServerById(serverId.value);
      if (existing) {
        hydrateFormFromServer(existing);
        return;
      }

      try {
        await serversStore.fetchServers();
        const afterFetch = serversStore.getServerById(serverId.value);
        if (!afterFetch) {
          notificationsStore.addToast({
            type: 'error',
            title: 'Server not found',
            message: 'The server you’re trying to edit no longer exists.'
          });
          router.push('/servers');
          return;
        }
        hydrateFormFromServer(afterFetch);
      } catch (err) {
        const message = serversStore.error || err?.response?.data?.error || 'Failed to load server data';

        notificationsStore.addToast({
          type: 'error',
          title: 'Load failed',
          message
        });

        router.push('/servers');
      }
    });

    return {
      isEdit,
      form,
      errors,
      isSubmitting,
      submitForm,
      cancel
    };
  }
};
</script>

<template>
  <div class="max-w-3xl mx-auto px-6 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
        {{ isEdit ? 'Edit Server' : 'Add New Server' }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        {{ isEdit ? 'Update server information' : 'Configure a new server' }}
      </p>
    </div>

    <form
      @submit.prevent="submitForm"
      class="space-y-6"
    >
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Basic Information</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              for="name"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Server Name *
            </label>
            <input
              v-model="form.name"
              id="name"
              type="text"
              required
              class="form-input"
              :class="{ 'border-red-300 dark:border-red-500': errors.name }"
            />
            <p
              v-if="errors.name"
              class="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              {{ errors.name }}
            </p>
          </div>

          <div>
            <label
              for="hostname"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Hostname *
            </label>
            <input
              v-model="form.hostname"
              id="hostname"
              type="text"
              required
              class="form-input"
              :class="{ 'border-red-300 dark:border-red-500': errors.hostname }"
            />
            <p
              v-if="errors.hostname"
              class="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              {{ errors.hostname }}
            </p>
          </div>

          <div>
            <label
              for="ip_address"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              IP Address *
            </label>
            <input
              v-model="form.ip_address"
              id="ip_address"
              type="text"
              required
              placeholder="192.168.1.100"
              class="form-input"
              :class="{ 'border-red-300 dark:border-red-500': errors.ip_address }"
            />
            <p
              v-if="errors.ip_address"
              class="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              {{ errors.ip_address }}
            </p>
          </div>

          <div>
            <label
              for="status"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Status
            </label>
            <select
              v-model="form.status"
              id="status"
              class="form-input"
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div>
            <label
              for="location"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Location
            </label>
            <input
              v-model="form.location"
              id="location"
              type="text"
              placeholder="US-East"
              class="form-input"
            />
          </div>

          <div>
            <label
              for="os"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Operating System
            </label>
            <input
              v-model="form.os"
              id="os"
              type="text"
              placeholder="Ubuntu 20.04"
              class="form-input"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-end space-x-4">
        <button
          type="button"
          @click="cancel"
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
          {{ isSubmitting ? 'Saving...' : (isEdit ? 'Update Server' : 'Create Server') }}
        </button>
      </div>
    </form>
  </div>
</template>
