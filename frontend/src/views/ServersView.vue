<script>
import { ref, onMounted, computed, watch } from 'vue';
import { useServersStore } from '../stores/servers';
import { useNotificationsStore } from '../stores/notifications';
import EditServerModal from '../components/EditServerModal.vue';
import filterMethods from '../helpers/filterMethods';
import { useServersFilters } from '../composables/useServersFilters';
import TableSkeleton from '../components/TableSkeleton.vue';
import HealthScoreBadge from '../components/HealthScoreBadge.vue';
import SelectedServersSidebar from '../components/SelectedServersSidebar.vue';
import { calculateServerHealthScore } from '../composables/useServerHealthScore';

export default {
  name: 'ServersView',
  components: {
    EditServerModal,
    TableSkeleton,
    HealthScoreBadge,
    SelectedServersSidebar
  },
  setup() {
    const serversStore = useServersStore();
    const notificationsStore = useNotificationsStore();

    const servers = computed(() => serversStore.servers);

    const {
      nameQuery,
      ipQuery,
      status,
      location,
      sortBy,
      sortDirection,
      availableLocations,
      visibleServers,
      setSortBy,
    } = useServersFilters(servers);

    // Selection state for FE-004
    const selectedIds = ref([]); // number[]
    const isSelectedServersSidebarOpen = ref(false);
    const isSelected = (id) => selectedIds.value.includes(id);

    const toggleSelected = (id) => {
      const parsed = parseInt(id);
      if (!Number.isFinite(parsed)) return;

      if (isSelected(parsed)) {
        selectedIds.value = selectedIds.value.filter((x) => x !== parsed);
      } else {
        selectedIds.value = [...selectedIds.value, parsed];
      }
    };

    const allVisibleSelected = computed(() => {
      const list = visibleServers.value ?? [];
      if (list.length === 0) return false;
      return list.every((s) => isSelected(s.id));
    });

    const toggleSelectAllVisible = () => {
      const list = visibleServers.value ?? [];
      if (list.length === 0) return;

      if (allVisibleSelected.value) {
        // Remove only those visible IDs
        const visibleIdSet = new Set(list.map((s) => s.id));
        selectedIds.value = selectedIds.value.filter((id) => !visibleIdSet.has(id));
        return;
      }

      // Add all visible IDs
      const existing = new Set(selectedIds.value);
      list.forEach((s) => existing.add(s.id));
      selectedIds.value = Array.from(existing);
    };

    // Single delete modal
    const showDeleteModal = ref(false);
    const serverToDelete = ref(null);

    // Edit modal
    const showEditModal = ref(false);
    const serverToEdit = ref(null);

    // Bulk delete modal
    const showBulkDeleteModal = ref(false);

    // Bulk status update modal
    const showBulkStatusModal = ref(false);
    const bulkStatusTarget = ref('online');

    const getStatusColor = (statusValue) => {
      const colors = {
        online: 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
        offline: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
        maintenance: 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
        error: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
      };
      return colors[statusValue] || 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    };

    const formatSelectedCount = () => {
      const n = selectedIds.value.length;
      if (!n) return '0';
      return `${n}`;
    };

    const confirmDelete = (server) => {
      serverToDelete.value = server;
      showDeleteModal.value = true;
    };

    const deleteServer = async () => {
      if (!serverToDelete.value) return;

      try {
        await serversStore.deleteServer(serverToDelete.value.id);

        notificationsStore.addToast({
          type: 'success',
          title: 'Server deleted',
          message: `Deleted ${serverToDelete.value.name}`
        });

        showDeleteModal.value = false;
        serverToDelete.value = null;

        // Keep dashboard in sync
        await serversStore.fetchDashboardStats();
      } catch (error) {
        notificationsStore.addToast({
          type: 'error',
          title: 'Delete failed',
          message: serversStore.error || error?.response?.data?.error || 'Failed to delete server'
        });
      }
    };

    const editServer = (server) => {
      serverToEdit.value = server;
      showEditModal.value = true;
    };

    const handleEditClose = () => {
      showEditModal.value = false;
      serverToEdit.value = null;
    };

    const handleEditSaved = (updatedServer) => {
      console.warn('Server updated:', updatedServer);
    };

    const formatUptime = (seconds) => {
      const safe = typeof seconds === 'number' ? seconds : 0;
      const days = Math.floor(safe / 86400);
      const hours = Math.floor((safe % 86400) / 3600);
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h`;
      return `${Math.floor(safe / 60)}m`;
    };

    const getServerHealthScore = (server) => {
      return calculateServerHealthScore(server).score;
    };

    const selectedServers = computed(() => {
      const idSet = new Set(selectedIds.value);
      return (serversStore.servers ?? []).filter((s) => idSet.has(s.id));
    });

    const handleSortClick = (targetSortBy) => {
      if (sortBy.value === targetSortBy) {
        sortDirection.value = sortDirection.value === 'desc' ? 'asc' : 'desc';
        return;
      }
      setSortBy(targetSortBy);
    };

    const sortDirectionArrow = (targetSortBy) => {
      if (sortBy.value !== targetSortBy) return '';
      return sortDirection.value === 'asc' ? '▲' : '▼';
    };

    // FE-004 actions: bulk delete
    const openBulkDelete = () => {
      if (selectedIds.value.length === 0) return;
      showBulkDeleteModal.value = true;
    };

    const bulkDeleteServers = async () => {
      const ids = selectedIds.value.slice();
      if (ids.length === 0) return;

      try {
        await serversStore.bulkDeleteServers(ids);

        notificationsStore.addToast({
          type: 'success',
          title: 'Bulk delete complete',
          message: `Deleted ${ids.length} server(s).`
        });

        selectedIds.value = [];
        showBulkDeleteModal.value = false;

        await serversStore.fetchDashboardStats();
      } catch (err) {
        notificationsStore.addToast({
          type: 'error',
          title: 'Bulk delete failed',
          message: serversStore.error || err?.response?.data?.error || 'Failed to delete selected servers'
        });
      }
    };

    // FE-004 actions: bulk status update
    const openBulkStatusUpdate = () => {
      if (selectedIds.value.length === 0) return;
      showBulkStatusModal.value = true;
    };

    const clearSelection = () => {
      selectedIds.value = [];

      // Close any bulk modals so UI doesn't get stuck
      showBulkDeleteModal.value = false;
      showBulkStatusModal.value = false;

      // Also close single delete modal if it was open
      showDeleteModal.value = false;
      serverToDelete.value = null;
    };

    const applyBulkStatusUpdate = async () => {
      const ids = selectedIds.value.slice();
      if (ids.length === 0) return;

      try {
        await serversStore.bulkUpdateStatus(ids, bulkStatusTarget.value);

        notificationsStore.addToast({
          type: 'success',
          title: 'Bulk status update complete',
          message: `Set status to ${bulkStatusTarget.value} for ${ids.length} server(s).`
        });

        selectedIds.value = [];
        showBulkStatusModal.value = false;

        await serversStore.fetchDashboardStats();
      } catch (err) {
        notificationsStore.addToast({
          type: 'error',
          title: 'Bulk status update failed',
          message: serversStore.error || err?.response?.data?.error || 'Failed to update status for selected servers'
        });
      }
    };

    watch(
      () => selectedIds.value.length,
      (len) => {
        if (len > 0) isSelectedServersSidebarOpen.value = true;
      }
    );

    const onSelectedServersSidebarAfterLeave = () => {
      isSelectedServersSidebarOpen.value = false;
    };

    onMounted(() => {
      serversStore.fetchServers();
    });

    return {
      // Fe-002
      nameQuery,
      ipQuery,
      status,
      location,
      sortBy,
      sortDirection,
      availableLocations,
      visibleServers,
      handleSortClick,
      sortDirectionArrow,

      // Fe-004 selection
      selectedIds,
      isSelected,
      allVisibleSelected,
      toggleSelected,
      toggleSelectAllVisible,
      formatSelectedCount,
      bulkStatusTarget,
      openBulkDelete,
      openBulkStatusUpdate,

      // Bulk modals
      showBulkDeleteModal,
      showBulkStatusModal,
      bulkDeleteServers,
      applyBulkStatusUpdate,

      // Single delete modal
      showDeleteModal,
      serverToDelete,
      confirmDelete,
      deleteServer,

      // Edit modal
      showEditModal,
      serverToEdit,
      editServer,
      handleEditClose,
      handleEditSaved,

      // Misc
      getStatusColor,
      serversStore,
      formatUptime,
      getServerHealthScore,
      selectedServers,
      clearSelection,

      onSelectedServersSidebarAfterLeave,
      isSelectedServersSidebarOpen,
      ...filterMethods
    };
  }
};
</script>

<template>
  <div class="px-6 py-8">
    <div class="mb-4">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Servers</h1>
          <p class="text-gray-600 dark:text-gray-400">Manage your server infrastructure</p>
        </div>
        <RouterLink
          to="/servers/new"
          class="btn btn-primary"
        >
          Add Server
        </RouterLink>
      </div>
    </div>

    <!-- Error message -->
    <div
      v-if="serversStore.error"
      class="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded"
    >
      {{ serversStore.error }}
    </div>

    <!-- Filters / Table + Selection Sidebar (shared layout on desktop) -->
    <div
      class="flex flex-col lg:flex-row gap-4 items-start w-full overflow-x-hidden"
      :style="isSelectedServersSidebarOpen ? { paddingRight: 'min(20rem, 90vw)' } : undefined"
    >
      <div class="flex-1 min-w-0 order-1 lg:order-1">
        <!-- Filters / Sorting (FE-002) -->
        <div class="card p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Server name
              </label>
              <input
                v-model="nameQuery"
                type="text"
                class="form-input"
                placeholder="Search by name"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                IP address
              </label>
              <input
                v-model="ipQuery"
                type="text"
                class="form-input"
                placeholder="Search by IP"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                v-model="status"
                class="form-input"
              >
                <option value="all">All statuses</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Location
              </label>
              <select
                v-model="location"
                class="form-input"
              >
                <option value="all">All locations</option>
                <option
                  v-for="loc in availableLocations"
                  :key="loc"
                  :value="loc"
                >
                  {{ loc }}
                </option>
              </select>
            </div>
          </div>

          <div class="mt-4 flex items-center justify-between">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Showing <span class="font-semibold text-gray-900 dark:text-gray-100">{{ visibleServers.length }}</span> server(s)
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Sort:
              <span class="font-semibold text-gray-900 dark:text-gray-100">
                {{ sortBy }}
              </span>
              <span class="ml-2">
                ({{ sortDirection }})
              </span>
            </div>
          </div>
        </div>

        <!-- Servers Table -->
        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <!-- Checkbox column MUST be first -->
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      class="rounded"
                      :checked="allVisibleSelected"
                      @change="toggleSelectAllVisible"
                      :disabled="serversStore.isLoading"
                      aria-label="Select all visible servers"
                    />
                  </th>

                  <!-- Health first *after* checkbox -->
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      type="button"
                      class="flex items-center gap-2"
                      @click="handleSortClick('health')"
                    >
                      <span>HEALTH</span>
                      <span class="text-gray-400">{{ sortDirectionArrow('health') }}</span>
                    </button>
                  </th>

                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      type="button"
                      class="flex items-center gap-2"
                      @click="handleSortClick('name')"
                    >
                      <span>SERVER</span>
                      <span class="text-gray-400">{{ sortDirectionArrow('name') }}</span>
                    </button>
                  </th>

                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      type="button"
                      class="flex items-center gap-2"
                      @click="handleSortClick('status')"
                    >
                      <span>STATUS</span>
                      <span class="text-gray-400">{{ sortDirectionArrow('status') }}</span>
                    </button>
                  </th>

                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      type="button"
                      class="flex items-center gap-2"
                      @click="handleSortClick('location')"
                    >
                      <span>LOCATION</span>
                      <span class="text-gray-400">{{ sortDirectionArrow('location') }}</span>
                    </button>
                  </th>

                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    USAGE
                  </th>

                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      type="button"
                      class="flex items-center gap-2"
                      @click="handleSortClick('uptime')"
                    >
                      <span>UPTIME</span>
                      <span class="text-gray-400">{{ sortDirectionArrow('uptime') }}</span>
                    </button>
                  </th>

                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>

              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <TableSkeleton
                  v-if="serversStore.isLoading && visibleServers.length === 0"
                  :rows="5"
                  :cols="8"
                  cellTdClass="px-4 py-4 whitespace-nowrap"
                />

                <tr
                  v-for="server in visibleServers"
                  v-else
                  :key="server.id"
                >
                  <!-- Checkbox -->
                  <td class="px-4 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      class="rounded"
                      :checked="isSelected(server.id)"
                      @change="toggleSelected(server.id)"
                      :disabled="serversStore.isLoading"
                      :aria-label="`Select ${server.name}`"
                    />
                  </td>

                  <!-- Health -->
                  <td class="px-4 py-4 whitespace-nowrap">
                    <HealthScoreBadge :score="getServerHealthScore(server)" />
                  </td>

                  <!-- Server -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ server.name }}</div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">{{ server.hostname }}</div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">{{ server.ip_address }}</div>
                    </div>
                  </td>

                  <!-- Status -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex px-2 text-xs font-semibold rounded-full"
                      :class="getStatusColor(server.status)"
                    >
                      {{ server.status }}
                    </span>
                  </td>

                  <!-- Location -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 dark:text-gray-100">{{ server.location }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">{{ server.os }}</div>
                  </td>

                  <!-- Usage -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 dark:text-gray-100">
                      CPU: {{ formatPercent(server.cpu_usage) }}%
                    </div>
                    <div class="text-sm text-gray-900 dark:text-gray-100">
                      Memory: {{ formatPercent(server.memory_usage) }}%
                    </div>
                    <div class="text-sm text-gray-900 dark:text-gray-100">
                      Disk: {{ formatPercent(server.disk_usage) }}%
                    </div>
                  </td>

                  <!-- Uptime -->
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {{ formatUptime(server.uptime) }}
                  </td>

                  <!-- Actions -->
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      @click="editServer(server)"
                      class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="serversStore.isLoading"
                    >
                      Edit
                    </button>
                    <button
                      @click="confirmDelete(server)"
                      class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="serversStore.isLoading"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="!serversStore.isLoading && visibleServers.length === 0"
            class="text-center py-12"
          >
            <p class="text-gray-500 dark:text-gray-400">No servers found.</p>
          </div>
        </div>
      </div>

      <!-- Selected Servers Sidebar (fixed right + slide-in) -->
      <transition
        enter-active-class="transition-transform duration-200 ease-out"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-150 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
        @after-leave="onSelectedServersSidebarAfterLeave"
      >
        <div
          v-if="selectedIds.length > 0"
          class="fixed top-0 right-0 h-screen z-40"
        >
          <SelectedServersSidebar
            :selectedServers="selectedServers"
            :selectedCount="selectedIds.length"
            :isLoading="serversStore.isLoading"
            v-model:bulkStatusTarget="bulkStatusTarget"
            @bulkDelete="openBulkDelete"
            @bulkStatusUpdate="openBulkStatusUpdate"
            @clearSelection="clearSelection"
          />
        </div>
      </transition>
    </div>

    <!-- Single Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border dark:border-gray-600 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3 text-center">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Delete Server</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete <strong class="text-gray-900 dark:text-gray-100">{{ serverToDelete?.name }}</strong>?
              This action cannot be undone.
            </p>
          </div>
          <div class="flex justify-center space-x-4 mt-4">
            <button
              @click="showDeleteModal = false"
              class="btn btn-secondary"
              :disabled="serversStore.isLoading"
            >
              Cancel
            </button>
            <button
              @click="deleteServer"
              class="btn btn-danger"
              :disabled="serversStore.isLoading"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Delete Confirmation Modal -->
    <div
      v-if="showBulkDeleteModal"
      class="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border dark:border-gray-600 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3 text-center">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Delete Selected Servers</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Delete <strong class="text-gray-900 dark:text-gray-100">{{ formatSelectedCount() }}</strong> server(s)?
              This action cannot be undone.
            </p>
          </div>
          <div class="flex justify-center space-x-4 mt-4">
            <button
              @click="showBulkDeleteModal = false"
              class="btn btn-secondary"
              :disabled="serversStore.isLoading"
            >
              Cancel
            </button>
            <button
              @click="bulkDeleteServers"
              class="btn btn-danger"
              :disabled="serversStore.isLoading"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Status Update Confirmation Modal -->
    <div
      v-if="showBulkStatusModal"
      class="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border dark:border-gray-600 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3 text-center">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Update Status</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Set status to <strong class="text-gray-900 dark:text-gray-100">{{ bulkStatusTarget }}</strong> for
              <strong class="text-gray-900 dark:text-gray-100">{{ formatSelectedCount() }}</strong> server(s)?
            </p>
          </div>
          <div class="flex justify-center space-x-4 mt-4">
            <button
              @click="showBulkStatusModal = false"
              class="btn btn-secondary"
              :disabled="serversStore.isLoading"
            >
              Cancel
            </button>
            <button
              @click="applyBulkStatusUpdate"
              class="btn btn-primary"
              :disabled="serversStore.isLoading"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Server Modal -->
    <EditServerModal
      v-if="serverToEdit"
      :server="serverToEdit"
      :is-visible="showEditModal"
      @close="handleEditClose"
      @saved="handleEditSaved"
    />
  </div>
</template>
