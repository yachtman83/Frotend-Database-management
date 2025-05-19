import { boot } from 'quasar/wrappers';
import axios from 'axios';
import { useRouter } from 'vue-router';

// Создаем экземпляр axios с базовым URL
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // Замени на свой URL Laravel API
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена в заголовки
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Обрабатываем ошибки авторизации
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Если токен невалиден, пытаемся обновить его
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          // Попытка получить новый токен
          const response = await api.post("/auth/refresh", { refresh_token: refreshToken });
          const { access_token } = response.data;
          
          // Сохраняем новый токен в localStorage
          localStorage.setItem("token", access_token);
          
          // Повторно отправляем исходный запрос с новым токеном
          error.config.headers["Authorization"] = `Bearer ${access_token}`;
          
          return api(error.config); // Повторяем запрос с новым токеном
        } catch (refreshError) {
          // Если не удалось обновить токен, удаляем все токены и отправляем на логин
          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");
          window.router.push("/login"); // Перенаправляем на страницу логина
        }
      } else {
        // Если нет refresh токена, отправляем на логин
        localStorage.removeItem("token");
        window.router.push("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default boot(({ app }) => {
  // Инициализируем роутер
  const router = useRouter();
  // Делаем роутер доступным через глобальные свойства
  app.config.globalProperties.$router = router;
  window.router = router; // Устанавливаем роутер как глобальную переменную, чтобы он был доступен в интерцепторах

  // Делаем Axios доступным в каждом Vue-компоненте через this.$axios и this.$api
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
