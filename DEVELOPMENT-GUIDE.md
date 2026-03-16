# 🚀 Enhanced Development Workflow Guide

## Overview
This guide provides expert-level development tools and workflows for debugging, monitoring, and maintaining your UK Sabor web application with 20+ years of web development best practices.

---

## 🛠️ Available Tools

### 1. **Development Monitor** (`pnpm monitor`)
Continuously monitors your development server health in real-time.

**Features:**
- ✅ Server status and response time
- ✅ Database connection health
- ✅ Frontend build status and HMR
- ✅ Auto-refresh every 5 seconds
- ✅ Visual alerts for critical issues

**Usage:**
```bash
pnpm monitor
```

**When to use:**
- Running in a separate terminal while developing
- Debugging connection issues
- Monitoring server performance
- Ensuring database connectivity

---

### 2. **Debug Helper** (`pnpm debug`)
Comprehensive diagnostic tool that checks your entire development environment.

**Features:**
- 🔍 TypeScript error detection
- 📦 Dependency validation
- 🔐 Environment variable checks
- 🏗️ Build configuration validation
- 🖥️ Server health verification
- 💡 Automatic fix suggestions

**Usage:**
```bash
pnpm debug
```

**When to use:**
- After pulling new code
- When encountering mysterious errors
- Before starting development
- When deployment fails
- After updating dependencies

---

### 3. **Health Check** (`pnpm health`)
Quick health check endpoint to verify server is responding.

**Usage:**
```bash
pnpm health
```

---

## 📋 Expert Development Workflow

### Daily Development Routine

1. **Start Development Server**
   ```bash
   pnpm dev
   ```

2. **In a separate terminal, run the monitor**
   ```bash
   pnpm monitor
   ```

3. **If you encounter issues, run diagnostics**
   ```bash
   pnpm debug
   ```

---

## 🔧 Common Issues & Solutions

### TypeScript Errors
**Symptom:** Build fails with type errors

**Solutions:**
1. Run `pnpm debug` to identify all errors
2. Check suggested fixes in the diagnostic report
3. Run `pnpm check` to verify types without building
4. Ensure all types are properly imported

**Common fixes:**
```typescript
// Missing optional chaining
user.profile?.name  // ✅ Safe
user.profile.name   // ❌ May crash

// Missing null checks
if (data) { data.map(...) }  // ✅ Safe
data.map(...)                // ❌ May crash if null

// Type assertions when you know the type
const element = document.getElementById('id') as HTMLElement
```

---

### Server Not Starting
**Symptom:** `pnpm dev` fails or server won't start

**Solutions:**
1. Check if port 3000 is already in use:
   ```bash
   lsof -ti:3000
   kill -9 $(lsof -ti:3000)  # Kill the process
   ```

2. Run diagnostics: `pnpm debug`

3. Check environment variables:
   ```bash
   ls -la .env
   ```

4. Reinstall dependencies:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

---

### Database Connection Issues
**Symptom:** Database queries fail or timeout

**Solutions:**
1. Verify `.env` has correct `DATABASE_URL`
2. Check database is running
3. Run migrations: `pnpm db:push`
4. Check monitor output for database status

**Environment variable format:**
```bash
DATABASE_URL="postgresql://user:password@host:port/database"
```

---

### Frontend Build Errors
**Symptom:** Vite build fails or shows errors

**Solutions:**
1. Clear Vite cache:
   ```bash
   rm -rf node_modules/.vite
   ```

2. Check for circular dependencies
3. Verify all imports are correct
4. Run `pnpm check` for TypeScript errors

---

### HMR (Hot Module Replacement) Not Working
**Symptom:** Changes don't reflect in browser

**Solutions:**
1. Check monitor shows HMR as active
2. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
3. Restart dev server
4. Check browser console for errors
5. Verify file is within `client/src` directory

---

## 🎯 Best Practices (20+ Years Experience)

### 1. **Error Handling**
```typescript
// ✅ Always handle errors properly
try {
  const data = await fetchData()
  return data
} catch (error) {
  console.error('Failed to fetch data:', error)
  // Show user-friendly error message
  toast.error('Something went wrong. Please try again.')
  return null
}

// ❌ Don't ignore errors
const data = await fetchData() // Unhandled error can crash app
```

### 2. **Type Safety**
```typescript
// ✅ Define proper types
interface User {
  id: number
  name: string
  email: string
}

async function getUser(id: number): Promise<User | null> {
  // Implementation
}

// ❌ Using 'any' defeats the purpose of TypeScript
async function getUser(id: any): Promise<any> {
  // Bad practice
}
```

### 3. **Component Organization**
```
client/src/
  components/
    ui/           # Reusable UI components (buttons, inputs)
    admin/        # Admin-specific components
    common/       # Shared business logic components
  pages/          # Route pages
  hooks/          # Custom React hooks
  lib/            # Utilities and helpers
```

### 4. **State Management**
```typescript
// ✅ Use React Query for server state
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
})

// ✅ Use useState for local UI state
const [isOpen, setIsOpen] = useState(false)

// ❌ Don't use global state for server data
// Instead, use React Query which handles caching, refetching, etc.
```

