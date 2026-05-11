import { ref, computed } from 'vue';
import { calculateServerHealthScore } from './useServerHealthScore';

const normalize = (value) => (value ?? '').toString().trim().toLowerCase();

const defaultSortDirectionFor = (sortBy) => {
  if (sortBy === 'uptime') return 'desc';
  if (sortBy === 'health') return 'desc';
  return 'asc';
};

const compareStrings = (a, b) => normalize(a).localeCompare(normalize(b));

export const useServersFilters = (serversRef) => {
  const nameQuery = ref('');
  const ipQuery = ref('');
  const status = ref('all'); // online/offline/maintenance/error/all
  const location = ref('all');

  const sortBy = ref('name'); // name/status/location/uptime/health
  const sortDirection = ref(defaultSortDirectionFor(sortBy.value));

  const availableLocations = computed(() => {
    const set = new Set();
    (serversRef.value ?? []).forEach((server) => {
      if (server?.location) set.add(server.location);
    });
    return Array.from(set).sort((a, b) => normalize(a).localeCompare(normalize(b)));
  });

  const filteredServers = computed(() => {
    const name = normalize(nameQuery.value);
    const ip = normalize(ipQuery.value);

    return (serversRef.value ?? []).filter((server) => {
      if (!server) return false;

      if (name && !normalize(server.name).includes(name)) return false;
      if (ip && !normalize(server.ip_address).includes(ip)) return false;

      if (status.value !== 'all' && server.status !== status.value) return false;

      if (location.value !== 'all' && server.location !== location.value) return false;

      return true;
    });
  });

  const sortedServers = computed(() => {
    const arr = filteredServers.value.slice();

    const directionMultiplier = sortDirection.value === 'desc' ? -1 : 1;

    arr.sort((a, b) => {
      if (sortBy.value === 'health') {
        const sa = calculateServerHealthScore(a).score ?? -1;
        const sb = calculateServerHealthScore(b).score ?? -1;
        return (sa - sb) * directionMultiplier;
      }

      if (sortBy.value === 'name') {
        return compareStrings(a.name, b.name) * directionMultiplier;
      }
      if (sortBy.value === 'status') {
        return compareStrings(a.status, b.status) * directionMultiplier;
      }
      if (sortBy.value === 'location') {
        return compareStrings(a.location, b.location) * directionMultiplier;
      }
      if (sortBy.value === 'uptime') {
        const ua = typeof a.uptime === 'number' ? a.uptime : 0;
        const ub = typeof b.uptime === 'number' ? b.uptime : 0;
        return (ua - ub) * directionMultiplier;
      }

      return 0;
    });

    return arr;
  });

  const setSortBy = (value) => {
    sortBy.value = value;
    sortDirection.value = defaultSortDirectionFor(value);
  };

  const visibleServers = computed(() => sortedServers.value);

  return {
    // state
    nameQuery,
    ipQuery,
    status,
    location,
    sortBy,
    sortDirection,

    // derived
    availableLocations,
    filteredServers,
    visibleServers,

    // actions
    setSortBy,
  };
};
