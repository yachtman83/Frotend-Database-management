<template>
  <q-page>
    <h2>Список мастерских</h2>

    <p v-if="!isAuthenticated">
      Вам нужно <router-link to="/login">войти</router-link>, чтобы увидеть данные.
    </p>

    <p v-if="filteredRows.length > 0">
      Найдено {{ filteredRows.length }} записи(ей)
    </p>
    <p v-else>Нет записей для отображения.</p>

    <!-- Фильтры по каждому столбцу -->
    <div class="q-pa-md row q-gutter-md">
      <q-select v-model="filters.title" :options="uniqueValues('title')" label="Название мастерской" clearable />
      <q-select v-model="filters.chief_name" :options="uniqueValues('chief_name')" label="Имя руководителя" clearable />
      <q-select v-model="filters.chief_surname" :options="uniqueValues('chief_surname')" label="Фамилия руководителя" clearable />
    </div>

    <q-table
      v-if="isAuthenticated"
      :rows="sortedRows"
      :columns="columns"
      row-key="id"
      :rows-per-page="paginationRows"
      :pagination.sync="pagination"
    >
      <template v-slot:header>
        <q-tr class="custom-header">
          <q-th align="center">#</q-th>
          <q-th v-for="col in columns" :key="col.name" align="left" @click="sortBy(col.field)">
            {{ col.label }}
            <q-icon v-if="sortField === col.field" :name="sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'" />
          </q-th>
          <q-th align="center">Действия</q-th>
        </q-tr>
      </template>

      <template v-slot:body="props">
        <q-tr :props="props" :class="getRowClass(props.rowIndex)">
          <q-td align="center">{{ props.row.index }}</q-td>
          <q-td>{{ props.row.title }}</q-td>
          <q-td>{{ props.row.chief_name }}</q-td>
          <q-td>{{ props.row.chief_surname }}</q-td>
          <q-td align="center">
            <q-btn flat color="primary" @click="editWorkshop(props.row)">Редактировать</q-btn>
          </q-td>
        </q-tr>
      </template>
    </q-table>

    <!-- Модальное окно редактирования -->
    <q-dialog v-model="dialogOpen">
      <q-card>
        <q-card-section>
          <div class="text-h6">Редактировать мастерскую</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="saveWorkshop">
            <q-input v-model="editedWorkshop.title" label="Название" required />
            <q-input v-model="editedWorkshop.chief_name" label="Имя руководителя" required />
            <q-input v-model="editedWorkshop.chief_surname" label="Фамилия руководителя" required />
          </q-form>
        </q-card-section>
        <q-card-actions>
          <q-btn flat label="Отмена" color="secondary" @click="dialogOpen = false" />
          <q-btn flat label="Сохранить" color="primary" @click="saveWorkshop" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";

const router = useRouter();
const isAuthenticated = computed(() => !!localStorage.getItem("token"));

const workshops = ref([]);
const filters = ref({ title: null, chief_name: null, chief_surname: null });
const sortField = ref(null);
const sortOrder = ref("asc");
const paginationRows = ref(localStorage.getItem('paginationRows') || 10); // Получаем из localStorage или 10 по умолчанию

const pagination = ref({
  rowsPerPage: paginationRows.value, // Инициализируем с выбранным количеством строк
  page: 1
});

const columns = [
  { name: "title", label: "Название", field: "title", sortable: true },
  { name: "chief_name", label: "Имя руководителя", field: "chief_name", sortable: true },
  { name: "chief_surname", label: "Фамилия руководителя", field: "chief_surname", sortable: true }
];

// Получаем данные с API
const fetchWorkshops = async () => {
  if (!isAuthenticated.value) {
    router.push("/login");
    return;
  }
  try {
    const response = await api.get("/workshops");
    workshops.value = response.data.data.map((item, index) => ({
      ...item,
      index: index + 1
    }));
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
  }
};

onMounted(fetchWorkshops);

const getRowClass = (rowIndex) => (rowIndex % 2 === 0 ? "even-row" : "odd-row");

// Получение уникальных значений для фильтрации
const uniqueValues = (field) => {
  return [...new Set(workshops.value.map((item) => item[field]))].map((value) => ({ label: value, value }));
};

// Фильтрация данных по выбранным значениям
const filteredRows = computed(() => {
  return workshops.value.filter((row) => {
    return (
      (!filters.value.title || row.title === filters.value.title.value) &&
      (!filters.value.chief_name || row.chief_name === filters.value.chief_name.value) &&
      (!filters.value.chief_surname || row.chief_surname === filters.value.chief_surname.value)
    );
  });
});

// Сортировка данных
const sortedRows = computed(() => {
  if (!sortField.value) return filteredRows.value;
  return [...filteredRows.value].sort((a, b) => {
    let result = a[sortField.value] > b[sortField.value] ? 1 : -1;
    return sortOrder.value === "asc" ? result : -result;
  });
});

const sortBy = (field) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortField.value = field;
    sortOrder.value = "asc";
  }
};

const dialogOpen = ref(false);
const editedWorkshop = ref({ id: null, title: "", chief_name: "", chief_surname: "" });

const editWorkshop = (workshop) => {
  editedWorkshop.value = { ...workshop };
  dialogOpen.value = true;
};

const saveWorkshop = async () => {
  try {
    await api.put(`/workshops/${editedWorkshop.value.id}`, editedWorkshop.value);
    const index = workshops.value.findIndex((w) => w.id === editedWorkshop.value.id);
    if (index !== -1) {
      workshops.value[index] = { ...editedWorkshop.value };
    }
    dialogOpen.value = false;
  } catch (error) {
    console.error("Ошибка при сохранении данных:", error);
    alert("Ошибка при обновлении мастерской.");
  }
};
</script>

<style scoped>
.even-row {
  background-color: #ffe606;
}
.odd-row {
  background-color: #d4611e;
}
.custom-header {
  background-color: #000 !important;
  color: white !important;
  font-weight: bold;
  text-transform: uppercase;
}
.q-table tbody .q-tr:hover {
  background-color: #4bdf10 !important;
}
</style>
