# Prompt para Claude

¡Hola Claude! Acabamos de terminar una serie de mejoras en el código de nuestra plataforma UK Sabor Web. Ya hemos implementado localmente las siguientes correcciones de nuestro reporte de QA:

1. **Shopping Cart & E-commerce**: Sistema de carrito multicompra con estado en Zustand (`cartStore.ts`) y un botón universal `AddToCartButton`. Checkout de Stripe actualizado para recibir múltiples items con sus cantidades.
2. **Search API**: Barras de búsqueda y filtrado en tiempo real en los componentes `Courses.tsx`, `Events.tsx` y `Classes.tsx`.
3. **Legal Pages**: Se agregaron `TermsOfService.tsx` y `PrivacyPolicy.tsx` y se linkearon globalmente desde el footer y el menú móvil.
4. **Form Validation**: Mejoras en el onboarding reactivo de instructores usando react-hook-form.
5. **Navegación Fluida**: Se eliminó el spinner bloqueante de 3 segundos y se reemplazó por un `PageLoader` no bloqueante al transicionar de rutas con Wouter.
6. **Datos DB**: Se limpiaron los textos "Lorem Ipsum".

**Nuestro Objetivo Actual: Deploy a Koyeb**
El proyecto contiene scripts pre-existentes para desplegar en Koyeb (`.koyeb-deploy.sh`, `KOYEB_SETUP.md` y `KOYEB_DEPLOYMENT.md`).
Al internar correr el script `./.koyeb-deploy.sh`, se detiene arrojando el error: `KOYEB_TOKEN environment variable is not set`.

**Tu Tarea:**
1. Ayúdame a conseguir, configurar y exportar mi `KOYEB_TOKEN`.
2. Guíame paso a paso para ejecutar el script de deploy y subir la nueva versión a producción en Koyeb.
3. Asegúrate de verificar y configurar las variables de entorno de producción (Stripe, base de datos de producción de Supabase/Neon, Bunny.net, Resend, JWT_SECRET, etc.) en el dashboard de Koyeb tal como lo pide el `KOYEB_DEPLOYMENT.md`.
