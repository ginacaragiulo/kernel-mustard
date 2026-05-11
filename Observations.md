## Time
**Estimated Time Spent:**
~5.5 hours  
- 30 minutes: Initial review to understand mission, identify knowns and unknowns to effectively evaluate design, get questions answered (I assumed a lot in regards to Q&A for this exercise) and validate understanding.
- 1 hour: Clone repo, env setup, code spelunking, gap identification
- 4 hours: Writing code and testing results - created composables

## AI
[ x ] - Did you use AI tooling during the completion of your work?

**Details**
What tooling did you use?: Sixth extension (Claude Opus)  
- Used AI tooling to inspect existing code, help with validation of new Vue composables/components/stores, and apply targeted edits. It was a pretty consistent back-and-forth prompting Claude to create exactly what I wanted in order to develop faster.
- Claude compiled initial documentation that I reviewed and edited.

---

### Observed bugs / fixes
- Dashboard CPU usage was displayed as a 0..1 fraction rather than a percentage.
- Frontend percent formatting was inconsistent with backend metric scales:
  - `cpu_usage` and `disk_usage` are stored as fractions (0..1)
  - `memory_usage` is stored as a percent already (0..100)
- This could lead to misleading values (including >100%); fixed by normalizing/clamping in shared utilities (`formatPercent`) and reusing those normalized values for health scoring display.
- Table/label consistency: standardized table header casing/styling so headers aren’t mixed (caps vs capitalized).
- Action affordances: ensured Edit/Delete action buttons have consistent hover + `cursor-pointer` styling and correct disabled states.
- Modal lifecycle: ensured modal form state and validation errors reset properly when closing/leaving the modal (handled via watchers in `EditServerModal.vue`).
- User feedback: wired success/error flows to be visible via toasts (and kept inline error banner behavior), so users don’t “miss” whether an async operation succeeded/failed.
- Selected servers sidebar UX: fixed the sidebar to be full-height with internal scrolling, slide-in from the right, and prevented the servers page layout from being covered or “jumping” during the animation (via fixed panel + stable padding).

---

## Task FE-001: Server Health Monitoring

### Implementation / What I changed
- Added `useServerHealthScore` composable and `HealthScoreBadge` component.
- Dashboard now shows an overall health score (0..100) using weights:
  - CPU 40%
  - Memory 40%
  - Disk 20%
- Health is inverted so higher values indicate better health (higher score = healthier).

### README “Considerations” — Answers
- **Where should this feature appear in the UI?**
  - As a compact numeric badge (“Health Score”) so it can be scanned quickly.
  - Health is also used as a sort option where applicable (e.g., dashboard/server tables).
- **What happens when resource data is missing or invalid?**
  - If any required metric (CPU/memory/disk) is missing or invalid, the health score returns `null`.
  - The UI displays `N/A` when the score is unavailable.
- **What UX decisions might you make to maximize the value of this health score?**
  - Clamp and normalize into a consistent 0..100 range.
  - Invert utilization so “higher is better”.
  - Use color tiers (green/yellow/red) for quick interpretation.

### Manual verification needed (tool restrictions)
- Percent + health score render as expected:
  - CPU/Disk show integer % values
  - Memory shows correct % values
  - Health score is between 0..100

---

## Task FE-002: Filtering and Sorting

### Implementation / What I changed
- Added `useServersFilters` composable.
- `ServersView.vue` supports:
  - Filtering by:
    - server name (substring)
    - IP address (substring)
    - status
    - location
  - Sorting by:
    - name
    - status
    - location
    - uptime

### README “Considerations” — Answers
- **How should filter state be managed?**
  - Filter/sort state lives in `useServersFilters` within the view.
  - It does not persist between visits (per README).
- **Is there any other data that would be valuable to filter on?**
  - Potential future filters: OS, hostname domain, health score range, health/utilization thresholds, and combined location+status refinements.
  - Not implemented beyond name/IP/status/location in this pass.

---

## Task FE-003: Dashboard Interactivity

### Implementation / What I changed
- Dashboard supports:
  - manual refresh button
  - auto-refresh toggle
  - “Recent Servers” table sortable by:
    - health
    - uptime
    - name
    - status
    - location

### README “Considerations” — Answers
- **What types of interaction would a user benefit from?**
  - Manual refresh for “now” data.
  - Auto-refresh toggle for continuous updates.
  - Sorting in “Recent Servers” so users can prioritize what matters.
