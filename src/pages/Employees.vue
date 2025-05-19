<template>
  <q-page>
    <h2>Список работников</h2>

    <p v-if="!isAuthenticated">
      Вам нужно <router-link to="/login">войти</router-link>, чтобы увидеть данные.
    </p>

    <p v-if="filteredRows.length > 0"> Найдено {{ filteredRows.length }} запись(ей) </p>
    <p v-else> Нет записей для отображения. </p>

    <!-- Фильтры -->
    <div class="q-pa-md row q-gutter-md">
      <q-select v-model="filters.name" :options="nameOptions" label="Имя" clearable />
      <q-select v-model="filters.surname" :options="surnameOptions" label="Фамилия" clearable />
      <q-select v-model="filters.rank" :options="rankOptions" label="Ранг" clearable />
      <q-select v-model="filters.salary" :options="salaryOptions" label="Зарплата" clearable />

      <q-select v-model="filters.workshop_id" :options="workshopOptions" label="Цех" clearable />
    </div>

    <q-table
      v-if="isAuthenticated"
      :rows="filteredRows"
      :columns="columns"
      row-key="id"
      :rows-per-page="paginationRows"
      :pagination.sync="pagination"
    >
      <template v-slot:header>
        <q-tr class="custom-header">
          <q-th align="center">#</q-th>
          <q-th v-for="col in columns" :key="col.name" align="left">
            {{ col.label }}
          </q-th>
          <q-th align="center">Действия</q-th>
        </q-tr>
      </template>

      <template v-slot:body="props">
        <q-tr :props="props" :class="getRowClass(props.rowIndex)">
          <q-td align="center">
            {{ props.row.index }}
          </q-td>
          <q-td v-for="col in columns" :key="col.name">
            <template v-if="col.name === 'workshop_id'">
              {{ getWorkshopTitle(props.row.workshop_id) }}
            </template>
            <template v-else>
              {{ props.row[col.field] }}
            </template>
          </q-td>
          <q-td align="center">
            <q-btn flat color="primary" @click="editEmployee(props.row)">Редактировать</q-btn>
          </q-td>
        </q-tr>
      </template>
    </q-table>

    <q-dialog v-model="dialogOpen">
      <q-card>
        <q-card-section>
          <div class="text-h6">Редактировать работника</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="saveEmployee">
            <q-input v-model="editedEmployee.name" label="Имя" lazy-rules />
            <q-input v-model="editedEmployee.surname" label="Фамилия" lazy-rules />
            <q-input v-model="editedEmployee.rank" label="Ранг" lazy-rules />
            <q-input v-model="editedEmployee.salary" label="Зарплата" type="number" lazy-rules />
            <q-select
              v-model="editedEmployee.workshop_id"
              :options="workshopOptions"
              label="Фабрика"
              emit-value
              map-options
            />
          </q-form>
        </q-card-section>
        <q-card-actions>
          <q-btn flat label="Отмена" color="secondary" @click="dialogOpen = false" />
          <q-btn flat label="Сохранить" color="primary" @click="saveEmployee" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";

const router = useRouter();
const isAuthenticated = computed(() => !!localStorage.getItem("token"));

const employees = ref([]);
const workshops = ref([]);
const workshopOptions = ref([]);
const nameOptions = ref([]);
const surnameOptions = ref([]);
const salaryOptions = ref([]);
const rankOptions = ref([]);
const filters = ref({ name: null, surname: null, rank: null, salary: null, workshop_id: null });
const dialogOpen = ref(false);
const editedEmployee = ref({});
const paginationRows = ref(localStorage.getItem('paginationRows') || 10); // Получаем из localStorage или 10 по умолчанию

const pagination = ref({
  rowsPerPage: paginationRows.value, // Инициализируем с выбранным количеством строк
  page: 1
});


const columns = [
  { name: "id", label: "ID", field: "id", sortable: true },
  { name: "name", label: "Имя", field: "name", sortable: true },
  { name: "surname", label: "Фамилия", field: "surname", sortable: true },
  { name: "rank", label: "Ранг", field: "rank", sortable: true },
  { name: "salary", label: "Зарплата", field: "salary", sortable: true },
  { name: "workshop_id", label: "Фабрика", field: "workshop_id", sortable: true },
];

const fetchEmployees = async () => {
  if (!isAuthenticated.value) {
    router.push("/login");
    return;
  }
  try {
    const response = await api.get("/employees");
    employees.value = response.data.data.map((item, index) => ({
      ...item,
      index: index + 1,
    }));

    /// Заполняем списки для фильтрации
    nameOptions.value = [...new Set(employees.value.map((d) => d.name))].map((name) => ({ label: name, value: name }));
    surnameOptions.value = [...new Set(employees.value.map((d) => d.surname))].map((surname) => ({ label: surname, value: surname }));
    rankOptions.value = [...new Set(employees.value.map((d) => d.rank))].map((rank) => ({ label: rank, value: rank }));
    salaryOptions.value = [...new Set(employees.value.map((d) => d.salary))].map((salary) => ({ label: salary, value: salary }));
    
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
  }
};

const fetchWorkshops = async () => {
  try {
    const response = await api.get("/workshops");
    workshops.value = response.data.data;
    workshopOptions.value = workshops.value.map(w => ({
      label: w.title, // Отображаем title в списке
      value: w.id, // Но отправляем id
    }));
  } catch (error) {
    console.error("Ошибка при загрузке фабрик:", error);
  }
};

// Получить название фабрики по ID
const getWorkshopTitle = (workshopId) => {
  const workshop = workshops.value.find(w => w.id === workshopId);
  return workshop ? workshop.title : "Неизвестная фабрика";
};

const filteredRows = computed(() => {
  return employees.value.filter((row) => {
    return (
      (!filters.value.name || row.name.includes(filters.value.name.value)) &&
      (!filters.value.surname || row.surname.includes(filters.value.surname.value)) &&
      (!filters.value.rank || row.rank == filters.value.rank.value) &&
      (!filters.value.salary || row.salary == filters.value.salary.value) &&
      (!filters.value.workshop_id || row.workshop_id == filters.value.workshop_id.value)
    );
  });
});

onMounted(() => {
  fetchEmployees();
  fetchWorkshops();
});

const getRowClass = (rowIndex) => {
  return rowIndex % 2 === 0 ? "even-row" : "odd-row";
};

const editEmployee = (row) => {
  editedEmployee.value = { ...row };
  dialogOpen.value = true;
};

const saveEmployee = async () => {
  try {
    const updatedEmployee = { ...editedEmployee.value };
    delete updatedEmployee.index;

    const response = await api.put(`/employees/${editedEmployee.value.id}`, updatedEmployee);
    console.log("Работник обновлен:", response.data);

    dialogOpen.value = false;
    fetchEmployees();
  } catch (error) {
    console.error("Ошибка при сохранении работника:", error);
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

.q-table thead .q-tr:hover {
  background-color: #000 !important;
}

.q-table tbody .q-tr:hover {
  background-color: #4bdf10 !important;
}
</style>