### 5. **Performance Optimization**
```typescript
// ✅ Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])

// ✅ Memoize callbacks to prevent re-renders
const handleClick = useCallback(() => {
  doSomething()
}, [])

// ✅ Use React.memo for components that rarely change
export const UserCard = memo(({ user }: Props) => {
  return <div>{user.name}</div>
})
```

### 6. **API Design (tRPC)**
```typescript
// ✅ Proper error handling in procedures
export const userRouter = router({
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const user = await ctx.db.users.findFirst({
        where: eq(users.id, input.id)
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }

      return user
    })
})
```

### 7. **Database Queries**
```typescript
// ✅ Use transactions for multiple related operations
await db.transaction(async (tx) => {
  await tx.insert(orders).values(orderData)
  await tx.insert(orderItems).values(itemsData)
})

// ✅ Select only needed fields
const users = await db
  .select({
    id: users.id,
    name: users.name,
    email: users.email
  })
  .from(users)

// ❌ Don't select all fields if you only need a few
const users = await db.select().from(users) // Wasteful
```

### 8. **Security**
```typescript
// ✅ Always validate input
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100)
})

// ✅ Use proper authentication middleware
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})

// ✅ Hash passwords properly
const hashedPassword = await bcrypt.hash(password, 10)

// ❌ NEVER store plain text passwords
// ❌ NEVER expose sensitive data in API responses
```

---

## 🐛 Debugging Strategies

### Frontend Debugging
1. **Browser DevTools**
   - Console: Check for errors and warnings
   - Network: Inspect API calls and responses
   - React DevTools: Inspect component state and props
   - Performance: Profile renders and identify bottlenecks

2. **React Query DevTools**
   ```typescript
   import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

   // Add to App component
   <ReactQueryDevtools initialIsOpen={false} />
   ```

3. **Console Logging (Strategic)**
   ```typescript
   // ✅ Use structured logging
   console.log('User data:', { userId, action: 'login', timestamp: Date.now() })

   // ✅ Use console.table for arrays
   console.table(users)

   // ❌ Don't leave debug logs in production
   ```

### Backend Debugging
1. **Server Logs**
   - Check terminal output from `pnpm dev`
   - Look for stack traces and error messages
   - Use structured logging with context

2. **Database Debugging**
   ```typescript
   // Enable query logging in development
   const db = drizzle(pool, {
     logger: process.env.NODE_ENV === 'development'
   })
   ```

3. **API Testing**
   - Use the monitor to check server health
   - Test endpoints with curl or Postman
   - Check request/response in Network tab

---

## 📊 Performance Monitoring

### Key Metrics to Watch
1. **Server Response Time** - Should be < 200ms for most requests
2. **Database Query Time** - Should be < 100ms for simple queries
3. **Frontend Bundle Size** - Keep chunks under 500KB
4. **Time to Interactive** - Should be < 3 seconds

### Using the Monitor
The development monitor shows real-time metrics:
- ✅ Green = Healthy (< 200ms response)
- ⚠️ Yellow = Slow (200-500ms response)
- 🔴 Red = Critical (> 500ms or offline)

---

## 🚨 Emergency Troubleshooting

If everything breaks:
1. **Kill all processes**
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. **Clean install**
   ```bash
   rm -rf node_modules
   rm -rf dist
   rm -rf .vite
   pnpm install
   ```

3. **Reset database (if needed)**
   ```bash
   pnpm db:push
   ```

4. **Run diagnostics**
   ```bash
   pnpm debug
   ```

5. **Start fresh**
   ```bash
   pnpm dev
   ```

---

## 🎓 Additional Resources

### Project Architecture
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Express + tRPC
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Custom JWT with bcrypt
- **Payments**: Stripe
- **Styling**: Tailwind CSS + Radix UI

### Key Files
- [vite.config.ts](vite.config.ts) - Frontend build configuration
- [server/_core/index.ts](server/_core/index.ts) - Server entry point
- [server/routers.ts](server/routers.ts) - API routes
- [drizzle/schema.ts](drizzle/schema.ts) - Database schema

---

## 💡 Pro Tips

1. **Always run the monitor** - It catches issues early
2. **Run debug before committing** - Prevents broken commits
3. **Use TypeScript strictly** - It saves debugging time
4. **Test in different browsers** - Chrome, Firefox, Safari
5. **Keep dependencies updated** - Run `pnpm update` monthly
6. **Write tests for critical flows** - Prevents regressions
7. **Use meaningful variable names** - Future you will thank you
8. **Comment complex logic** - Explain the "why", not the "what"
9. **Break down large components** - Easier to debug and reuse
10. **Profile before optimizing** - Don't guess, measure

---

## 📞 Getting Help

If you're stuck:
1. Run `pnpm debug` and check the output
2. Check the browser console for frontend errors
3. Check the terminal for backend errors
4. Review this guide for common solutions
5. Check git history for recent changes that might have caused issues

---

**Remember:** Good code is code that works reliably, is easy to understand, and easy to maintain. Take the time to do it right the first time!
