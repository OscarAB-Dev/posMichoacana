<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import DashboardCard from '@renderer/components/DashboardCard.vue'
import Chart from 'chart.js/auto'

interface Summary {
  totalSales: number
  totalOrders: number
  averageTicket: number
  totalProducts: number
}

interface SalesByHour {
  hour: string
  count: number
  total: number
}

const toast = useToast()

const summary = ref<Summary>({ totalSales: 0, totalOrders: 0, averageTicket: 0, totalProducts: 0 })
const salesByHourData = ref<SalesByHour[]>([])

const getTodayRange = (): { start: number; end: number } => {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  return {
    start: Math.floor(startOfDay.getTime() / 1000),
    end: Math.floor(endOfDay.getTime() / 1000)
  }
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
}

const loadTodayData = async (): Promise<void> => {
  const { start, end } = getTodayRange()
  console.log(start, end)
  try {
    const [summaryResult, salesByHourResult] = await Promise.all([
      window.api.getReportSummary(start, end),
      window.api.getSalesByHour(start, end)
    ])

    if (summaryResult.success && summaryResult.data) {
      summary.value = summaryResult.data
    }

    if (salesByHourResult.success && salesByHourResult.data) {
      salesByHourData.value = salesByHourResult.data
      initChart()
    }
  } catch (err) {
    console.error(err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar datos del dashboard',
      life: 3000
    })
  }
}

const initChart = (): void => {
  const ctx = document.getElementById('salesByHourChart') as HTMLCanvasElement
  if (!ctx) return

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const totals = hours.map((h) => {
    const hourData = salesByHourData.value.find((d) => d.hour === h)
    return hourData?.total || 0
  })

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: hours.map((h) => `${h}:00`),
      datasets: [
        {
          label: 'Ventas por hora',
          data: totals,
          backgroundColor: '#ec4899',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  })
}

const getCurrentDate = (): string => {
  return new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  loadTodayData()
})
</script>

<template>
  <div class="p-4">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-surface-800">Resumen del día de hoy</h1>
      <p class="text-surface-500">{{ getCurrentDate() }}</p>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <DashboardCard
        title="Ventas de Hoy"
        :subtitle="formatCurrency(summary.totalSales)"
        icon="pi pi-money-bill"
      />
      <DashboardCard
        title="Numero de Ventas"
        :subtitle="summary.totalOrders.toString()"
        icon="pi pi-shopping-cart"
      />
      <DashboardCard
        title="Ticket Promedio"
        :subtitle="formatCurrency(summary.averageTicket)"
        icon="pi pi-chart-bar"
      />
      <DashboardCard
        title="Productos Vendidos"
        :subtitle="summary.totalProducts > 0 ? summary.totalProducts.toString() : '0'"
        icon="pi pi-box"
      />
    </div>

    <div class="mt-8 bg-white shadow-sm p-5 rounded-2xl">
      <h2 class="text-lg font-semibold mb-4">Ventas por Hora</h2>
      <div class="h-64">
        <canvas id="salesByHourChart"></canvas>
      </div>
    </div>
  </div>
</template>
