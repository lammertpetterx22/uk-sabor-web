# 🛒 PROMPT: Rediseñar el Shopping Cart Drawer (CartDrawer.tsx)

## Archivo a modificar
`client/src/components/cart/CartDrawer.tsx`

## Problema actual
El carrito de compras (drawer lateral) se ve muy comprimido y cramped. Los items del carrito tienen poco espacio, la imagen del producto es demasiado pequeña, y la información general se ve apretada. El usuario necesita más espacio visual para revisar sus compras antes de hacer checkout.

## Referencia visual del estado actual
- El drawer se abre desde la derecha con `max-w-md` (demasiado estrecho)
- Las imágenes de los productos son solo 80x80px (w-20 h-20)
- Los items están apilados en cards pequeñas con poco padding
- El título del producto se corta (line-clamp-2)
- La información como tipo, estilo de baile, fecha está comprimida
- El footer con Total y botón de Checkout está muy pegado a los items

## Cambios requeridos

### 1. Hacer el drawer más ancho
- Cambiar `max-w-md` a `max-w-lg` para dar más espacio horizontal
- En móvil mantener `w-full` para que ocupe toda la pantalla

### 2. Mejorar las cards de los items
- Aumentar el tamaño de las imágenes de `w-20 h-20` a `w-28 h-28` (o incluso más)
- Dar más padding interno a las cards (de `p-4` a `p-5`)
- Aumentar el espacio entre items (de `space-y-6` a `space-y-5` pero con cards más grandes)
- Hacer el título más prominente y con más espacio (`text-lg` en vez de `text-base`)
- Mostrar la location si existe (actualmente hay campo `location` en CartItem pero no se muestra)

### 3. Mejorar la sección de cada item con layout vertical más claro
Organizar cada card así:
```
┌──────────────────────────────────────────┐
│  ┌────────────┐                     🗑️  │
│  │            │  TITLE                   │
│  │   IMAGE    │  Instructor Name         │
│  │  (grande)  │  📍 Location             │
│  │            │  📅 Date                 │
│  └────────────┘  🎭 Dance Style | Event  │
│                                          │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  [- ] 1 [+]                    £5.00     │
│                          £5.00 each      │
└──────────────────────────────────────────┘
```

### 4. Mejorar el footer (Total y Checkout)
- Dar más separación visual entre el total y el botón
- Añadir un subtítulo o resumen como "X items in cart"
- Hacer el precio total más prominente
- Mantener el botón grande y atractivo (ya está bien con btn-vibrant)

### 5. Mejorar responsive para móvil
- En pantallas pequeñas, las imágenes pueden ser un poco más pequeñas
- Asegurarse de que el drawer cubre todo el ancho en móvil
- Que el scroll funcione bien cuando hay muchos items

### 6. Animaciones y micro-interacciones
- Añadir una transición suave al eliminar un item (opcional)
- Hover effects más visibles en las cards
- El botón de quantity (+/-) podría tener un efecto de pulse al hacer click

## Restricciones
- NO cambiar la lógica de negocio (checkout, addItem, removeItem, etc.)
- NO cambiar el store (`cartStore.ts`)
- Mantener los mismos colores del tema (dark theme con gradientes accent)
- Mantener la animación de entrada del drawer (slideInRight)
- Mantener el backdrop blur
- El componente debe seguir usando los mismos imports y props

## Stack técnico
- React + TypeScript
- Lucide React para iconos
- Clases Tailwind-like (custom CSS con variables como `text-accent`, `bg-card`, etc.)
- El proyecto usa `className` strings, NO Tailwind JIT real - son clases CSS custom definidas en el proyecto

## Resultado esperado
Un carrito de compras que se sienta premium y espacioso, donde el usuario pueda ver claramente qué está comprando, con imágenes grandes, información bien organizada, y un flujo visual claro desde los items hasta el checkout.
