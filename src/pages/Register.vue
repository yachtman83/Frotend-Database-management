<template>
    <q-page class="flex flex-center">
      <q-card class="q-pa-md" style="width: 350px;">
        <q-card-section>
          <div class="text-h6">Регистрация</div>
        </q-card-section>
  
        <q-card-section>
          <q-form @submit.prevent="register">
            <q-input v-model="name" label="Имя" required />
            <q-input v-model="email" label="Email" type="email" class="q-mt-md" required />
            <q-input v-model="password" type="password" label="Пароль" class="q-mt-md" required />
            <q-input v-model="confirm_password" type="password" label="Подтвердите пароль" class="q-mt-md" required />
  
            <q-btn type="submit" color="primary" label="Зарегистрироваться" class="q-mt-md full-width" />
          </q-form>
        </q-card-section>
  
        <q-card-section v-if="errorMessage" class="text-red">
          {{ errorMessage }}
        </q-card-section>
      </q-card>
    </q-page>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import { useRouter } from "vue-router";
  import { api } from "src/boot/axios";
  
  const router = useRouter();
  const name = ref("");
  const email = ref("");
  const password = ref("");
  const confirm_password = ref("");
  const errorMessage = ref("");
  
  const register = async () => {
    if (password.value !== confirm_password.value) {
      errorMessage.value = "Пароли не совпадают!";
      return;
    }
  
    try {
      const response = await api.post("/auth/register", {
        name: name.value,
        email: email.value,
        password: password.value,
      });
  
      console.log("Пользователь зарегистрирован:", response.data);
      router.push("/login"); // Перенаправляем на страницу входа после успешной регистрации
    } catch (error) {
      errorMessage.value = error.response?.data?.message || "Ошибка регистрации!";
    }
  };
  </script>
  