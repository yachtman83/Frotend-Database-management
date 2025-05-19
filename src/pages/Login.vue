<template>
  <q-page class="flex flex-center">
    <q-card class="q-pa-md" style="width: 300px;">
      <q-card-section>
        <q-input v-model="email" label="Email" />
        <q-input v-model="password" type="password" label="Пароль" class="q-mt-md" />
      </q-card-section>

      <q-card-actions>
        <q-btn @click="login" color="primary" label="Войти" />
      </q-card-actions>

      <q-card-section v-if="errorMessage" class="text-red">
      {{ errorMessage }}

    </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from "vue-router";
import { api } from "src/boot/axios"; 

defineOptions({ name: "LoginPage" }); // Добавляем имя компонента

const router = useRouter();
const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref("");

const login = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await api.post("/auth/login", {
      email: email.value,
      password: password.value,
    });

    const token = response.data.access_token;
    localStorage.setItem("token", token);
    router.push("/profile");
  } catch (error) {
    errorMessage.value = "Ошибка входа. Проверьте логин и пароль.";
  } finally {
    loading.value = false;
  }
};
</script>
