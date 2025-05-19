<template>
  <q-page>
    <h2>Список деталей</h2>

    <p v-if="!isAuthenticated">
      Вам нужно <router-link to="/login">войти</router-link>, чтобы увидеть данные.
    </p>

    <p v-if="filteredRows.length > 0"> Найдено {{ filteredRows.length }} запись(ей) </p>
    <p v-else> Нет записей для отображения. </p>

    <!-- Фильтры -->
    <div class="q-pa-md row q-gutter-md">
      <q-select
        v-model="filters.name"
        :options="nameOptions"
        label="Название"
        clearable
      />
      <q-input v-model="filters.weight" label="Вес" type="number" clearable />
      <q-select
        v-model="filters.material"
        :options="materialOptions"
        label="Материал"
        clearable
      />
      <q-select
        v-model="filters.product_type_id"
        :options="productTypeOptions"
        label="Тип продукта"
        clearable
      />
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
          <q-td>{{ props.row.name }}</q-td>
          <q-td>{{ props.row.weight }}</q-td>
          <q-td>{{ props.row.material }}</q-td>
          <q-td>{{ getProductTypeName(props.row.product_type_id) }}</q-td>
          <q-td align="center">
            <q-btn flat color="primary" @click="editDetail(props.row)">Редактировать</q-btn>
          </q-td>
        </q-tr>
      </template>
    </q-table>

    <!-- Модальное окно редактирования -->
    <q-dialog v-model="dialogOpen">
      <q-card>
        <q-card-section>
          <div class="text-h6">Редактировать деталь</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="saveDetail">
            <q-input v-model="editedDetail.name" label="Название" lazy-rules />
            <q-input v-model="editedDetail.weight" label="Вес" type="number" lazy-rules />
            <q-input v-model="editedDetail.material" label="Материал" lazy-rules />
            <q-select v-model="editedDetail.product_type_id" :options="productTypeOptions" label="Тип продукции" emit-value map-options />
          </q-form>
        </q-card-section>
        <q-card-actions>
          <q-btn flat label="Отмена" color="secondary" @click="dialogOpen = false" />
          <q-btn flat label="Сохранить" color="primary" @click="saveDetail" />
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

const details = ref([]);
const productTypes = ref([]);
const productTypeOptions = ref([]);
const nameOptions = ref([]);
const materialOptions = ref([]);
const filters = ref({ name: null, weight: "", material: null, product_type_id: null });
const sortField = ref(null);
const sortOrder = ref("asc");
const paginationRows = ref(localStorage.getItem('paginationRows') || 10); // Получаем из localStorage или 10 по умолчанию

const pagination = ref({
  rowsPerPage: paginationRows.value, // Инициализируем с выбранным количеством строк
  page: 1
});


const columns = [
  { name: "name", label: "Название", field: "name", sortable: true },
  { name: "weight", label: "Вес", field: "weight", sortable: true },
  { name: "material", label: "Материал", field: "material", sortable: true },
  { name: "product_type_id", label: "Тип продукта", field: "product_type_id", sortable: true },
];

const fetchDetails = async () => {
  if (!isAuthenticated.value) {
    router.push("/login");
    return;
  }
  try {
    const response = await api.get("/details");
    details.value = response.data.data.map((item, index) => ({
      ...item,
      index: index + 1,
    }));

    // Заполняем списки для фильтрации
    nameOptions.value = [...new Set(details.value.map((d) => d.name))].map((name) => ({ label: name, value: name }));
    materialOptions.value = [...new Set(details.value.map((d) => d.material))].map((material) => ({
      label: material,
      value: material,
    }));
  } catch (error) {
    console.error("Ошибка при загрузке деталей:", error);
  }
};

const fetchProductTypes = async () => {
  try {
    const response = await api.get("/product_types");
    productTypes.value = response.data.data;
    productTypeOptions.value = productTypes.value.map(pt => ({
      label: pt.name,
      value: pt.id,
    }));
  } catch (error) {
    console.error("Ошибка при загрузке типов продукции:", error);
  }
};

const getProductTypeName = (productTypeId) => {
  const productType = productTypes.value.find(pt => pt.id === productTypeId);
  return productType ? productType.name : "Неизвестный тип";
};

// Фильтрация данных
const filteredRows = computed(() => {
  return details.value.filter((row) => {
    return (
      (!filters.value.name || row.name === filters.value.name.value) &&
      (!filters.value.weight || row.weight.toString().includes(filters.value.weight)) &&
      (!filters.value.material || row.material === filters.value.material.value) &&
      (!filters.value.product_type_id || row.product_type_id === filters.value.product_type_id.value)
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

onMounted(() => {
  fetchDetails();
  fetchProductTypes();
});

const getRowClass = (rowIndex) => (rowIndex % 2 === 0 ? "even-row" : "odd-row");

const dialogOpen = ref(false);
const editedDetail = ref({});

const editDetail = (row) => {
  editedDetail.value = { ...row };
  dialogOpen.value = true;
};

const saveDetail = async () => {
  try {
    const updatedDetail = { ...editedDetail.value };
    delete updatedDetail.index;

    await api.put(`/details/${editedDetail.value.id}`, updatedDetail);
    dialogOpen.value = false;
    fetchDetails();
  } catch (error) {
    console.error("Ошибка при сохранении детали:", error);
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
