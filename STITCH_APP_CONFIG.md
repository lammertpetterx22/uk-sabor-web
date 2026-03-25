# 🎯 UK Sabor - Configuración para MongoDB Stitch/Realm App

## 1️⃣ INFORMACIÓN BÁSICA DE LA APP

**Nombre de la App**: UK Sabor Platform
**Tipo**: Plataforma de danza y eventos
**Base de datos**: uk-sabor
**Región**: EU (Europe) o US (según tu ubicación)

---

## 2️⃣ COLECCIONES (27 total)

### Core Collections
1. **users** - Usuarios de la plataforma
2. **instructors** - Perfiles de instructores
3. **events** - Eventos presenciales
4. **courses** - Cursos online
5. **lessons** - Lecciones de cursos (videos)
6. **classes** - Clases de baile

### Purchase & Payment Collections
7. **orders** - Órdenes de pago (Stripe)
8. **eventTickets** - Tickets de eventos
9. **coursePurchases** - Compras de cursos
10. **classPurchases** - Compras de clases
11. **classInstructors** - Relación clase-instructor (M:M)

### Check-in System
12. **qrCodes** - Códigos QR para check-in
13. **attendance** - Registros de asistencia

### CRM Collections
14. **crmContacts** - Contactos CRM
15. **crmInteractions** - Interacciones con contactos
16. **crmNotes** - Notas de contactos

### Email Marketing Collections
17. **emailTemplates** - Plantillas de email
18. **emailCampaigns** - Campañas de email
19. **emailOpens** - Tracking de aperturas
20. **emailClicks** - Tracking de clicks

### Subscription Collections
21. **subscriptions** - Suscripciones de usuarios
22. **usageTracking** - Uso mensual por plan

### Financial Collections
23. **balances** - Balances de instructores
24. **ledgerTransactions** - Historial de transacciones
25. **withdrawalRequests** - Solicitudes de retiro

### Other Collections
26. **instructorApplications** - Solicitudes para ser instructor
27. **lessonProgress** - Progreso de lecciones por usuario

---

## 3️⃣ SCHEMAS JSON PARA MONGODB

### users
```json
{
  "title": "users",
  "bsonType": "object",
  "required": ["openId", "role", "subscriptionPlan", "createdAt"],
  "properties": {
    "_id": { "bsonType": "objectId" },
    "openId": { "bsonType": "string" },
    "name": { "bsonType": "string" },
    "email": { "bsonType": "string" },
    "loginMethod": { "bsonType": "string" },
    "passwordHash": { "bsonType": "string" },
    "avatarUrl": { "bsonType": "string" },
    "bio": { "bsonType": "string" },
    "role": { "bsonType": "string", "enum": ["user", "instructor", "promoter", "admin"] },
    "roles": { "bsonType": "array", "items": { "bsonType": "string" } },
    "subscriptionPlan": { "bsonType": "string", "enum": ["starter", "professional", "premium"] },
    "stripeCustomerId": { "bsonType": "string" },
    "stripeAccountId": { "bsonType": "string" },
    "createdAt": { "bsonType": "date" },
    "updatedAt": { "bsonType": "date" },
    "lastSignedIn": { "bsonType": "date" }
  }
}
```

### events
```json
{
  "title": "events",
  "bsonType": "object",
  "required": ["title", "venue", "eventDate", "ticketPrice", "status"],
  "properties": {
    "_id": { "bsonType": "objectId" },
    "title": { "bsonType": "string" },
    "description": { "bsonType": "string" },
    "imageUrl": { "bsonType": "string" },
    "venue": { "bsonType": "string" },
    "city": { "bsonType": "string" },
    "eventDate": { "bsonType": "date" },
    "eventEndDate": { "bsonType": "date" },
    "ticketPrice": { "bsonType": "decimal" },
    "maxTickets": { "bsonType": "int" },
    "ticketsSold": { "bsonType": "int" },
    "status": { "bsonType": "string", "enum": ["draft", "published", "sold_out", "cancelled"] },
    "paymentMethod": { "bsonType": "string", "enum": ["online", "cash", "both"] },
    "creatorId": { "bsonType": "objectId" },
    "createdAt": { "bsonType": "date" },
    "updatedAt": { "bsonType": "date" }
  }
}
```

