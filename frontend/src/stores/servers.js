import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { serversAPI, dashboardAPI } from '../services/api';

export const useServersStore = defineStore('servers', () => {
  const servers = ref([]);
  const dashboardStats = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  const serversByStatus = computed(() => {
    const grouped = {
      online: [],
      offline: [],
      maintenance: [],
      error: []
    };

    servers.value.forEach(server => {
      if (grouped[server.status]) {
        grouped[server.status].push(server);
      }
    });

    return grouped;
  });

  const totalServers = computed(() => servers.value.length);

  const fetchServers = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await serversAPI.getServers();
      servers.value = response.data.servers;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch servers';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      dashboardStats.value = response.data;
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  };

  const createServer = async (serverData) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await serversAPI.createServer(serverData);
      servers.value.push(response.data.server);
      return response.data.server;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create server';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateServer = async (id, serverData) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await serversAPI.updateServer(id, serverData);
      const index = servers.value.findIndex(s => s.id === id);
      if (index !== -1) {
        servers.value[index] = response.data.server;
      }
      return response.data.server;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update server';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteServer = async (id) => {
    isLoading.value = true;
    error.value = null;

    try {
      await serversAPI.deleteServer(id);
      servers.value = servers.value.filter(s => s.id !== id);
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete server';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const normalizeIds = (ids) => {
    if (!Array.isArray(ids)) return [];
    const unique = new Set();

    ids.forEach((id) => {
      const parsed = parseInt(id);
      if (Number.isFinite(parsed) && parsed > 0) unique.add(parsed);
    });

    return Array.from(unique);
  };

  const bulkDeleteServers = async (ids) => {
    const uniqueIds = normalizeIds(ids);
    if (uniqueIds.length === 0) return [];

    isLoading.value = true;
    error.value = null;

    try {
      await Promise.all(uniqueIds.map((id) => serversAPI.deleteServer(id)));
      servers.value = servers.value.filter((s) => !uniqueIds.includes(s.id));
      return uniqueIds;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to bulk delete servers';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const bulkUpdateServers = async (ids, serverData) => {
    const uniqueIds = normalizeIds(ids);
    if (uniqueIds.length === 0) return [];

    isLoading.value = true;
    error.value = null;

    try {
      const responses = await Promise.all(
        uniqueIds.map((id) => serversAPI.updateServer(id, serverData))
      );

      const updatedServers = responses.map((r) => r.data.server).filter(Boolean);

      // Reconcile local state
      updatedServers.forEach((updated) => {
        const index = servers.value.findIndex((s) => s.id === updated.id);
        if (index !== -1) {
          servers.value[index] = updated;
        }
      });

      return updatedServers;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to bulk update servers';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const bulkUpdateStatus = async (ids, statusValue) => {
    return bulkUpdateServers(ids, { status: statusValue });
  };

  const getServerById = (id) => {
    return servers.value.find(s => s.id === parseInt(id));
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    servers,
    dashboardStats,
    isLoading,
    error,
    serversByStatus,
    totalServers,

    fetchServers,
    fetchDashboardStats,

    createServer,
    updateServer,
    deleteServer,

    bulkDeleteServers,
    bulkUpdateServers,
    bulkUpdateStatus,

    getServerById,
    clearError
  };
});
