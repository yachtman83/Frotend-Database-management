<template>
    <q-page class="q-pa-md">
      <h2>Личный кабинет</h2>
  
      <q-card class="q-pa-md">
        <q-card-section>
          <div class="text-h6">{{ user.name }}</div>
          <div class="text-subtitle1">{{ user.email }}</div>
        </q-card-section>
  
        <q-card-actions>
          <q-btn color="primary" label="Редактировать" @click="editDialog = true" />
          <q-btn color="secondary" label="Сменить пароль" @click="changePasswordDialog = true" />
        </q-card-actions>
      </q-card>


      <!-- Выбор количества строк на странице -->
      <q-select
        v-model="paginationRows"
        :options="rowsOptions"
        label="Количество строк на странице"
        @update:model-value="updatePaginationRows"
        class="q-mt-md"
      />

      <!-- Диалог редактирования профиля -->
      <q-dialog v-model="editDialog">
        <q-card class="q-pa-md" style="width: 400px">
          <q-card-section>
            <div class="text-h6">Редактирование профиля</div>
          </q-card-section>
  
          <q-card-section>
            <q-input v-model="editedUser.name" label="Имя" class="q-mt-md" required />
            <q-input v-model="editedUser.email" label="Email" type="email" class="q-mt-md" required />
          </q-card-section>
  
          <q-card-actions>
            <q-btn label="Отмена" color="secondary" @click="editDialog = false" />
            <q-btn label="Сохранить" color="primary" @click="updateProfile" :loading="loading" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Диалог смены пароля -->
      <q-dialog v-model="changePasswordDialog">
        <q-card class="q-pa-md" style="width: 400px">
          <q-card-section>
            <div class="text-h6">Смена пароля</div>
          </q-card-section>
  
          <q-card-section>
            <q-input v-model="oldPassword" type="password" label="Старый пароль" class="q-mt-md" required />
            <q-input v-model="newPassword" type="password" label="Новый пароль" class="q-mt-md" required />
          </q-card-section>
  
          <q-card-actions>
            <q-btn label="Отмена" color="secondary" @click="changePasswordDialog = false" />
            <q-btn label="Обновить пароль" color="primary" @click="updatePassword" :loading="loading" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-page>
  </template>
  
  <script setup>
    import { ref, onMounted } from "vue";
    import { api } from "src/boot/axios";
    import { useQuasar } from "quasar";
  
    const $q = useQuasar();
    
    const user = ref({});
    const editedUser = ref({});
    const editDialog = ref(false);
    const changePasswordDialog = ref(false);
    const oldPassword = ref("");
    const newPassword = ref("");
    const errorMessage = ref("");
    const loading = ref(false);
  
    // Функция для загрузки данных профиля
    const fetchProfile = async () => {
      try {
        const response = await api.get("/auth/profile");
        user.value = response.data;
        editedUser.value = { ...response.data }; // Копируем данные для редактирования
      } catch (error) {
        console.error("Ошибка загрузки профиля", error);
      }
    };
    const paginationRows = ref(localStorage.getItem('paginationRows') || 10); // Инициализируем значением из localStorage, по умолчанию 10
    const rowsOptions = [1, 2, 5, 10, 20, 50, 100]; // Возможные варианты для выбора

    // Обновление сохраненного значения
    const updatePaginationRows = (value) => {
      localStorage.setItem('paginationRows', value); // Сохраняем в localStorage
    };
    // Функция для обновления профиля
    const updateProfile = async () => {
      loading.value = true;
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("Токен не найден.");
          return;
        }

        // Логируем данные перед отправкой
        console.log("Данные перед отправкой:", editedUser.value);

    // Отправляем запрос на обновление профиля
    const response = await api.put("/auth/profile", editedUser.value, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log(typeof editedUser.value.name);
    // Логируем ответ от сервера
    console.log("Профиль обновлен", response.data);

    // Обновляем данные пользователя
    user.value = response.data.user;

    // Закрываем диалог
    editDialog.value = false;
  } catch (error) {
    console.error("Ошибка при обновлении профиля", error);
  } finally {
    loading.value = false;
  }
};



  
    // Функция для обновления пароля
    const updatePassword = async () => {
      loading.value = true;
      try {
        await api.put("/auth/change-password", {
          current_password: oldPassword.value,
          new_password: newPassword.value,
        });
        console.log("Пароль успешно изменен");
        changePasswordDialog.value = false;
        oldPassword.value = "";
        newPassword.value = "";
      } catch (error) {
        console.error("Ошибка при смене пароля", error);
      } finally {
        loading.value = false;
      }
    };
  
    // Загружаем данные профиля при монтировании компонента
    onMounted(fetchProfile);
  </script>
  