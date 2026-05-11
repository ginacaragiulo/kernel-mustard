<script>
import { ref, onMounted } from 'vue';
import { usersAPI } from '../services/api';
import { useAuthStore } from '../stores/auth';

export default {
  name: 'UsersView',
  setup() {
    const authStore = useAuthStore();
    const users = ref([]);
    const isLoading = ref(false);
    const error = ref(null);
    
    const showDeleteModal = ref(false);
    const userToDelete = ref(null);
    const showCreateModal = ref(false);
    const showEditModal = ref(false);
    const userToEdit = ref(null);
    
    const newUser = ref({
      username: '',
      email: '',
      password: '',
      is_admin: false
    });

    const fetchUsers = async () => {
      isLoading.value = true;
      error.value = null;
      try {
        const response = await usersAPI.getUsers();
        users.value = response.data.users;
      } catch (err) {
        error.value = err.response?.data?.error || 'Failed to fetch users';
      } finally {
        isLoading.value = false;
      }
    };

    const confirmDelete = (user) => {
      userToDelete.value = user;
      showDeleteModal.value = true;
    };

    const deleteUser = async () => {
      if (userToDelete.value) {
        try {
          await usersAPI.deleteUser(userToDelete.value.id);
          await fetchUsers();
          showDeleteModal.value = false;
          userToDelete.value = null;
        } catch (error) {
          console.error('Failed to delete user:', error);
        }
      }
    };

    const createUser = async () => {
      try {
        await usersAPI.createUser(newUser.value);
        await fetchUsers();
        showCreateModal.value = false;
        resetNewUser();
      } catch (err) {
        error.value = err.response?.data?.error || 'Failed to create user';
      }
    };

    const editUser = (user) => {
      userToEdit.value = { ...user };
      showEditModal.value = true;
    };

    const updateUser = async () => {
      try {
        await usersAPI.updateUser(userToEdit.value.id, {
          username: userToEdit.value.username,
          email: userToEdit.value.email,
          is_active: userToEdit.value.is_active,
          is_admin: userToEdit.value.is_admin,
          ...(userToEdit.value.password && { password: userToEdit.value.password })
        });
        await fetchUsers();
        showEditModal.value = false;
        userToEdit.value = null;
      } catch (err) {
        error.value = err.response?.data?.error || 'Failed to update user';
      }
    };

    const resetNewUser = () => {
      newUser.value = {
        username: '',
        email: '',
        password: '',
        is_admin: false
      };
    };

    const getStatusColor = (isActive) => {
      return isActive 
        ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
        : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString();
    };

    onMounted(() => {
      fetchUsers();
    });

    return {
      users,
      isLoading,
      error,
      showDeleteModal,
      userToDelete,
      showCreateModal,
      showEditModal,
      userToEdit,
      newUser,
      fetchUsers,
      confirmDelete,
      deleteUser,
      createUser,
      editUser,
      updateUser,
      resetNewUser,
      getStatusColor,
      formatDate,
      authStore
    };
  }
};
</script>

<template>
  <div class="px-6 py-8">
    <div class="mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
          <p class="text-gray-600 dark:text-gray-400">Manage system users</p>
        </div>
        <button
          @click="showCreateModal = true"
          class="btn btn-primary"
        >
          Add User
        </button>
      </div>
    </div>

    <!-- Error message -->
    <div
      v-if="error"
      class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4"
    >
      {{ error }}
    </div>

    <!-- Users Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="user in users"
              :key="user.id"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ user.username }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">{{ user.email }}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex px-2 text-xs font-semibold rounded-full"
                  :class="getStatusColor(user.is_active)"
                >
                  {{ user.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex px-2 text-xs font-semibold rounded-full"
                  :class="user.is_admin ? 'text-purple-700 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30' : 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-700'"
                >
                  {{ user.is_admin ? 'Admin' : 'User' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ formatDate(user.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="editUser(user)"
                  class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3 cursor-pointer transition-colors"
                >
                  Edit
                </button>
                <button
                  v-if="user.id !== authStore.user?.id"
                  @click="confirmDelete(user)"
                  class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 cursor-pointer transition-colors"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="users.length === 0 && !isLoading"
        class="text-center py-12"
      >
        <p class="text-gray-500 dark:text-gray-400">No users found.</p>
      </div>
    </div>

    <!-- Create User Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border dark:border-gray-600 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Create New User</h3>
          <form @submit.prevent="createUser">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
              <input
                v-model="newUser.username"
                type="text"
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              >
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                v-model="newUser.email"
                type="email"
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              >
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input
                v-model="newUser.password"
                type="password"
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              >
            </div>
            <div class="mb-4">
              <label class="flex items-center">
                <input
                  v-model="newUser.is_admin"
                  type="checkbox"
                  class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                >
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Admin User</span>
              </label>
            </div>
            <div class="flex justify-end space-x-4">
              <button
                type="button"
                @click="showCreateModal = false; resetNewUser()"
                class="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div
      v-if="showEditModal && userToEdit"
      class="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border dark:border-gray-600 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Edit User</h3>
          <form @submit.prevent="updateUser">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
              <input
                v-model="userToEdit.username"
                type="text"
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              >
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                v-model="userToEdit.email"
                type="email"
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              >
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password (leave blank to keep current)</label>
              <input
                v-model="userToEdit.password"
                type="password"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              >
            </div>
            <div class="mb-4">
              <label class="flex items-center">
                <input
                  v-model="userToEdit.is_active"
                  type="checkbox"
                  class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                >
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Active User</span>
              </label>
            </div>
            <div class="mb-4">
              <label class="flex items-center">
                <input
                  v-model="userToEdit.is_admin"
                  type="checkbox"
                  class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                >
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Admin User</span>
              </label>
            </div>
            <div class="flex justify-end space-x-4">
              <button
                type="button"
                @click="showEditModal = false; userToEdit = null"
                class="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
              >
                Update User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border dark:border-gray-600 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3 text-center">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Delete User</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete <strong class="text-gray-900 dark:text-gray-100">{{ userToDelete?.username }}</strong>?
              This action cannot be undone.
            </p>
          </div>
          <div class="flex justify-center space-x-4 mt-4">
            <button
              @click="showDeleteModal = false"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              @click="deleteUser"
              class="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
