<script>
export default {
  name: 'SelectedServersSidebar',
  props: {
    selectedServers: {
      type: Array,
      default: () => []
    },
    selectedCount: {
      type: [Number, String],
      default: 0
    },
    bulkStatusTarget: {
      type: String,
      default: 'online'
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:bulkStatusTarget', 'bulkDelete', 'bulkStatusUpdate', 'clearSelection'],
  computed: {
    bulkStatusTargetProxy() {
      return this.bulkStatusTarget;
    }
  },
  methods: {
    onBulkStatusTargetChange(event) {
      this.$emit('update:bulkStatusTarget', event.target.value);
    }
  }
};
</script>

<template>
  <div
    class="w-80 max-w-[90vw] h-full flex flex-col bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-700/10 border-l dark:border-gray-700"
  >
    <div
      class="px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 shrink-0"
    >
      <div>
        <div class="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
          Selected Servers
        </div>
        <div class="text-sm text-gray-700 dark:text-gray-200">
          <span class="font-bold">{{ selectedCount }}</span> server(s)
        </div>
      </div>

      <button
        type="button"
        class="btn btn-secondary px-3 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="isLoading"
        title="Clear selection"
        @click="$emit('clearSelection')"
      >
        Clear
      </button>
    </div>

    <div class="p-4 flex-1 overflow-y-auto">
      <div
        v-if="selectedServers.length > 0"
        class="mb-4"
      >
        <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Names
        </div>
        <div class="max-h-24 overflow-y-auto space-y-1">
          <div
            v-for="server in selectedServers"
            :key="server.id"
            class="text-sm text-gray-800 dark:text-gray-100"
          >
            {{ server.name }}
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <button
          type="button"
          class="btn btn-danger w-full"
          :disabled="isLoading"
          @click="$emit('bulkDelete')"
        >
          Delete selected
        </button>

        <select
          :value="bulkStatusTarget"
          class="form-input"
          :disabled="isLoading"
          aria-label="Bulk status target"
          @change="onBulkStatusTargetChange"
        >
          <option value="online">Set: Online</option>
          <option value="offline">Set: Offline</option>
          <option value="maintenance">Set: Maintenance</option>
          <option value="error">Set: Error</option>
        </select>

        <button
          type="button"
          class="btn btn-primary w-full"
          :disabled="isLoading"
          @click="$emit('bulkStatusUpdate')"
        >
          Update status
        </button>
      </div>
    </div>
  </div>
</template>
