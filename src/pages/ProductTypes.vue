<template>
  <q-page>
    <h2>Список типов продуктов</h2>

    <!-- Если пользователь не авторизован -->
    <p v-if="!isAuthenticated">
      Вам нужно <router-link to="/login">войти</router-link>, чтобы увидеть данные.
    </p>

    <!-- Информатор с количеством записей -->
    <p v-if="sortedRows.length > 0">
      Найдено {{ sortedRows.length }} запись(ей)
    </p>
    <p v-else>Нет записей для отображения.</p>

    <!-- Фильтрация по столбцам -->
    <div class="q-pa-md row q-gutter-md">
      <q-select v-model="filters.id" :options="uniqueValues('id')" label="ID" clearable />
      <q-select v-model="filters.name" :options="uniqueValues('name')" label="Название" clearable />
    </div>

    <!-- Таблица -->
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
          <q-td>{{ props.row.id }}</q-td>
          <q-td>{{ props.row.name }}</q-td>
          <q-td align="center">
            <q-btn flat color="primary" @click="editProductType(props.row)">Редактировать</q-btn>
          </q-td>
        </q-tr>
      </template>
    </q-table>

    <!-- Диалог для редактирования -->
    <q-dialog v-model="dialogOpen">
      <q-card>
        <q-card-section>
          <div class="text-h6">Редактировать тип продукта</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="saveProductType">
            <q-input v-model="editedProductType.name" label="Название" required />
          </q-form>
        </q-card-section>
        <q-card-actions>
          <q-btn flat label="Отмена" color="secondary" @click="dialogOpen = false" />
          <q-btn flat label="Сохранить" color="primary" @click="saveProductType" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from 'src/boot/axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const isAuthenticated = computed(() => !!localStorage.getItem('token'));

const productTypes = ref([]);
const filters = ref({ id: null, name: null });
const sortField = ref(null);
const sortOrder = ref("asc");
const paginationRows = ref(localStorage.getItem('paginationRows') || 10); // Получаем из localStorage или 10 по умолчанию

const pagination = ref({
  rowsPerPage: paginationRows.value, // Инициализируем с выбранным количеством строк
  page: 1
});

const columns = [
  { name: 'id', label: 'ID', field: 'id', sortable: true },
  { name: 'name', label: 'Название', field: 'name', sortable: true }
];

const fetchProductTypes = async () => {
  if (!isAuthenticated.value) {
    router.push('/login');
    return;
  }
  try {
    const response = await api.get('/product_types');
    productTypes.value = response.data.data.map((item, index) => ({
      ...item,
      index: index + 1
    }));
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
  }
};

onMounted(fetchProductTypes);

const uniqueValues = (field) => {
  return [...new Set(productTypes.value.map((item) => item[field]))].map((value) => ({ label: value, value }));
};

const filteredRows = computed(() => {
  return productTypes.value.filter((row) => {
    return (
      (!filters.value.id || row.id === filters.value.id.value) &&
      (!filters.value.name || row.name === filters.value.name.value)
    );
  });
});

const sortedRows = computed(() => {
  if (!sortField.value) return filteredRows.value;

  return [...filteredRows.value].sort((a, b) => {
    const field = sortField.value;
    const order = sortOrder.value === "asc" ? 1 : -1;

    if (typeof a[field] === "number") {
      return (a[field] - b[field]) * order;
    } else {
      return a[field].localeCompare(b[field]) * order;
    }
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

const getRowClass = (rowIndex) => (rowIndex % 2 === 0 ? 'even-row' : 'odd-row');

const dialogOpen = ref(false);
const editedProductType = ref({ id: null, name: '' });

const editProductType = (row) => {
  editedProductType.value = { ...row };
  dialogOpen.value = true;
};

const saveProductType = async () => {
  try {
    await api.put(`/product_types/${editedProductType.value.id}`, editedProductType.value);
    const index = productTypes.value.findIndex(item => item.id === editedProductType.value.id);
    if (index !== -1) {
      productTypes.value[index] = { ...editedProductType.value };
    }
    dialogOpen.value = false;
  } catch (error) {
    console.error('Ошибка при сохранении данных:', error);
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
