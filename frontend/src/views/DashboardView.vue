<script>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useServersStore } from '../stores/servers';
import { useNotificationsStore } from '../stores/notifications';
import StatusChart from '../components/StatusChart.vue';
import UsageChart from '../components/UsageChart.vue';
import HealthScoreBadge from '../components/HealthScoreBadge.vue';
import { calculateServerHealthScore } from '../composables/useServerHealthScore';
import filterMethods from '../helpers/filterMethods';

export default {
  name: 'DashboardView',
  components: {
    StatusChart,
    UsageChart,
    HealthScoreBadge
  },
  setup() {
    const serversStore = useServersStore();
    const notificationsStore = useNotificationsStore();

    const statusCounts = computed(() => {
      if (!serversStore.dashboardStats) return {};
      return serversStore.dashboardStats.status_breakdown;
    });

    const averageUsage = computed(() => {
      if (!serversStore.dashboardStats) return {};
      return serversStore.dashboardStats.average_usage;
    });

    const overallHealthScore = computed(() => {
      const avg = serversStore.dashboardStats?.average_usage;
      if (!avg) return null;

      const { score } = calculateServerHealthScore({
        cpu_usage: avg.cpu,
        memory_usage: avg.memory,
        disk_usage: avg.disk
      });

      return score;
    });

    const getServerHealthScore = (server) => {
      return calculateServerHealthScore(server).score;
    };

    const getStatusColor = (status) => {
      const colors = {
        online: 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
        offline: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
        maintenance: 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
        error: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
      };
      return colors[status] || 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    };

    // FE-003 dashboard interactivity
    const isRefreshing = ref(false);
    const lastRefreshedLabel = ref('');

    const autoRefreshEnabled = ref(true);
    const autoRefreshIntervalMs = 30_000;
    let intervalId = null;

    const recentSortBy = ref('health'); // health | uptime | name | status | location

    const getRecentSortDirection = (sortBy) => {
      if (sortBy === 'name' || sortBy === 'location') return 'asc';
      return 'desc'; // health / uptime / status
    };

    const getRecentSortRank = (statusValue) => {
      // Higher rank means "better" health-ish; error lowest.
      const ranks = {
        online: 4,
        maintenance: 3,
        offline: 2,
        error: 1
      };
      return ranks[statusValue] ?? 0;
    };

    const refreshDashboard = async () => {
      if (isRefreshing.value) return;

      isRefreshing.value = true;
      serversStore.clearError();

      try {
        await serversStore.fetchServers();
        await serversStore.fetchDashboardStats();

        lastRefreshedLabel.value = new Date().toLocaleTimeString();
        notificationsStore.addToast({
          type: 'success',
          title: 'Dashboard updated',
          message: 'Latest server metrics loaded.'
        });
      } catch (err) {
        const message = serversStore.error || err?.response?.data?.error || 'Failed to refresh dashboard';
        notificationsStore.addToast({
          type: 'error',
          title: 'Refresh failed',
          message
        });
      } finally {
        isRefreshing.value = false;
      }
    };

    const recentServers = computed(() => {
      const all = serversStore.servers ?? [];
      const sorted = all.slice();

      const dir = getRecentSortDirection(recentSortBy.value);

      sorted.sort((a, b) => {
        if (recentSortBy.value === 'health') {
          const sa = calculateServerHealthScore(a).score ?? -1;
          const sb = calculateServerHealthScore(b).score ?? -1;
          return dir === 'asc' ? sa - sb : sb - sa;
        }

        if (recentSortBy.value === 'uptime') {
          const ua = typeof a?.uptime === 'number' ? a.uptime : 0;
          const ub = typeof b?.uptime === 'number' ? b.uptime : 0;
          return dir === 'asc' ? ua - ub : ub - ua;
        }

        if (recentSortBy.value === 'status') {
          const ra = getRecentSortRank(a?.status);
          const rb = getRecentSortRank(b?.status);
          return dir === 'asc' ? ra - rb : rb - ra;
        }

        if (recentSortBy.value === 'name') {
          const an = a?.name ?? '';
          const bn = b?.name ?? '';
          return dir === 'asc' ? an.localeCompare(bn) : bn.localeCompare(an);
        }

        if (recentSortBy.value === 'location') {
          const al = a?.location ?? '';
          const bl = b?.location ?? '';
          return dir === 'asc' ? al.localeCompare(bl) : bl.localeCompare(al);
        }

        return 0;
      });

      return sorted.slice(0, 10);
    });

    onMounted(async () => {
      await refreshDashboard();

      if (autoRefreshEnabled.value) {
        intervalId = window.setInterval(() => {
          // Fire-and-forget; refreshDashboard handles in-flight guard.
          refreshDashboard();
        }, autoRefreshIntervalMs);
      }
    });

    onUnmounted(() => {
      if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    });

    const toggleAutoRefresh = () => {
      autoRefreshEnabled.value = !autoRefreshEnabled.value;

      if (!autoRefreshEnabled.value) {
        if (intervalId) window.clearInterval(intervalId);
        intervalId = null;
        notificationsStore.addToast({
          type: 'info',
          title: 'Auto-refresh disabled',
          message: 'Dashboard will update only when you refresh manually.'
        });
        return;
      }

      // Re-enable: refresh immediately, then schedule.
      refreshDashboard().then(() => {
        if (intervalId) window.clearInterval(intervalId);
        intervalId = window.setInterval(() => refreshDashboard(), autoRefreshIntervalMs);
      });

      notificationsStore.addToast({
        type: 'success',
        title: 'Auto-refresh enabled',
        message: 'Dashboard will keep itself up to date.'
      });
    };

    return {
      serversStore,
      notificationsStore,

      statusCounts,
      averageUsage,
      overallHealthScore,
      getServerHealthScore,
      getStatusColor,

      // FE-003
      isRefreshing,
      lastRefreshedLabel,
      autoRefreshEnabled,
      recentSortBy,
      recentServers,
      refreshDashboard,
      toggleAutoRefresh,

      ...filterMethods
    };
  }
};
</script>