### courses
```json
{
  "title": "courses",
  "bsonType": "object",
  "required": ["title", "instructorId", "price", "status"],
  "properties": {
    "_id": { "bsonType": "objectId" },
    "title": { "bsonType": "string" },
    "description": { "bsonType": "string" },
    "imageUrl": { "bsonType": "string" },
    "instructorId": { "bsonType": "objectId" },
    "price": { "bsonType": "decimal" },
    "level": { "bsonType": "string", "enum": ["beginner", "intermediate", "advanced", "all-levels"] },
    "danceStyle": { "bsonType": "string" },
    "duration": { "bsonType": "string" },
    "lessonsCount": { "bsonType": "int" },
    "status": { "bsonType": "string", "enum": ["draft", "published", "archived"] },
    "createdAt": { "bsonType": "date" },
    "updatedAt": { "bsonType": "date" }
  }
}
```

### lessons
```json
{
  "title": "lessons",
  "bsonType": "object",
  "required": ["courseId", "title", "position"],
  "properties": {
    "_id": { "bsonType": "objectId" },
    "courseId": { "bsonType": "objectId" },
    "title": { "bsonType": "string" },
    "description": { "bsonType": "string" },
    "bunnyVideoId": { "bsonType": "string" },
    "bunnyLibraryId": { "bsonType": "string" },
    "position": { "bsonType": "int" },
    "durationSeconds": { "bsonType": "int" },
    "isPreview": { "bsonType": "bool" },
    "createdAt": { "bsonType": "date" },
    "updatedAt": { "bsonType": "date" }
  }
}
```

### orders
```json
{
  "title": "orders",
  "bsonType": "object",
  "required": ["userId", "amount", "status", "itemType", "itemId"],
  "properties": {
    "_id": { "bsonType": "objectId" },
    "userId": { "bsonType": "objectId" },
    "stripePaymentIntentId": { "bsonType": "string" },
    "amount": { "bsonType": "decimal" },
    "currency": { "bsonType": "string" },
    "status": { "bsonType": "string", "enum": ["pending", "succeeded", "failed", "refunded"] },
    "itemType": { "bsonType": "string", "enum": ["event", "course", "class", "subscription"] },
    "itemId": { "bsonType": "objectId" },
    "livemode": { "bsonType": "bool" },
    "createdAt": { "bsonType": "date" },
    "updatedAt": { "bsonType": "date" }
  }
}
```

### eventTickets
```json
{
  "title": "eventTickets",
  "bsonType": "object",
  "required": ["userId", "eventId", "status"],
  "properties": {
    "_id": { "bsonType": "objectId" },
    "userId": { "bsonType": "objectId" },
    "eventId": { "bsonType": "objectId" },
    "orderId": { "bsonType": "objectId" },
    "quantity": { "bsonType": "int" },
    "instructorId": { "bsonType": "objectId" },
    "pricePaid": { "bsonType": "decimal" },
    "platformFee": { "bsonType": "decimal" },
    "instructorEarnings": { "bsonType": "decimal" },
    "ticketCode": { "bsonType": "string" },
    "status": { "bsonType": "string", "enum": ["valid", "used", "refunded"] },
    "purchasedAt": { "bsonType": "date" },
    "usedAt": { "bsonType": "date" }
  }
}
```

