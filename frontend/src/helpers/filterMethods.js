const formatPercent = (value) => {
  if (value === null || value === undefined) return 'N/A';

  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num)) return 'N/A';

  // Backend scales:
  // - cpu_usage, disk_usage: 0..1 (fraction)
  // - memory_usage: 0..100 (already a percent)
  const normalizedPercent = num <= 1 ? num * 100 : num;

  const clamped = Math.min(100, Math.max(0, normalizedPercent));
  return Math.round(clamped);
};

export default {
  formatPercent
};