<template>
  <div class="px-6 py-8">
    <div class="mb-8">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p class="text-gray-600 dark:text-gray-400">Monitor your server infrastructure</p>
        </div>

        <div class="flex flex-col items-end gap-2">
          <div
            v-if="lastRefreshedLabel"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            Last updated: {{ lastRefreshedLabel }}
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="refreshDashboard"
              class="btn btn-secondary"
              :disabled="isRefreshing"
              :title="isRefreshing ? 'Refreshing...' : 'Refresh dashboard data'"
            >
              {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
            </button>

            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 select-none">
              <input
                type="checkbox"
                class="rounded"
                :checked="autoRefreshEnabled"
                @change="toggleAutoRefresh"
              />
              Auto
            </label>
          </div>
        </div>
      </div>

      <div
        v-if="serversStore.error"
        class="mt-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded"
      >
        {{ serversStore.error }}
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Servers</h3>
        <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {{ serversStore.dashboardStats?.total_servers || 0 }}
        </p>
      </div>

      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Health Score</h3>
        <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {{ overallHealthScore ?? 'N/A' }}
        </p>
        <div class="mt-2">
          <HealthScoreBadge :score="overallHealthScore" />
        </div>
      </div>

      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Online</h3>
        <p class="text-3xl font-bold text-green-600 dark:text-green-400">
          {{ statusCounts.online || 0 }}
        </p>
      </div>

      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Offline</h3>
        <p class="text-3xl font-bold text-red-600 dark:text-red-400">
          {{ statusCounts.offline || 0 }}
        </p>
      </div>

      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Maintenance</h3>
        <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
          {{ statusCounts.maintenance || 0 }}
        </p>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Server Status Distribution</h3>
        <StatusChart :data="statusCounts" />
      </div>

      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Average Resource Usage</h3>
        <UsageChart :data="averageUsage" />
      </div>
    </div>

    <!-- Recent Servers -->
    <div class="card">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Servers</h3>

        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600 dark:text-gray-400">
            Sort by
          </label>
          <select
            v-model="recentSortBy"
            class="form-input w-auto"
          >
            <option value="health">Health</option>
            <option value="uptime">Uptime</option>
            <option value="name">Name</option>
            <option value="status">Status</option>
            <option value="location">Location</option>
          </select>
        </div>
      </div>

      <div class="overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                HEALTH
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                NAME
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                STATUS
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                IP ADDRESS
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                LOCATION
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                CPU USAGE
              </th>
            </tr>
          </thead>

          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="server in recentServers"
              :key="server.id"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <HealthScoreBadge :score="getServerHealthScore(server)" />
              </td>

              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ server.name }}</div>
              </td>

              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex px-2 text-xs font-semibold rounded-full"
                  :class="getStatusColor(server.status)"
                >
                  {{ server.status }}
                </span>
              </td>

              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ server.ip_address }}
              </td>

              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ server.location }}
              </td>

              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ formatPercent(server.cpu_usage) }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-right">
        <RouterLink
          to="/servers"
          class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
        >
          View all servers →
        </RouterLink>
      </div>
    </div>
  </div>
</template>
