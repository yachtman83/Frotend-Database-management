<template>
  <q-page class="q-pa-md">
    <h1>Панель управления</h1>

    <!-- Пример таблицы с данными -->
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="id"
    />

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from 'boot/axios'; // Импортируем axios

const users = ref([]); // Массив для хранения пользователей
const loading = ref(true); // Флаг загрузки

const fetchUsers = async () => {
  try {
    const response = await api.get('/users'); // Запрос к API
    users.value = response.data; // Заполняем массив полученными данными
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
  } finally {
    loading.value = false; // Отключаем состояние загрузки
  }
};

onMounted(() => {
  fetchUsers(); // Загружаем данные при открытии страницы
});
</script>

<template>
  <q-page class="q-pa-md">
    <h2>Список пользователей</h2>

    <q-table
      v-if="!loading"
      :rows="users"
      :columns="[
        { name: 'id', label: 'ID', align: 'center', field: row => row.id },
        { name: 'name', label: 'Имя', align: 'left', field: row => row.name },
        { name: 'email', label: 'Email', align: 'left', field: row => row.email }
      ]"
      row-key="id"
    />

    <q-spinner v-else size="lg" color="primary" />
  </q-page>
</template>