### coursePurchases
```json
{
  "title": "coursePurchases",
  "bsonType": "object",
  "required": ["userId", "courseId"],
  "properties": {
    "_id": { "bsonType": "objectId" },
    "userId": { "bsonType": "objectId" },
    "courseId": { "bsonType": "objectId" },
    "instructorId": { "bsonType": "objectId" },
    "orderId": { "bsonType": "objectId" },
    "pricePaid": { "bsonType": "decimal" },
    "platformFee": { "bsonType": "decimal" },
    "instructorEarnings": { "bsonType": "decimal" },
    "progress": { "bsonType": "int" },
    "completed": { "bsonType": "bool" },
    "purchasedAt": { "bsonType": "date" },
    "completedAt": { "bsonType": "date" }
  }
}
```

### lessonProgress
```json
{
  "title": "lessonProgress",
  "bsonType": "object",
  "required": ["userId", "lessonId"],
  "properties": {
    "_id": { "bsonType": "objectId" },
    "userId": { "bsonType": "objectId" },
    "lessonId": { "bsonType": "objectId" },
    "watchPercent": { "bsonType": "int" },
    "completed": { "bsonType": "bool" },
    "completedAt": { "bsonType": "date" },
    "createdAt": { "bsonType": "date" },
    "updatedAt": { "bsonType": "date" }
  }
}
```

---

## 4️⃣ INDEXES

```javascript
// users
db.users.createIndex({ "openId": 1 }, { unique: true })
db.users.createIndex({ "email": 1 })
db.users.createIndex({ "role": 1 })
db.users.createIndex({ "stripeCustomerId": 1 })

// events
db.events.createIndex({ "status": 1 })
db.events.createIndex({ "creatorId": 1 })
db.events.createIndex({ "eventDate": 1 })

// courses
db.courses.createIndex({ "instructorId": 1 })
db.courses.createIndex({ "status": 1 })
db.courses.createIndex({ "level": 1 })

// lessons
db.lessons.createIndex({ "courseId": 1, "position": 1 })

// orders
db.orders.createIndex({ "userId": 1 })
db.orders.createIndex({ "stripePaymentIntentId": 1 })

// eventTickets
db.eventTickets.createIndex({ "userId": 1 })
db.eventTickets.createIndex({ "eventId": 1 })
db.eventTickets.createIndex({ "ticketCode": 1 }, { unique: true })
db.eventTickets.createIndex({ "status": 1 })

// coursePurchases
db.coursePurchases.createIndex({ "userId": 1 })
db.coursePurchases.createIndex({ "courseId": 1 })
db.coursePurchases.createIndex({ "instructorId": 1 })

// lessonProgress
db.lessonProgress.createIndex({ "userId": 1, "lessonId": 1 }, { unique: true })

// qrCodes
db.qrCodes.createIndex({ "code": 1 }, { unique: true })

// crmContacts
db.crmContacts.createIndex({ "email": 1 }, { unique: true })

// subscriptions
db.subscriptions.createIndex({ "userId": 1 })
db.subscriptions.createIndex({ "stripeSubscriptionId": 1 })

// balances
db.balances.createIndex({ "userId": 1 }, { unique: true })

// withdrawalRequests
db.withdrawalRequests.createIndex({ "userId": 1 })
db.withdrawalRequests.createIndex({ "status": 1 })
```

---

## 5️⃣ AUTHENTICATION (Realm App)

### Proveedores de Autenticación a Habilitar

1. **Email/Password** (Principal)
   - Auto-confirmación: Habilitado
   - Reset password: Habilitado
   - Email field: email
   - Password requirements: Min 8 caracteres

2. **Custom JWT** (Opcional - para migrar usuarios existentes)
   - Signing Algorithm: HS256
   - Secret: `JWT_SECRET` (mismo del .env actual)
   - Metadata Fields:
     ```json
     {
       "openId": "%%user.id",
       "role": "%%user.data.role",
       "email": "%%user.data.email"
     }
     ```

3. **API Key** (Para integraciones externas)
   - Para webhooks de Stripe

---

## 6️⃣ RULES (Permisos de Seguridad)

### users Collection
```json
{
  "roles": [
    {
      "name": "owner",
      "apply_when": { "_id": "%%user.id" },
      "read": true,
      "write": {
        "name": true,
        "email": true,
        "avatarUrl": true,
        "bio": true
      }
    },
    {
      "name": "admin",
      "apply_when": { "%%user.custom_data.role": "admin" },
      "read": true,
      "write": true
    }
  ]
}
```

