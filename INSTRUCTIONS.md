# Blueprint Técnico: Con Sabor UK App

## 1. Identidad Visual (Estricta)
- **Fondo Principal:** #000000 (Negro puro)
- **Primarios:** #FA3698 y #FD4D43 (Gradientes en botones de acción)
- **Destacados:** #FCC500 (Avisos/Llamadas a la acción)
- **Interactivos:** #0ADCF4 (Enlaces/Estados activos)
- **Navegación:** Tab Bar inferior en Mobile (tipo Instagram), Sidebar en Desktop.

## 2. Lógica de Academia (LMS)
- **Niveles:** Beginner, Intermediate, Advanced. (8-10 lecciones por bloque).
- **Control de Acceso:** - La Lección [n+1] está BLOQUEADA hasta que la Lección [n] se marque como 'completada'.
  - Una lección se completa automáticamente al finalizar el video.
- **Reproductor:** Debe incluir controles de velocidad (0.5x, 1x, 1.25x, 1.5x, 1.75x, 2x).
- **Seguridad:** Bloquear descargas de video y añadir protección básica contra grabación de pantalla.

## 3. Sistema de Eventos y Ticketing
- **Generación de QR:** 1 QR único por entrada (aunque se compren varias en un pedido).
- **Modo Staff:** Vista protegida para profesores/promotores con acceso a cámara para escanear y validar QRs.
- **Ubicación:** Integración con Google Maps para el botón "Ir al Venue".

## 4. Plan de Membresías (SaaS para Profesores)
- **Starter (Gratis):** 1 evento/mes, 0 clases, 8% comisión.
- **Creator (£5):** 1 evento/mes, 1 clase/semana, 4% comisión.
- **Promoter (£10):** Eventos ilimitados, 10 clases/semana, 3% comisión.
- **Academy (£25):** Todo ilimitado + gestión de estudiantes, 2% comisión.
- **Regla de Impago:** Si la suscripción falla, bajar a 'Starter' tras 7 días de gracia.

## 5. Backend (Supabase)
- **Auth:** Cierre de sesión automático cada 24 horas por seguridad.
- **Checkout:** Desglosar: [Precio Ticket] + [Comisión Plataforma] + [Fee Stripe]. El comprador asume los cargos.
- **Emails:** Automatización vía Resend (Bienvenida y Accesos).

## 6. Panel de Administración (SuperAdmin)
- Control total de roles, edición de perfiles de instructores y métricas de ventas diarias/videos más vistos.