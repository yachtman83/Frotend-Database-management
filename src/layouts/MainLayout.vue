<template>
  <q-layout view="hHh lpR fFf">
    <!-- Верхняя панель навигации -->
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>Моё SPA-приложение</q-toolbar-title>
        <!-- Кнопка выхода удалена из шапки -->
      </q-toolbar>
    </q-header>

    <!-- Боковое меню -->
    <q-drawer v-model="leftDrawerOpen" show-if-above>
      <q-list>
        <q-item clickable v-ripple to="/">
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>Главная</q-item-section>
        </q-item>

        <!-- Панель управления видна только если пользователь авторизован -->
        <q-item clickable v-ripple to="/profile" v-if="isAuthenticated">
          <q-item-section avatar>
            <q-icon name="profile" />
          </q-item-section>
          <q-item-section>Профиль</q-item-section>
        </q-item>


        <!-- Кнопка выхода видна только если пользователь авторизован -->
        <q-item clickable v-ripple @click="logout" v-if="isAuthenticated">
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>Выйти</q-item-section>
        </q-item>
        <!-- Панель управления видна только если пользователь авторизован -->
        <q-item clickable v-ripple to="/details" v-if="isAuthenticated">
          <q-item-section>Детали</q-item-section>
        </q-item>

        <!-- Панель управления видна только если пользователь авторизован -->
        <q-item clickable v-ripple to="/products" v-if="isAuthenticated">
          <q-item-section>Типы продукции</q-item-section>
        </q-item>

        <!-- Панель управления видна только если пользователь авторизован -->
        <q-item clickable v-ripple to="/employees" v-if="isAuthenticated">
          <q-item-section>Сотрудники</q-item-section>
        </q-item>

        <!-- Панель управления видна только если пользователь авторизован -->
        <q-item clickable v-ripple to="/workshops" v-if="isAuthenticated">
          <q-item-section>Фабрики</q-item-section>
        </q-item>

        <!-- Панель управления видна только если пользователь авторизован -->
        <q-item clickable v-ripple to="/salaries" v-if="isAuthenticated">
          <q-item-section>История зарплат</q-item-section>
        </q-item>



        <!-- Кнопка входа видна только если пользователь не авторизован -->
        <q-item clickable v-ripple to="/login" v-if="!isAuthenticated">
          <q-item-section avatar>
            <q-icon name="login" />
          </q-item-section>
          <q-item-section>Войти</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/register" v-if="!isAuthenticated">
          <q-item-section avatar>
            <q-icon name="register" />
          </q-item-section>
          <q-item-section>Регистрация</q-item-section>
        </q-item>


        

      </q-list>
    </q-drawer>

    <!-- Контент страницы -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
  import { ref, computed } from 'vue';
  import { useRouter } from 'vue-router';

  const router = useRouter();
  const leftDrawerOpen = ref(false);

  // Проверяем, авторизован ли пользователь
  const isAuthenticated = computed(() => !!localStorage.getItem('token'));

  // Функция для выхода
  const logout = () => {
    // Удаляем токен из localStorage и перенаправляем на страницу логина
    localStorage.removeItem('token');
    router.push('/login');
    // Обновляем состояние isAuthenticated
    window.location.reload(); // Чтобы обновить интерфейс после выхода
  };

  // Открытие/закрытие бокового меню
  const toggleLeftDrawer = () => {
    leftDrawerOpen.value = !leftDrawerOpen.value;
  };

  // Функция для логина и обновления состояния после авторизации
  const login = () => {
    // После логина обновляем состояние и перезагружаем страницу
    localStorage.setItem('token', 'your_token'); // Пример с добавлением токена
    router.push('/dashboard');
    window.location.reload(); // Перезагружаем страницу, чтобы обновить состояние
  };
</script>