### events Collection
```json
{
  "roles": [
    {
      "name": "public_read",
      "apply_when": {},
      "read": { "status": "published" },
      "write": false
    },
    {
      "name": "creator",
      "apply_when": { "creatorId": "%%user.id" },
      "read": true,
      "write": true
    },
    {
      "name": "admin",
      "apply_when": { "%%user.custom_data.role": "admin" },
      "read": true,
      "write": true
    }
  ]
}
```

### courses Collection
```json
{
  "roles": [
    {
      "name": "public_read",
      "apply_when": {},
      "read": { "status": "published" },
      "write": false
    },
    {
      "name": "instructor",
      "apply_when": { "instructorId": "%%user.custom_data.instructorProfileId" },
      "read": true,
      "write": true
    },
    {
      "name": "admin",
      "apply_when": { "%%user.custom_data.role": "admin" },
      "read": true,
      "write": true
    }
  ]
}
```

### orders Collection
```json
{
  "roles": [
    {
      "name": "owner",
      "apply_when": { "userId": "%%user.id" },
      "read": true,
      "write": false
    },
    {
      "name": "admin",
      "apply_when": { "%%user.custom_data.role": "admin" },
      "read": true,
      "write": true
    }
  ]
}
```

---

## 7️⃣ REALM FUNCTIONS (Serverless)

### Function: createOrder
```javascript
exports = async function({ userId, amount, itemType, itemId, stripePaymentIntentId }) {
  const mongodb = context.services.get("mongodb-atlas");
  const db = mongodb.db("uk-sabor");

  const order = {
    userId: BSON.ObjectId(userId),
    amount: BSON.Decimal128.fromString(amount.toString()),
    currency: "GBP",
    status: "pending",
    itemType: itemType,
    itemId: BSON.ObjectId(itemId),
    stripePaymentIntentId: stripePaymentIntentId,
    livemode: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await db.collection("orders").insertOne(order);
  return { orderId: result.insertedId.toString() };
};
```

### Function: purchaseCourse
```javascript
exports = async function({ userId, courseId, orderId, pricePaid }) {
  const mongodb = context.services.get("mongodb-atlas");
  const db = mongodb.db("uk-sabor");

  // Get course to find instructor
  const course = await db.collection("courses").findOne({ _id: BSON.ObjectId(courseId) });

  // Calculate split (90% instructor, 10% platform)
  const price = parseFloat(pricePaid);
  const platformFee = price * 0.10;
  const instructorEarnings = price * 0.90;

  const purchase = {
    userId: BSON.ObjectId(userId),
    courseId: BSON.ObjectId(courseId),
    instructorId: course.instructorId,
    orderId: BSON.ObjectId(orderId),
    pricePaid: BSON.Decimal128.fromString(pricePaid.toString()),
    platformFee: BSON.Decimal128.fromString(platformFee.toString()),
    instructorEarnings: BSON.Decimal128.fromString(instructorEarnings.toString()),
    progress: 0,
    completed: false,
    purchasedAt: new Date()
  };

  await db.collection("coursePurchases").insertOne(purchase);

  // Update instructor balance
  await db.collection("balances").updateOne(
    { userId: course.instructorId },
    {
      $inc: {
        currentBalance: BSON.Decimal128.fromString(instructorEarnings.toString()),
        totalEarned: BSON.Decimal128.fromString(instructorEarnings.toString())
      },
      $set: { updatedAt: new Date() }
    },
    { upsert: true }
  );

  return { success: true };
};
```