- **How could you improve the “real time” feel of the dashboard?**
  - Auto-refresh keeps the “Recent Servers” list updated periodically.
- **How might a user want to customize their dashboard?**
  - Future improvements: configurable refresh interval, user-selected widgets, saved presets.

---

## Task FE-004: Bulk Operations (+ Selected Servers Sidebar UX)

### Implementation / What I changed
- `ServersView.vue` supports selecting servers and bulk operations:
  - bulk delete
  - bulk status update (online/offline/maintenance/error)
- **Selected Servers Sidebar UX improvements (today)**:
  - `SelectedServersSidebar.vue` updated to be full-height (`h-full`) with internal scrolling.
  - `ServersView.vue` renders the sidebar as a fixed right-side panel that **slides in from the right**.
  - `ServersView.vue` applies matching right padding to the main content while the sidebar is visible, including keeping padding stable through the sidebar slide-out animation (prevents width “jumps” and table/card overlap).

### README “Considerations” — Answers
- **Are there any other operations that should support bulk actions?**
  - Natural extensions: bulk maintenance window toggles, bulk tagging, bulk reclassification (not implemented here).
- **How will you manage selection state?**
  - Selection tracked via `selectedIds` in `ServersView.vue`.
  - Derived `selectedServers` computed from those IDs.
- **What confirmation/safety measures are needed?**
  - Bulk delete/status updates are protected by confirmation modals.
  - “Clear selection” is available in the sidebar to quickly reset state.
- **Worth Noting**
- The Bulk Edit/Delete/Confirmation modals are static in the component. I would have created a one-modal-to-rule-them-all resuable modal component, with necessary props and insert into the DOM using `Teleport`, but ran out of time. That could replace the `EditServerModal.vue`component as well.

---

## Task FE-005: Error Handling and User Feedback

### Implementation / What I changed
- Added Pinia notifications store (`useNotificationsStore`).
- Added `ToastViewport` component and mounted it in `App.vue`.
- Wired toasts + loading/disabled states into:
  - `EditServerModal.vue`
  - `ServerFormView.vue`
  - `ServersView.vue`
- Preserved existing inline error banner behavior via `serversStore.error`.

### README “Considerations” — Answers
- **What type of actions should the user be notified about?**
  - Success/failure for async operations: create/edit/delete, bulk delete/status update (toast, snackbar).
  - Basically any time data changes, the user needs to be notified.
  - Loading, processing, incrementing, (spinners, skeletons)
- **When should users be notified of these actions?**
  - Immediately after the request resolves (success toast or error toast).
- **How should information be communicated (form errors, loading states, state updates)?**
  - Loading state: mutation buttons disabled via `serversStore.isLoading` to prevent duplicate submissions.
  - Errors: inline banner for `serversStore.error` plus toast notifications for async failures.
- **What loading states are missing?**
  - ### Login

- __No loading/error UX for network/transport failures__ beyond `authStore.error` text.
- `LoginView.vue` doesn’t render a spinner/skeleton beyond button text; if the request hangs, there’s no global timeout/inline “could not reach server” differentiation.
- `authStore.login()` sets `error` to `err.response?.data?.error || 'Login failed'`, which means __connection-refused/network errors__ become the same generic message (“Login failed”).

### Dashboard (`DashboardView.vue`)

- Calls both `fetchServers()` and `fetchDashboardStats()` on mount, but:

  - __No overall loading state__ (no “Loading dashboard…” / skeleton).
  - Charts/table render fall back to `0`/empty data immediately (`dashboardStats?.total_servers || 0`), so users see misleading numbers until requests finish.
  - No error state if either request fails.

### Servers (`ServersView.vue`)

- `onMounted(() => serversStore.fetchServers())`:

  - __No loading state__ for the table.
  - If the servers array is empty due to a fetch failure, the UI shows __“No servers found.”__ (ambiguous: could mean “loading” or “error”).

- Delete/edit flows:

  - Delete modal has no `isDeleting` disabled state; repeated clicks are possible.
  - No visible error toast/inline error if delete fails (only `console.error`).

### Charts (`StatusChart.vue`, `UsageChart.vue`)

- Charts assume numeric props; while data is `{}` you’ll render __all zeros__ rather than showing a loading/empty state.
- No error/empty-state messaging when the stats call fails.


---
