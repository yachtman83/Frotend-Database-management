<template>
  <q-page>
    <h2>История зарплат</h2>

    <p v-if="!isAuthenticated">
      Вам нужно <router-link to="/login">войти</router-link>, чтобы увидеть данные.
    </p>

    <div class="filters">
      <q-select
        v-model="selectedEmployee"
        label="Фильтр по сотруднику"
        :options="employeeOptions"
        option-value="value"
        option-label="label"
        emit-value
        map-options
        clearable
        @update:model-value="filterSalaries"
      />

      <q-select
        v-model="selectedAmount"
        label="Фильтр по сумме"
        :options="amountOptions"
        emit-value
        map-options
        clearable
        @update:model-value="filterSalaries"
      />

      <q-select
        v-model="selectedDate"
        label="Фильтр по дате"
        :options="dateOptions"
        emit-value
        map-options
        clearable
        @update:model-value="filterSalaries"
      />
    </div>

    <p v-if="filteredSalaries.length > 0">
      По Вашему запросу найдено {{ filteredSalaries.length }} запись(ей)
    </p>
    <p v-else>Нет записей для отображения.</p>

    <q-table
      v-if="isAuthenticated"
      :rows="filteredSalaries"
      :columns="columns"
      row-key="index"
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
          <q-td align="center">{{ props.row.index }}</q-td>
          <q-td>{{ props.row.amount }}</q-td>
          <q-td>{{ formatDate(props.row.date) }}</q-td>
          <q-td>{{ getEmployeeSurname(props.row.employee_id) }}</q-td>
          <q-td align="center">
            <q-btn flat color="primary" @click="editSalary(props.row)">Редактировать</q-btn>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";

const router = useRouter();
const isAuthenticated = computed(() => !!localStorage.getItem("token"));

const salaries = ref([]);
const employees = ref([]);
const employeeOptions = ref([]);
const amountOptions = ref([]);
const dateOptions = ref([]);
const filteredSalaries = ref([]);

const selectedEmployee = ref(null);
const selectedAmount = ref(null);
const selectedDate = ref(null);

const dialogOpen = ref(false);
const editedSalary = ref({
  id: null,
  amount: '',
  date: '',
  employee_id: '',
});
const paginationRows = ref(localStorage.getItem('paginationRows') || 10); // Получаем из localStorage или 10 по умолчанию

const pagination = ref({
  rowsPerPage: paginationRows.value, // Инициализируем с выбранным количеством строк
  page: 1
});
const columns = [
  { name: "amount", label: "Сумма", field: "amount", sortable: true },
  { name: "date", label: "Дата", field: "date", sortable: true },
  { name: "employee_id", label: "Сотрудник", field: "employee_id", sortable: true }
];

const fetchSalaries = async () => {
  if (!isAuthenticated.value) {
    router.push("/login");
    return;
  }
  try {
    const response = await api.get("/salary_histories");
    salaries.value = response.data.data.map((item, index) => ({
      ...item,
      index: index + 1,
    }));

    amountOptions.value = [...new Set(salaries.value.map(s => s.amount))].map(amount => ({
      label: amount.toString(),
      value: amount
    }));

    dateOptions.value = [...new Set(salaries.value.map(s => s.date))].map(date => ({
      label: formatDate(date),
      value: date
    }));

    filterSalaries();
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
  }
};

const fetchEmployees = async () => {
  try {
    const response = await api.get("/employees");
    employees.value = response.data.data;
    employeeOptions.value = employees.value.map(employee => ({
      label: employee.surname,
      value: employee.id,
    }));
  } catch (error) {
    console.error("Ошибка при загрузке данных сотрудников:", error);
  }
};

const filterSalaries = () => {
  filteredSalaries.value = salaries.value.filter(salary => {
    return (
      (!selectedEmployee.value || salary.employee_id === selectedEmployee.value) &&
      (!selectedAmount.value || salary.amount === selectedAmount.value) &&
      (!selectedDate.value || salary.date === selectedDate.value)
    );
  });
};

onMounted(() => {
  fetchEmployees();
  fetchSalaries();
});

const getRowClass = (rowIndex) => {
  return rowIndex % 2 === 0 ? "even-row" : "odd-row";
};

const getEmployeeSurname = (employeeId) => {
  const employee = employees.value.find(emp => emp.id === employeeId);
  return employee ? employee.surname : "Неизвестный сотрудник";
};

const editSalary = (row) => {
  editedSalary.value = { ...row };
  dialogOpen.value = true;
};

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString("ru-RU");
};
</script>

<style scoped>
.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

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
