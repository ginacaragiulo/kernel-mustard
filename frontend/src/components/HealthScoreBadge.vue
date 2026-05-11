<script>
import { computed } from 'vue';
import { getHealthScoreColorClasses } from '../composables/useServerHealthScore';

export default {
  name: 'HealthScoreBadge',
  props: {
    score: {
      type: [Number, null],
      default: null
    }
  },
  setup(props) {
    const classes = computed(() => getHealthScoreColorClasses(props.score));

    const display = computed(() => {
      if (props.score === null || props.score === undefined) return 'N/A';
      return `${props.score}`;
    });

    return {
      classes,
      display
    };
  }
};
</script>

<template>
  <span
    class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full"
    :class="classes"
    :title="score === null ? 'Health score unavailable' : `Health score: ${score}/100`"
    aria-label="Health score"
  >
    {{ display }}
  </span>
</template>
