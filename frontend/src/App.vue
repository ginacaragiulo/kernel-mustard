<script>
import { RouterView } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';
import ToastViewport from './components/ToastViewport.vue';

export default {
  name: 'App',
  components: {
    RouterView,
    ToastViewport
  },
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();

    const logout = async () => {
      await authStore.logout();
      router.push('/login');
    };

    onMounted(() => {
      authStore.checkAuth();
    });

    return {
      authStore,
      logout
    };
  }
};
</script>

<template>
  <div
    id="app"
    class="h-screen bg-gray-50 dark:bg-gray-900 font-primary"
  >
    <div
      v-if="authStore.isAuthenticated"
      class="flex h-full"
    >
      <!-- Sidebar -->
      <div class="flex-shrink-0">
        <div class="flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-700/10 h-full border-r dark:border-gray-700">
          <!-- Logo/Brand -->
          <div class="flex items-center justify-center h-16 px-4 bg-indigo-600 dark:bg-indigo-700">
            <h1 class="text-xl font-bold text-white">HolistiServe</h1>
          </div>

          <!-- Navigation -->
          <nav class="flex-1 px-2 py-4 space-y-2">
            <RouterLink
              to="/"
              class="flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 group"
              active-class="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900"
            >
              <svg
                class="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400"
                :class="{ 'text-indigo-500 dark:text-indigo-400': $route.path === '/' }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                />
              </svg>
              Dashboard
            </RouterLink>
            <RouterLink
              to="/servers"
              class="flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 group"
              active-class="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900"
            >
              <svg
                class="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400"
                :class="{ 'text-indigo-500 dark:text-indigo-400': $route.path.startsWith('/servers') }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1"
                />
              </svg>
              Servers
            </RouterLink>
            <RouterLink
              v-if="authStore.user?.is_admin"
              to="/users"
              class="flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 group"
              active-class="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900"
            >
              <svg
                class="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400"
                :class="{ 'text-indigo-500 dark:text-indigo-400': $route.path.startsWith('/users') }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
              Users
            </RouterLink>
          </nav>

          <!-- User section -->
          <div class="flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
            <div class="px-4 py-4">
              <div class="flex items-center justify-between">
                <RouterLink
                  to="/account"
                  class="flex items-center flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md p-2 -m-2 transition-colors duration-200"
                  active-class="bg-indigo-50 dark:bg-indigo-900/50"
                >
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-indigo-600 dark:bg-indigo-700 rounded-full flex items-center justify-center">
                      <span class="text-sm font-medium text-white">
                        {{ authStore.user?.username?.charAt(0).toUpperCase() }}
                      </span>
                    </div>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100">{{ authStore.user?.username }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">My Account</p>
                  </div>
                </RouterLink>
                <button
                  @click="logout"
                  class="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500"
                  title="Logout"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main content -->
      <main class="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
        <RouterView />
      </main>
    </div>
    
    <!-- Login/Register pages (no sidebar) -->
    <div
      v-else
      class="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      <RouterView />
    </div>

    <ToastViewport />
  </div>
</template>
