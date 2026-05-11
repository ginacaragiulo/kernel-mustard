<script>
export default {
  name: 'TableSkeleton',
  props: {
    rows: {
      type: Number,
      default: 5,
    },
    cols: {
      type: Number,
      default: 1,
    },
    cellTdClass: {
      type: String,
      default: 'px-4 py-4',
    },
    cellInnerClass: {
      type: String,
      default: 'h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full',
    },
    badgeInnerWidthClass: {
      type: String,
      default: 'w-16',
    },
    checkboxInnerWidthClass: {
      type: String,
      default: 'w-5',
    },
  },
};
</script>

<template>
  <tr
    v-for="row in rows"
    :key="`sk-row-${row}`"
  >
    <td
      v-for="col in cols"
      :key="`sk-cell-${row}-${col}`"
      :class="cellTdClass"
    >
      <div
        :class="[
          cellInnerClass,
          // Slight variety for common table patterns:
          // - first column (often a badge/health): narrow
          // - second column (often a checkbox): narrow
          col === 1 ? badgeInnerWidthClass : '',
          col === 2 ? checkboxInnerWidthClass : ''
        ]"
      />
    </td>
  </tr>
</template>
