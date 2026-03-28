<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Toolbar from 'primevue/toolbar'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import { Toast } from 'primevue'

interface Employee {
  id?: number
  username: string
  role: string
  createdAt?: number
  password?: string
}

onMounted(() => {
  loadEmployees()
})

const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const employees = ref<Employee[]>([])
const employeeDialog = ref(false)
const deleteEmployeeDialog = ref(false)
const employee = ref<Employee>({ username: '', role: 'cashier' })
const selectedEmployees = ref<Employee[]>([])
const submitted = ref(false)

const loadEmployees = async (): Promise<void> => {
  loading.value = true
  try {
    const result = await window.api.getEmployees()
    if (result.success && result.data) {
      employees.value = result.data
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: result.error, life: 3000 })
    }
  } catch (err) {
    console.error(err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar empleados',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const getRoleSeverity = (
  role: string
): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined => {
  if (role === 'admin') return 'success'
  if (role === 'cashier') return 'info'
  return 'secondary'
}

const formatDate = (timestamp: number): string => {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp * 1000))
}

const openNew = (): void => {
  employee.value = { username: '', role: 'cashier', password: '' }
  submitted.value = false
  employeeDialog.value = true
}

const hideDialog = (): void => {
  employeeDialog.value = false
  submitted.value = false
}

const editEmployee = (emp: Employee): void => {
  employee.value = { ...emp, password: '' }
  employeeDialog.value = true
}

const confirmDeleteEmployee = (emp: Employee): void => {
  employee.value = emp
  deleteEmployeeDialog.value = true
}

const saveEmployee = async (): Promise<void> => {
  submitted.value = true

  if (!employee.value.username?.trim()) return
  if (!employee.value.id && !employee.value.password?.trim()) return

  saving.value = true
  try {
    if (employee.value.id) {
      const payload: { id: number; username: string; password?: string } = {
        id: employee.value.id,
        username: employee.value.username
      }
      if (employee.value.password?.trim()) {
        payload.password = employee.value.password
      }
      const result = await window.api.updateEmployee(payload)
      if (result.success) {
        toast.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'Empleado actualizado',
          life: 3000
        })
        employeeDialog.value = false
        await loadEmployees()
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: result.error, life: 3000 })
      }
    } else {
      const result = await window.api.createEmployee({
        username: employee.value.username,
        password: employee.value.password!
      })
      if (result.success) {
        toast.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'Empleado creado',
          life: 3000
        })
        employeeDialog.value = false
        await loadEmployees()
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: result.error, life: 3000 })
      }
    }
  } catch (err) {
    console.error(err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al guardar empleado',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const deleteEmployee = async (): Promise<void> => {
  if (!employee.value.id) return
  saving.value = true
  try {
    const result = await window.api.deleteEmployee(employee.value.id)
    if (result.success) {
      toast.add({ severity: 'info', summary: 'Exito', detail: 'Empleado eliminado', life: 3000 })
      deleteEmployeeDialog.value = false
      employee.value = { username: '', role: 'cashier' }
      await loadEmployees()
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: result.error, life: 3000 })
    }
  } catch (err) {
    console.error(err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al eliminar empleado',
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
          <span class="text-xl font-bold">Empleados</span>
        </template>
        <template #end>
          <Button label="Nuevo" icon="pi pi-plus" @click="openNew" />
        </template>
      </Toolbar>

      <DataTable
        v-model:selection="selectedEmployees"
        :value="employees"
        :loading="loading"
        :paginator="true"
        :rows="10"
        striped-rows
        removable-sort
        data-key="id"
        sort-mode="multiple"
        paginator-position="top"
        paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rows-per-page-options="[5, 10, 25]"
        current-page-report-template="Mostrando {first} a {last} de {totalRecords} empleados"
      >
        <Column field="id" header="ID" sortable style="min-width: 4rem" />
        <Column field="username" header="Usuario" sortable style="min-width: 12rem" />
        <Column field="role" header="Rol" sortable style="min-width: 8rem">
          <template #body="slotProps">
            <Tag
              :value="slotProps.data.role === 'cashier' ? 'Empleado' : 'Administrador'"
              :severity="getRoleSeverity(slotProps.data.role)"
            />
          </template>
        </Column>
        <Column field="createdAt" header="Fecha de creacion" sortable style="min-width: 12rem">
          <template #body="slotProps">
            {{ formatDate(slotProps.data.createdAt) }}
          </template>
        </Column>
        <Column :exportable="false" style="min-width: 12rem" header="Acciones">
          <template #body="slotProps">
            <Button
              icon="pi pi-pencil"
              variant="outlined"
              rounded
              class="mr-2"
              @click="editEmployee(slotProps.data)"
            />
            <Button
              v-if="slotProps.data.role !== 'admin'"
              icon="pi pi-trash"
              variant="outlined"
              rounded
              severity="danger"
              @click="confirmDeleteEmployee(slotProps.data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="employeeDialog"
      :style="{ width: '450px' }"
      header="Detalles del Empleado"
      :modal="true"
    >
      <div class="flex flex-col gap-6">
        <div>
          <label for="username" class="block font-bold mb-3">Usuario</label>
          <InputText
            id="username"
            v-model="employee.username"
            required="true"
            autofocus
            :invalid="submitted && !employee.username"
            fluid
          />
          <small v-if="submitted && !employee.username" class="text-red-500">
            El usuario es requerido.
          </small>
        </div>

        <div>
          <label for="password" class="block font-bold mb-3">
            {{ employee.id ? 'Nueva Contraseña (opcional)' : 'Contraseña' }}
          </label>
          <Password
            id="password"
            v-model="employee.password"
            :required="!employee.id"
            :invalid="submitted && !employee.id && !employee.password"
            fluid
            toggle-mask
            :feedback="false"
          />
          <small v-if="submitted && !employee.id && !employee.password" class="text-red-500">
            La contraseña es requerida para nuevos empleados.
          </small>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text :disabled="saving" @click="hideDialog" />
        <Button label="Guardar" icon="pi pi-check" :loading="saving" @click="saveEmployee" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deleteEmployeeDialog"
      :style="{ width: '450px' }"
      header="Confirmar"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle text-3xl!" />
        <span v-if="employee"
          >Estas seguro de eliminar al empleado <b>{{ employee.username }}</b
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
          @click="deleteEmployeeDialog = false"
        />
        <Button
          label="Si"
          icon="pi pi-check"
          severity="danger"
          :loading="saving"
          @click="deleteEmployee"
        />
      </template>
    </Dialog>
    <Toast />
  </div>
</template>
