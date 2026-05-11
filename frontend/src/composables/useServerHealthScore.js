const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const isValidNumber = (value) => typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value);

const normalizeCpuUtilizationPercent = (cpuUsage) => {
  // Backend stores cpu_usage as 0..1
  if (!isValidNumber(cpuUsage)) return null;
  return clamp(cpuUsage * 100, 0, 100);
};

const normalizeMemoryUtilizationPercent = (memoryUsage) => {
  // Backend stores memory_usage as 0..100 (%)
  if (!isValidNumber(memoryUsage)) return null;
  return clamp(memoryUsage, 0, 100);
};

const normalizeDiskUtilizationPercent = (diskUsage) => {
  // Backend stores disk_usage as 0..1
  if (!isValidNumber(diskUsage)) return null;
  return clamp(diskUsage * 100, 0, 100);
};

/**
 * Returns:
 * - score: number (0..100) or null if metrics are missing/invalid
 *
 * Weighting (per README):
 * - CPU 40%
 * - Memory 40%
 * - Disk 20%
 *
 * "Closer to 100 indicates better health" => we invert utilization:
 * health = 100 - weightedUtilization
 */
export const calculateServerHealthScore = (server) => {
  if (!server || typeof server !== 'object') return { score: null };

  const cpuUtil = normalizeCpuUtilizationPercent(server.cpu_usage);
  const memUtil = normalizeMemoryUtilizationPercent(server.memory_usage);
  const diskUtil = normalizeDiskUtilizationPercent(server.disk_usage);

  if (cpuUtil === null || memUtil === null || diskUtil === null) {
    return { score: null };
  }

  const weightedUtil =
    cpuUtil * 0.4 +
    memUtil * 0.4 +
    diskUtil * 0.2;

  const health = clamp(100 - weightedUtil, 0, 100);
  return { score: Math.round(health) };
};

export const getHealthScoreColorClasses = (score) => {
  if (!isValidNumber(score)) {
    return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800';
  }

  // Simple tiers:
  // 80-100: good (green)
  // 50-79: warning (yellow)
  // <50: bad (red)
  if (score >= 80) {
    return 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
  }
  if (score >= 50) {
    return 'text-yellow-800 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30';
  }
  return 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
};
