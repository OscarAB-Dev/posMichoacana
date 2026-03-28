<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Toolbar from 'primevue/toolbar'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import { Toast } from 'primevue'
import { useAuthStore } from '@renderer/stores/auth'

interface Product {
  id?: number
  name: string
  price: number
  stock: number
  image?: Uint8Array
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

onMounted(() => {
  loadProducts()
})

const { user } = useAuthStore()
const toast = useToast()
const fileInput = ref<HTMLInputElement>()
const products = ref<Product[]>([])
const productDialog = ref(false)
const deleteProductDialog = ref(false)
const deleteProductsDialog = ref(false)
const product = ref<Product>({ name: '', price: 0, stock: 0 })
const selectedProducts = ref<Product[]>([])
const first = ref(0)
const rows = ref(10)
const filters = ref({
  global: { value: null as string | null, matchMode: FilterMatchMode.CONTAINS }
})

const loading = ref(true)
const saving = ref(false)
const submitted = ref(false)
const productImagePreview = ref<string | null>(null)
const pendingImageFile = ref<File | null>(null)

const getImageUrl = (image: Uint8Array | undefined): string | undefined => {
  if (!image || image.length === 0) return undefined
  const blob = new Blob([new Uint8Array(image)], { type: 'image/*' })
  return URL.createObjectURL(blob)
}

const getStockSeverity = (stock: number): 'success' | 'warn' | 'danger' => {
  if (stock === 0) return 'danger'
  if (stock <= 10) return 'warn'
  return 'success'
}

const loadProducts = async (): Promise<void> => {
  loading.value = true
  try {
    const result = await window.api.getProducts()
    if (result.success && result.data) {
      products.value = result.data
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: result.error, life: 3000 })
    }
  } catch (err) {
    console.error(err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar productos',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
}

const triggerFileInput = (): void => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event): void => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    processImageFile(input.files[0])
  }
}

const handleDrop = (event: DragEvent): void => {
  const file = event.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    processImageFile(file)
  }
}

const processImageFile = (file: File): void => {
  if (file.size > MAX_IMAGE_SIZE) {
    toast.add({
      severity: 'warn',
      summary: 'Imagen muy grande',
      detail: 'El tamano maximo es 5MB',
      life: 3000
    })
    return
  }

  pendingImageFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    productImagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const removeImage = (): void => {
  productImagePreview.value = null
  pendingImageFile.value = null
  product.value.image = undefined
}

const openNew = (): void => {
  product.value = { name: '', price: 0, stock: 0 }
  productImagePreview.value = null
  pendingImageFile.value = null
  submitted.value = false
  productDialog.value = true
}

const hideDialog = (): void => {
  productDialog.value = false
  submitted.value = false
  productImagePreview.value = null
  pendingImageFile.value = null
}

const fileToUint8Array = (file: File): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer
      resolve(new Uint8Array(arrayBuffer))
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

const saveProduct = async (): Promise<void> => {
  submitted.value = true

  if (!product.value.name?.trim()) return

  saving.value = true
  try {
    let imageData: Uint8Array | undefined
    if (pendingImageFile.value) {
      imageData = await fileToUint8Array(pendingImageFile.value)
    }

    if (product.value.id) {
      const payload: Product & { id: number } = {
        id: product.value.id,
        name: product.value.name,
        price: product.value.price,
        stock: product.value.stock,
        image: imageData || product.value.image
      }
      if (payload.price < 0) return
      const result = await window.api.updateProduct(payload)
      if (result.success) {
        toast.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'Producto actualizado',
          life: 3000
        })
        productDialog.value = false
        await loadProducts()
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: result.error, life: 3000 })
      }
    } else {
      const result = await window.api.createProduct({
        name: product.value.name,
        price: product.value.price,
        stock: product.value.stock,
        image: imageData
      })
      if (result.success) {
        toast.add({ severity: 'success', summary: 'Exito', detail: 'Producto creado', life: 3000 })
        productDialog.value = false
        await loadProducts()
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: result.error, life: 3000 })
      }
    }
  } catch (err) {
    console.error(err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al guardar producto',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const editProduct = (prod: Product): void => {
  product.value = { ...prod }
  productImagePreview.value = null
  pendingImageFile.value = null
  productDialog.value = true
}

const confirmDeleteProduct = (prod: Product): void => {
  product.value = prod
  deleteProductDialog.value = true
}

const deleteProduct = async (): Promise<void> => {
  if (!product.value.id) return
  saving.value = true
  try {
    const result = await window.api.deleteProduct(product.value.id)
    if (result.success) {
      toast.add({ severity: 'info', summary: 'Exito', detail: 'Producto eliminado', life: 3000 })
      deleteProductDialog.value = false
      product.value = { name: '', price: 0, stock: 0 }
      await loadProducts()
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: result.error, life: 3000 })
    }
  } catch (err) {
    console.error(err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al eliminar producto',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const confirmDeleteSelected = (): void => {
  deleteProductsDialog.value = true
}

const deleteSelectedProducts = async (): Promise<void> => {
  saving.value = true
  try {
    for (const prod of selectedProducts.value) {
      if (prod.id) {
        await window.api.deleteProduct(prod.id)
      }
    }
    toast.add({ severity: 'success', summary: 'Exito', detail: 'Productos eliminados', life: 3000 })
    deleteProductsDialog.value = false
    selectedProducts.value = []
    await loadProducts()
  } catch (err) {
    console.error(err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al eliminar productos',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const seedProducts = async (): Promise<void> => {
  try {
    const result = await window.api.seedProducts()
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Exito',
        detail: 'Productos de prueba generados',
        life: 3000
      })
      await loadProducts()
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: result.error, life: 3000 })
    }
  } catch (err) {
    console.error(err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al generar productos',
      life: 3000
    })
  }
}
</script>

