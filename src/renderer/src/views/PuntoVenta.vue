<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import Badge from 'primevue/badge'

interface Product {
  id: number
  name: string
  price: number
  stock: number
  image?: Uint8Array
}

interface CartItem extends Product {
  productId: number
  quantity: number
}

const toast = useToast()

const products = ref<Product[]>([])
const searchQuery = ref('')
const cart = ref<CartItem[]>([])
const showPaymentDialog = ref(false)
const paymentMethod = ref<'cash'>('cash')
const receivedAmount = ref(0)
const lastChange = ref(0)
const showChangeNotification = ref(false)

// const paymentMethods = ['Efectivo', 'Tarjeta']

const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value
  const query = searchQuery.value.toLowerCase()
  return products.value.filter((p) => p.name.toLowerCase().includes(query))
})

const total = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

const canConfirmSale = computed(() => {
  if (paymentMethod.value === 'cash') {
    return receivedAmount.value >= total.value
  }
  return true
})

onMounted(() => {
  loadProducts()
})

const loadProducts = async (): Promise<void> => {
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
  }
}

const getImageUrl = (image: Uint8Array | undefined): string | undefined => {
  if (!image || image.length === 0) return undefined
  const blob = new Blob([new Uint8Array(image)], { type: 'image/*' })
  return URL.createObjectURL(blob)
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
}

const addToCart = (product: Product): void => {
  if (product.stock === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Sin stock',
      detail: 'Este producto no tiene stock disponible',
      life: 3000
    })
    return
  }

  const existingItem = cart.value.find((i) => i.productId === product.id)
  if (existingItem) {
    if (existingItem.quantity < product.stock) {
      existingItem.quantity++
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Stock maximo',
        detail: 'No hay mas stock disponible',
        life: 3000
      })
    }
  } else {
    cart.value.push({
      ...product,
      productId: product.id,
      quantity: 1
    })
  }
}

const removeFromCart = (productId: number): void => {
  cart.value = cart.value.filter((i) => i.productId !== productId)
}

const incrementQuantity = (item: CartItem): void => {
  if (item.quantity < item.stock) {
    item.quantity++
  }
}

const decrementQuantity = (item: CartItem): void => {
  if (item.quantity > 1) {
    item.quantity--
  }
}

const updateQuantity = (item: CartItem, value: number | null): void => {
  if (value !== null && value >= 1 && value <= item.stock) {
    item.quantity = value
  } else if (value !== null && value < 1) {
    item.quantity = 1
  } else if (value !== null && value > item.stock) {
    item.quantity = item.stock
  }
}

const clearCart = (): void => {
  cart.value = []
}

const processSale = async (): Promise<void> => {
  receivedAmount.value = total.value
  showPaymentDialog.value = true
  await nextTick()
  const input = document.getElementById('received')
  if (input) {
    const inputElement = input.querySelector('input') as HTMLInputElement
    if (inputElement) {
      inputElement.focus()
      inputElement.select()
    }
  }
}

const confirmSale = async (): Promise<void> => {
  try {
    const items = cart.value.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price
    }))

    const result = await window.api.createSale({ items })

    if (result.success) {
      lastChange.value = paymentMethod.value === 'cash' ? receivedAmount.value - total.value : 0
      showChangeNotification.value = true

      toast.add({
        severity: 'success',
        summary: 'Venta completada',
        detail: `Venta #${result.data?.id} registrada exitosamente`,
        life: 3000
      })

      showPaymentDialog.value = false
      cart.value = []
      await loadProducts()
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: result.error, life: 3000 })
    }
  } catch (err) {
    console.error(err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al procesar la venta',
      life: 3000
    })
  }
}
</script>

