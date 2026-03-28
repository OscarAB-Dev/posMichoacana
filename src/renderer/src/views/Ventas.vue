<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Toolbar from 'primevue/toolbar'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import { Toast } from 'primevue'
import { useAuthStore } from '@renderer/stores/auth'

interface Sale {
  id: number
  total: number
  createdAt: number
  userId: number
  username?: string
  items?: SaleItem[]
}

interface SaleItem {
  id: number
  saleId: number
  productId: number
  quantity: number
  price: number
  productName: string
}

onMounted(() => {
  loadSales()
})

const { user } = useAuthStore()
const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const sales = ref<Sale[]>([])
const deleteSaleDialog = ref(false)
const sale = ref<Sale>({ id: 0, total: 0, createdAt: 0, userId: 0 })
const totalRecords = ref(0)
const dateRange = ref<Date[] | null>(null)
const expandedRows = ref<Sale[]>([])
const currentPage = ref(0)
const currentRows = ref(10)

const loadSaleItems = async (sale: Sale): Promise<void> => {
  try {
    const result = await window.api.getSaleItems(sale.id)
    if (result.success && result.data) {
      const saleIndex = sales.value.findIndex((s) => s.id === sale.id)
      if (saleIndex !== -1) {
        sales.value[saleIndex].items = result.data
      }
    }
  } catch (err) {
    console.error(err)
  }
}

const loadSales = async (page: number = 0, rowsVal: number = 10): Promise<void> => {
  loading.value = true
  try {
    let startDate: number | undefined
    let endDate: number | undefined

    if (dateRange.value && dateRange.value.length === 2) {
      startDate = Math.floor(dateRange.value[0].getTime() / 1000)
      const endOfDay = new Date(dateRange.value[1])
      endOfDay.setHours(23, 59, 59, 999)
      endDate = Math.floor(endOfDay.getTime() / 1000)
    }

    const result = await window.api.getSales({
      limit: rowsVal,
      offset: page * rowsVal,
      startDate,
      endDate
    })
    if (result.success && result.data) {
      sales.value = result.data
      totalRecords.value = result.total || 0
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: result.error, life: 3000 })
    }
  } catch (err) {
    console.error(err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar ventas',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const onPage = (event: { page: number; rows: number }): void => {
  currentPage.value = event.page
  currentRows.value = event.rows
  loadSales(event.page, event.rows)
}

watch(
  () => dateRange.value,
  () => {
    currentPage.value = 0
    loadSales(0, currentRows.value)
  }
)

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString('es-MX')
}

const confirmDeleteSale = (s: Sale): void => {
  sale.value = s
  deleteSaleDialog.value = true
}

const deleteSale = async (): Promise<void> => {
  if (!sale.value.id) return
  saving.value = true
  try {
    const result = await window.api.deleteSale(sale.value.id)
    if (result.success) {
      toast.add({ severity: 'info', summary: 'Exito', detail: 'Venta eliminada', life: 3000 })
      deleteSaleDialog.value = false
      sale.value = { id: 0, total: 0, createdAt: 0, userId: 0 }
      await loadSales(currentPage.value, currentRows.value)
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: result.error, life: 3000 })
    }
  } catch (err) {
    console.error(err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al eliminar venta',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="card">
      <Toolbar>
        <template #start>
          <span class="text-xl font-bold">Ventas</span>
        </template>

        <template #end>
          <DatePicker
            v-model="dateRange"
            selection-mode="range"
            date-format="dd/mm/yy"
            placeholder="Filtrar por fecha"
            show-icon
            class="w-64"
          />
        </template>
      </Toolbar>

      <DataTable
        v-model:expanded-rows="expandedRows"
        :value="sales"
        :loading="loading"
        :lazy="true"
        :paginator="true"
        :total-records="totalRecords"
        :rows="10"
        striped-rows
        removable-sort
        data-key="id"
        sort-mode="multiple"
        paginator-position="top"
        paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rows-per-page-options="[5, 10, 25]"
        current-page-report-template="Mostrando {first} a {last} de {totalRecords} ventas"
        @row-expand="(e) => loadSaleItems(e.data)"
        @page="onPage"
      >
        <Column expander style="width: 3rem" />
        <Column field="id" header="ID" style="min-width: 4rem" />
        <Column field="total" header="Total" style="min-width: 8rem">
          <template #body="slotProps">
            {{ formatCurrency(slotProps.data.total) }}
          </template>
        </Column>
        <Column field="createdAt" header="Fecha" style="min-width: 12rem">
          <template #body="slotProps">
            {{ formatDate(slotProps.data.createdAt) }}
          </template>
        </Column>
        <Column
          v-if="user?.role === 'admin'"
          field="userId"
          header="Usuario ID"
          style="min-width: 8rem"
        />
        <Column
          v-if="user?.role === 'admin'"
          :exportable="false"
          style="min-width: 8rem"
          header="Acciones"
        >
          <template #body="slotProps">
            <Button
              icon="pi pi-trash"
              variant="outlined"
              rounded
              severity="danger"
              @click="confirmDeleteSale(slotProps.data)"
            />
          </template>
        </Column>
        <template #expansion="slotProps">
          <div class="p-4">
            <h5 class="mb-3">Detalles de la Venta #{{ slotProps.data.id }}</h5>
            <DataTable
              v-if="slotProps.data.items?.length"
              :value="slotProps.data.items"
              striped-rows
              size="small"
            >
              <Column field="productName" header="Producto" style="min-width: 12rem" />
              <Column field="quantity" header="Cantidad" style="min-width: 6rem" />
              <Column field="price" header="Precio Unitario" style="min-width: 8rem">
                <template #body="item">
                  {{ formatCurrency(item.data.price) }}
                </template>
              </Column>
              <Column header="Subtotal" style="min-width: 8rem">
                <template #body="item">
                  {{ formatCurrency(item.data.quantity * item.data.price) }}
                </template>
              </Column>
            </DataTable>
            <span v-else class="text-gray-500">Cargando detalles...</span>
          </div>
        </template>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="deleteSaleDialog"
      :style="{ width: '450px' }"
      header="Confirmar"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle text-3xl!" />
        <span v-if="sale"
          >Estas seguro de eliminar la venta <b>#{{ sale.id }}</b
          >?</span
        >
      </div>
      <template #footer>
        <Button
          label="No"
          icon="pi pi-times"
          text
          severity="secondary"
          :disabled="saving"
          @click="deleteSaleDialog = false"
        />
        <Button
          label="Si"
          icon="pi pi-check"
          severity="danger"
          :loading="saving"
          @click="deleteSale"
        />
      </template>
    </Dialog>
    <Toast />
  </div>
</template>