<template>
  <div>
    <div class="card">
      <Toolbar>
        <template #start>
          <span class="text-xl font-bold mr-2">Inventario</span>
        </template>

        <template v-if="user?.role === 'admin'" #end>
          <Button label="Nuevo" icon="pi pi-plus" @click="openNew" />
          <Button
            label="Eliminar"
            icon="pi pi-trash"
            severity="danger"
            variant="outlined"
            class="ml-2"
            :disabled="!selectedProducts || !selectedProducts.length"
            @click="confirmDeleteSelected"
          />
          <Button
            label="Generar Datos"
            icon="pi pi-database"
            severity="secondary"
            variant="outlined"
            class="ml-2"
            @click="seedProducts"
          />
          <span class="p-input-icon-left flex flex-row gap-2 items-center ml-2">
            <InputText v-model="filters['global'].value" placeholder="Buscar..." />
          </span>
        </template>
      </Toolbar>

      <DataTable
        v-model:selection="selectedProducts"
        v-model:first="first"
        v-model:rows="rows"
        :value="products"
        :filters="filters"
        :loading="loading"
        :paginator="true"
        striped-rows
        removable-sort
        data-key="id"
        sort-mode="multiple"
        paginator-position="top"
        paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rows-per-page-options="[5, 10, 25]"
        current-page-report-template="Mostrando {first} a {last} de {totalRecords} productos"
      >
        <Column
          v-if="user?.role === 'admin'"
          selection-mode="multiple"
          header-style="width: 3rem"
          :exportable="false"
        >
        </Column>
        <Column field="id" header="ID" sortable style="min-width: 4rem" />
        <Column field="name" header="Nombre" sortable style="min-width: 16rem" />
        <Column header="Imagen" style="min-width: 8rem">
          <template #body="slotProps">
            <img
              v-if="getImageUrl(slotProps.data.image)"
              :src="getImageUrl(slotProps.data.image)"
              alt="Producto"
              class="h-12 w-12 object-cover"
            />
            <img v-else class="h-12 w-12 object-cover" src="../assets/logoMichoacana.png" />
          </template>
        </Column>
        <Column field="price" header="Precio" sortable style="min-width: 8rem">
          <template #body="slotProps">
            {{ formatCurrency(slotProps.data.price) }}
          </template>
        </Column>
        <Column field="stock" header="Stock" sortable style="min-width: 8rem">
          <template #body="slotProps">
            <Tag :value="slotProps.data.stock" :severity="getStockSeverity(slotProps.data.stock)" />
          </template>
        </Column>
        <Column
          v-if="user?.role === 'admin'"
          :exportable="false"
          style="min-width: 12rem"
          header="Acciones"
        >
          <template #body="slotProps">
            <Button
              icon="pi pi-pencil"
              variant="outlined"
              rounded
              class="mr-2"
              @click="editProduct(slotProps.data)"
            />
            <Button
              icon="pi pi-trash"
              variant="outlined"
              rounded
              severity="danger"
              @click="confirmDeleteProduct(slotProps.data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="productDialog"
      :style="{ width: '450px' }"
      header="Detalles del Producto"
      :modal="true"
      @keydown.enter="saveProduct()"
    >
      <div class="flex flex-col gap-6">
        <div class="flex flex-col items-center gap-4">
          <div v-if="productImagePreview || product.image">
            <img
              :src="productImagePreview || getImageUrl(product.image)"
              alt="Producto"
              class="rounded"
              style="width: 150px; height: 150px; object-fit: cover"
            />
            <Button
              icon="pi pi-times"
              severity="danger"
              rounded
              class="block mx-auto mt-2"
              @click="removeImage"
            />
          </div>
          <div
            v-else
            class="border-2 border-dashed border-surface-300 rounded cursor-pointer hover:border-primary transition-colors flex flex-col items-center justify-center"
            style="width: 150px; height: 150px"
            @click="triggerFileInput"
            @dragover.prevent
            @drop.prevent="handleDrop"
          >
            <i class="pi pi-image text-3xl! mb-2 text-surface-400" />
            <span class="text-sm text-surface-400">Subir imagen</span>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          />
          <small class="text-surface-500">Maximo 5MB</small>
        </div>

        <div>
          <label for="name" class="block font-bold mb-3">Nombre</label>
          <InputText
            id="name"
            v-model.trim="product.name"
            required="true"
            autofocus
            :invalid="submitted && !product.name"
            fluid
          />
          <small v-if="submitted && !product.name" class="text-red-500"
            >El nombre es requerido.</small
          >
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="price" class="block font-bold mb-3">Precio</label>
            <InputNumber
              id="price"
              v-model="product.price"
              mode="currency"
              currency="MXN"
              locale="es-MX"
              fluid
              :min="0"
              :invalid="submitted && product.price === null"
            />
            <small v-if="submitted && product.price === null" class="text-red-500">
              El precio es requerido.
            </small>
          </div>
          <div>
            <label for="stock" class="block font-bold mb-3">Stock</label>
            <InputNumber id="stock" v-model="product.stock" :min="0" fluid />
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text :disabled="saving" @click="hideDialog" />
        <Button label="Guardar" icon="pi pi-check" :loading="saving" @click="saveProduct" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deleteProductDialog"
      :style="{ width: '450px' }"
      header="Confirmar"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle text-3xl!" />
        <span v-if="product"
          >Estas seguro de eliminar <b>{{ product.name }}</b
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
          @click="deleteProductDialog = false"
        />
        <Button
          label="Si"
          icon="pi pi-check"
          severity="danger"
          :loading="saving"
          @click="deleteProduct"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deleteProductsDialog"
      :style="{ width: '450px' }"
      header="Confirmar"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle text-3xl!" />
        <span>Estas seguro de eliminar los productos seleccionados?</span>
      </div>
      <template #footer>
        <Button
          label="No"
          icon="pi pi-times"
          text
          severity="secondary"
          :disabled="saving"
          @click="deleteProductsDialog = false"
        />
        <Button
          label="Si"
          icon="pi pi-check"
          severity="danger"
          :loading="saving"
          @click="deleteSelectedProducts"
        />
      </template>
    </Dialog>
    <Toast />
  </div>
</template>