### Function: updateLessonProgress
```javascript
exports = async function({ userId, lessonId, watchPercent }) {
  const mongodb = context.services.get("mongodb-atlas");
  const db = mongodb.db("uk-sabor");

  const completed = watchPercent >= 95;

  await db.collection("lessonProgress").updateOne(
    { userId: BSON.ObjectId(userId), lessonId: BSON.ObjectId(lessonId) },
    {
      $set: {
        watchPercent: watchPercent,
        completed: completed,
        completedAt: completed ? new Date() : null,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );

  return { success: true, completed: completed };
};
```

---

## 8️⃣ TRIGGERS (Webhooks)

### Trigger: Stripe Payment Confirmed
```javascript
// Database Trigger on "orders" collection
// When: UPDATE
// Match: { "fullDocument.status": "succeeded" }

exports = async function(changeEvent) {
  const order = changeEvent.fullDocument;
  const mongodb = context.services.get("mongodb-atlas");
  const db = mongodb.db("uk-sabor");

  // Call purchaseCourse/purchaseClass/purchaseEvent based on itemType
  if (order.itemType === "course") {
    await context.functions.execute("purchaseCourse", {
      userId: order.userId.toString(),
      courseId: order.itemId.toString(),
      orderId: order._id.toString(),
      pricePaid: order.amount.toString()
    });
  }

  // Send confirmation email via external service
  // context.http.post({...})
};
```

---

## 9️⃣ ENVIRONMENT VALUES (Secrets)

En Realm App → Values → Create Secret:

```
STRIPE_SECRET_KEY = sk_live_xxxxx
STRIPE_WEBHOOK_SECRET = whsec_xxxxx
BUNNY_API_KEY = xxxxx
BUNNY_VIDEO_LIBRARY_ID = 616736
RESEND_API_KEY = re_xxxxx
JWT_SECRET = your_jwt_secret
```

---

## 🔟 EXTERNAL SERVICES (HTTP)

### Configurar en Realm App → Third Party Services

1. **Stripe API**
   - Name: stripe
   - Base URL: https://api.stripe.com/v1
   - Authorization: Bearer %%values.STRIPE_SECRET_KEY

2. **Bunny.net API**
   - Name: bunny
   - Base URL: https://video.bunnycdn.com
   - Headers: AccessKey: %%values.BUNNY_API_KEY

3. **Resend API**
   - Name: resend
   - Base URL: https://api.resend.com
   - Authorization: Bearer %%values.RESEND_API_KEY

---

## ✅ CHECKLIST DE CONFIGURACIÓN

### Paso 1: Crear App
- [ ] Crear cluster en MongoDB Atlas
- [ ] Crear Realm Application
- [ ] Nombre: uk-sabor
- [ ] Region: EU/US

### Paso 2: Database
- [ ] Crear database: uk-sabor
- [ ] Crear 27 collections (ver lista arriba)
- [ ] Aplicar schemas JSON
- [ ] Crear indexes

### Paso 3: Authentication
- [ ] Habilitar Email/Password
- [ ] Habilitar Custom JWT (opcional)
- [ ] Habilitar API Key (para Stripe webhooks)

### Paso 4: Rules
- [ ] Aplicar rules para users
- [ ] Aplicar rules para events
- [ ] Aplicar rules para courses
- [ ] Aplicar rules para orders

### Paso 5: Functions
- [ ] Crear function: createOrder
- [ ] Crear function: purchaseCourse
- [ ] Crear function: updateLessonProgress

### Paso 6: Triggers
- [ ] Crear trigger: Stripe Payment Confirmed

### Paso 7: Values/Secrets
- [ ] Agregar STRIPE_SECRET_KEY
- [ ] Agregar BUNNY_API_KEY
- [ ] Agregar RESEND_API_KEY
- [ ] Agregar JWT_SECRET

### Paso 8: External Services
- [ ] Configurar Stripe HTTP Service
- [ ] Configurar Bunny HTTP Service
- [ ] Configurar Resend HTTP Service

### Paso 9: Deploy
- [ ] Review & Deploy Changes
- [ ] Test authentication
- [ ] Test CRUD operations

---

**¡Listo!** Esta es toda la configuración necesaria para crear tu app en MongoDB Stitch/Realm.
