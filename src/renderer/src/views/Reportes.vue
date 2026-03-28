<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import Chart from 'primevue/chart' // Componente de PrimeVue
import Calendar from 'primevue/calendar'
import Card from 'primevue/card'
import Toast from 'primevue/toast'

// --- Interfaces ---
interface Summary {
  totalSales: number
  totalOrders: number
  averageTicket: number
  totalProducts: number
}

interface SalesByDate {
  date: string
  total: number
}
interface TopProduct {
  productId: number
  productName: string
  quantity: number
  total: number
}
interface SalesByHour {
  hour: string
  count: number
  total: number
}

// --- Estado ---
const toast = useToast()
const dateRange = ref<Date[]>([])
const summary = ref<Summary | undefined>({
  totalSales: 0,
  totalOrders: 0,
  averageTicket: 0,
  totalProducts: 0
})

// Datos crudos de la API
const salesByDateData = ref<SalesByDate[] | undefined>([])
const topProductsData = ref<TopProduct[] | undefined>([])
const salesByHourData = ref<SalesByHour[] | undefined>([])

const palette = [
  '#d94487', // Rosa base (el que proporcionaste)
  '#e85d97', // Rosa brillante
  '#f178ac', // Rosa pastel vibrante
  '#c1419a', // Magenta intermedio
  '#a33da1', // Púrpura orquídea
  '#8a2be2', // Violeta azulado (Blue Violet)
  '#7b2cbf', // Morado intenso
  '#5a189a', // Púrpura real
  '#3c096c', // Morado profundo
  '#240046' // Uva oscuro
]

// --- Configuración de Gráficas (Data & Options) ---

// 1. Ganancias por Fecha (Line)
const salesByDateChartData = computed(() => ({
  labels: salesByDateData.value?.map((d) => d.date),
  datasets: [
    {
      label: 'Ventas',
      data: salesByDateData.value?.map((d) => d.total),
      borderColor: '#ec4899',
      backgroundColor: 'rgba(236, 72, 153, 0.1)',
      fill: true,
      tension: 0.4
    }
  ]
}))

// 2. Productos Más Vendidos (Horizontal Bar)
const topProductsChartData = computed(() => ({
  labels: topProductsData.value?.map((p) => p.productName),
  datasets: [
    {
      label: 'Ventas ($)',
      data: topProductsData.value?.map((p) => p.total),
      backgroundColor: palette
    }
  ]
}))

// 3. Ganancias por Hora (Bar)
const salesByHourChartData = computed(() => {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const totals = hours.map((h) => {
    const hourData = salesByHourData.value?.find((d) => d.hour === h)
    return hourData?.total || 0
  })

  return {
    labels: hours.map((h) => `${h}:00`),
    datasets: [
      {
        label: 'Ganancias por hora',
        data: totals,
        backgroundColor: '#8b5cf6'
      }
    ]
  }
})

// Opciones comunes y específicas
const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } }
})

const horizontalBarOptions = ref({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false
})

// --- Lógica de Carga ---
onMounted(() => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  dateRange.value = [startOfMonth, now]
})

watch(
  dateRange,
  () => {
    if (dateRange.value && dateRange.value.length === 2 && dateRange.value) {
      loadReportData()
    }
  },
  { deep: true }
)

const getTimestamp = (date: Date): number => Math.floor(date.getTime() / 1000)

const loadReportData = async (): Promise<void> => {
  const startDate = getTimestamp(dateRange.value[0])
  const endDate = getTimestamp(dateRange.value[1]) + 86400

  try {
    const [summaryRes, salesDateRes, topProdRes, salesHourRes] = await Promise.all([
      window.api.getReportSummary(startDate, endDate),
      window.api.getSalesByDate(startDate, endDate),
      window.api.getTopProducts(startDate, endDate, 10),
      window.api.getSalesByHour(startDate, endDate)
    ])

    if (summaryRes.success) summary.value = summaryRes.data
    if (salesDateRes.success) salesByDateData.value = salesDateRes.data
    if (topProdRes.success) topProductsData.value = topProdRes.data
    if (salesHourRes.success) salesByHourData.value = salesHourRes.data
  } catch (err) {
    console.error(err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar reportes',
      life: 3000
    })
  }
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
}
</script>

<template>
  <div class="p-4">
    <Toast />

    <div class="flex flex-wrap gap-4 items-center mb-6">
      <h1 class="text-2xl font-bold">Reportes</h1>
      <Calendar
        v-model="dateRange"
        selection-mode="range"
        date-format="yy-mm-dd"
        placeholder="Rango de fechas"
        show-icon
        class="w-64"
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card
        v-for="(item, index) in [
          {
            label: 'Ventas Totales',
            value: formatCurrency(summary!.totalSales),
            color: 'text-pink-600'
          },
          { label: 'Número de ventas', value: summary!.totalOrders, color: 'text-purple-600' },
          {
            label: 'Ticket Promedio',
            value: formatCurrency(summary!.averageTicket),
            color: 'text-violet-600'
          }
        ]"
        :key="index"
      >
        <template #content>
          <div class="text-center">
            <p class="text-gray-500 text-sm">{{ item.label }}</p>
            <p :class="['text-2xl font-bold', item.color]">{{ item.value }}</p>
          </div>
        </template>
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <template #title>Ganancias por Fecha</template>
        <template #content>
          <Chart type="line" :data="salesByDateChartData" :options="chartOptions" class="h-64" />
        </template>
      </Card>

      <Card>
        <template #title>Productos Más Vendidos</template>
        <template #content>
          <Chart
            type="bar"
            :data="topProductsChartData"
            :options="horizontalBarOptions"
            class="h-64"
          />
        </template>
      </Card>

      <Card class="lg:col-span-2">
        <template #title>Ganancias por Hora</template>
        <template #content>
          <Chart type="bar" :data="salesByHourChartData" :options="chartOptions" class="h-64" />
        </template>
      </Card>
    </div>
  </div>
</template>