<template>
  <div class="max-h-[calc(100vh-80px)] flex gap-4">
    <div class="flex-1 flex flex-col pl-4">
      <div class="mb-4">
        <div class="p-input-icon-left w-full mt-4">
          <InputText v-model="searchQuery" placeholder="Buscar productos..." class="w-full" />
        </div>
      </div>

      <div class="flex-1 overflow-auto px-1">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="bg-white rounded-lg shadow-md p-4 flex flex-col cursor-pointer hover:shadow-lg transition-shadow border-2"
            :class="{ 'border-2 border-pink-500': cart.find((i) => i.productId === product.id) }"
            @click="addToCart(product)"
          >
            <div class="flex items-center justify-center h-32 bg-surface-100 rounded-md mb-3">
              <img
                v-if="getImageUrl(product.image)"
                :src="getImageUrl(product.image)"
                alt=""
                class="h-full w-full object-contain rounded"
              />
              <i v-else class="pi pi-box text-6xl! text-surface-400" />
            </div>
            <h3 class="font-semibold text-lg text-surface-800 truncate">{{ product.name }}</h3>
            <p class="text-primary font-bold text-xl mt-auto">
              {{ formatCurrency(product.price) }}
            </p>
            <p
              class="text-sm mt-1 font-bold"
              :class="{
                'text-red-500': product.stock === 0,
                'text-orange-500': product.stock > 0 && product.stock <= 10,
                'text-green-500': product.stock > 10
              }"
            >
              Stock: {{ product.stock }}
            </p>
          </div>
        </div>

        <div v-if="filteredProducts.length === 0" class="text-center py-8 text-surface-500">
          <i class="pi pi-search text-4xl mb-2" />
          <p>No se encontraron productos</p>
        </div>
      </div>
    </div>

    <div class="w-96 bg-white rounded-lg shadow-md flex flex-col max-h-[calc(100vh-80px)] mt-4">
      <div class="p-4 border-b border-surface-200">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-surface-800 flex items-center gap-2">
            <i class="pi pi-shopping-cart" />
            Carrito
          </h2>
          <Badge :value="cart.reduce((sum, i) => sum + i.quantity, 0)" severity="primary" />
        </div>
      </div>

      <div class="flex-1 overflow-auto p-4">
        <div v-if="cart.length === 0" class="text-center py-8 text-surface-400">
          <i class="pi pi-cart-plus text-4xl mb-2" />
          <p>El carrito esta vacio</p>
          <p class="text-sm">Haz clic en un producto para agregarlo</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in cart"
            :key="item.productId"
            class="bg-surface-50 rounded-lg p-3 border border-surface-200"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-surface-800 truncate">{{ item.name }}</h4>
                <p class="text-sm text-surface-500">{{ formatCurrency(item.price) }} c/u</p>
              </div>
              <Button
                icon="pi pi-trash"
                severity="danger"
                rounded
                size="small"
                @click="removeFromCart(item.productId)"
              />
            </div>

            <div class="flex items-center justify-between mt-2">
              <div class="flex items-center justify-between gap-2">
                <Button
                  icon="pi pi-minus"
                  severity="secondary"
                  variant="outlined"
                  rounded
                  size="small"
                  :disabled="item.quantity <= 1"
                  @click="decrementQuantity(item)"
                />
                <InputNumber
                  v-model="item.quantity"
                  :min="1"
                  :max="item.stock"
                  size="small"
                  @update:model-value="(val) => updateQuantity(item, val)"
                />
                <Button
                  icon="pi pi-plus"
                  severity="secondary"
                  variant="outlined"
                  rounded
                  size="small"
                  :disabled="item.quantity >= item.stock"
                  @click="incrementQuantity(item)"
                />
              </div>
              <p class="font-bold text-primary">
                {{ formatCurrency(item.price * item.quantity) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-surface-200 bg-surface-50 rounded-b-lg">
        <div class="flex justify-between items-center mb-4">
          <span class="text-lg font-semibold text-surface-700">Total:</span>
          <span class="text-2xl font-bold text-primary">{{ formatCurrency(total) }}</span>
        </div>

        <div
          v-if="showChangeNotification"
          class="mb-4 bg-pink-500 text-white px-4 py-3 rounded-lg flex items-center justify-between"
        >
          <span class="font-semibold">Cambio: {{ formatCurrency(lastChange) }}</span>
          <Button
            icon="pi pi-times"
            severity="secondary"
            text
            rounded
            class="text-black!"
            @click="showChangeNotification = false"
          />
        </div>

        <div class="flex gap-2">
          <Button
            label="Limpiar"
            severity="secondary"
            variant="outlined"
            class="flex-1"
            :disabled="cart.length === 0"
            @click="clearCart"
          />
          <Button
            label="Cobrar"
            icon="pi pi-credit-card"
            class="flex-1"
            :disabled="cart.length === 0"
            @click="processSale"
          />
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="showPaymentDialog"
      :style="{ width: '450px' }"
      header="Completar Venta"
      :modal="true"
      :close-on-escape="true"
      :closable="false"
      @keydown.enter="canConfirmSale && confirmSale()"
    >
      <div class="flex flex-col gap-4">
        <div class="text-center">
          <p class="text-surface-500">Total a pagar</p>
          <p class="text-4xl font-bold text-primary">{{ formatCurrency(total) }}</p>
        </div>

        <div v-if="paymentMethod === 'cash'" class="flex flex-col gap-2">
          <label for="received" class="font-semibold">Cantidad recibida</label>
          <InputNumber
            id="received"
            v-model="receivedAmount"
            mode="currency"
            currency="MXN"
            locale="es-MX"
            :min="0"
            fluid
          />
          <div v-if="receivedAmount >= total" class="text-success font-semibold">
            Cambio: {{ formatCurrency(receivedAmount - total) }}
          </div>
          <div v-else-if="receivedAmount > 0" class="text-red-500 text-sm">
            La cantidad recibida es menor al total
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="showPaymentDialog = false" />
        <Button
          label="Confirmar Venta"
          icon="pi pi-check"
          :disabled="!canConfirmSale"
          @click="confirmSale"
        />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<style scoped>
:deep(.p-inputnumber-input) {
  text-align: center;
}
</style>
