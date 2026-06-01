# School Management System - Frontend Architecture

## Overview

This is a production-grade React/Next.js frontend for the School Management System, built with modern best practices and a clean, scalable architecture.

## Key Technologies

- **Next.js 16** - App Router, React 19
- **TypeScript** - Strict mode for type safety
- **React Hook Form** - Performant form state management
- **Zod** - Schema validation
- **TanStack Query (React Query)** - Server state management with caching
- **Zustand** - Lightweight client state management
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client with interceptors
- **React Hot Toast** - Toast notifications

## Architecture Layers

### 1. **Configuration Layer** (`src/config/`)
- `api.ts` - Axios instance with interceptors for cookie-based authentication
- `constants.ts` - API endpoints, validation rules, error messages

**Key Points:**
- Uses `withCredentials: true` to automatically send/receive httpOnly cookies
- Access tokens are managed by **httpOnly cookies** (set by backend)
- Refresh token logic handled transparently via interceptors

### 2. **Authentication & Session** (`src/lib/auth/`, `src/stores/`)

**Authentication Flow:**
1. User logs in with email/password or user code
2. Backend validates credentials and sets httpOnly cookies:
   - `access_token` (15-min expiry)
   - `refresh_token` (7-day expiry, hashed in DB)
3. Frontend receives only the user object
4. Axios automatically includes cookies in all requests
5. If access token expires (401), axios interceptor calls `/api/auth/refresh`
6. Backend issues new access token cookie
7. Request retries with new token

**Frontend only stores:**
- User object (name, role, email, etc.)
- Loading/error states
- No tokens in localStorage

### 3. **API Service Layer** (`src/services/client/`)
- `auth.ts` - Login, logout, password reset, account setup
- `school.ts` - School management (Super Admin)
- `user.ts` - User CRUD and search
- `academic.ts` - Classes, academic years, terms
- `student.ts` - Students, parents

**Pattern:**
```typescript
export const authService = {
  login: (credentials) => client.post(endpoint, credentials),
  logout: () => client.post(endpoint),
  // ...
};
```

### 4. **State Management**

#### Zustand Stores (`src/stores/`)

**AuthStore** - User authentication state
- `user` - Current logged-in user
- `isLoading` - Loading state for async operations
- `error` - Error messages
- Actions: `setUser()`, `clearAuth()`, `logout()`

```typescript
const { user, isLoading, logout } = useAuthStore();
```

**UIStore** - Global UI state
- Modals, filters, notifications, sidebar, theme
- Auto-opens/closes modals, manages notifications

```typescript
const { openModal, closeModal } = useUIStore();
```

**FormStore** - Form draft persistence
- Saves form data to localStorage for recovery

#### TanStack Query (`src/hooks/queries/`)

Server-side caching with automatic refetching, invalidation, and synchronization.

**Query Hooks:**
```typescript
useSchoolsList(page, limit)        // Fetch schools
useCreateSchoolMutation()          // Create school + toast + invalidate
useClassesList(schoolId)           // Fetch classes
useUsersList(schoolId, filters)    // Fetch users with search
```

**Key Features:**
- Automatic caching (5 min stale time)
- Background refetch on window focus
- Optimistic updates on mutations
- Error handling with toasts
- Query invalidation on success

### 5. **Custom Hooks** (`src/hooks/`)

**useAuth** - Authentication state and helpers
```typescript
const { user, isAuthenticated, logout } = useAuth();
```

**useAuthGuard** - Protected routes
```typescript
const isProtected = useAuthGuard('/auth/login');
```

**useRole** - Role-based access control
```typescript
const canAccess = useRole(['ADMIN', 'TEACHER']);
```

**useToast** - Notifications
```typescript
const { success, error } = useToast();
success('Created successfully');
```

**useDebounce** - Debounced values (search)
```typescript
const debouncedSearch = useDebounce(searchInput, 300);
```

**useAsync** - Generic async state
```typescript
const { data, loading, error } = useAsync(fetchFn);
```

### 6. **UI Components** (`src/components/`)

**UI Components** (`ui/`)
- `Button.tsx` - Variants: primary, secondary, outline, ghost, destructive
- `Input.tsx` - Text inputs with error states
- `Skeleton.tsx` - Loading placeholders
- `Loader.tsx` - Spinner component
- `Badge.tsx`, `EmptyState.tsx` - Status indicators

**Form Components** (`forms/`)
- `FormInput.tsx` - Controlled input with React Hook Form
- `FormSelect.tsx` - Controlled dropdown

These integrate with `useController()` for automatic form state management.

**Usage:**
```typescript
<FormInput
  control={control}
  name="email"
  label="Email"
  type="email"
  required
/>
```

### 7. **Providers** (`src/providers/`)

**AppProvider** - Root wrapper
- Wraps QueryProvider (TanStack Query)
- Sets up React Hot Toast
- Manages theme

```typescript
// app/layout.tsx
<AppProvider>
  {children}
</AppProvider>
```

### 8. **Type System** (`src/types/`)

**api.ts** - Request/response types
- `LoginRequest`, `LoginResponse`, `User`, `School`, `Class`, etc.
- All types inferred from backend response structure

**ui.ts** - Component prop types
- `ButtonProps`, `InputProps`, `DataTableProps`, etc.

**store.ts** - Store type definitions
- `AuthStore`, `UIStore`, `FormStore`

## Usage Examples

### Login Flow
```typescript
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userLoginSchema } from '@/src/validators/userLoginSchema';
import { useLoginMutation } from '@/src/hooks/queries/useAuth';

export default function LoginPage() {
  const loginMutation = useLoginMutation();
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(userLoginSchema),
  });

  const onSubmit = async (data) => {
    await loginMutation.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput control={control} name="email" label="Email" />
      <FormInput control={control} name="password" type="password" label="Password" />
      <Button type="submit" loading={loginMutation.isPending}>
        Sign In
      </Button>
    </form>
  );
}
```

### Create Resource with Loading State
```typescript
const useCreateClassMutation = () => {
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data) => classService.create(data),
    onSuccess: () => {
      success('Class created');
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
    },
    onError: (err) => {
      error(err?.error || 'Failed to create');
    },
  });
};
```

### Protected Page
```typescript
export default function AdminPage() {
  const isAuthenticated = useAuthGuard();
  
  if (!isAuthenticated) return null;

  return <div>Admin Dashboard</div>;
}
```

## Authentication Details

### How It Works

1. **Login Request**
   ```
   POST /api/auth/login
   Body: { email: "user@school.com", password: "..." }
   Response: { user: {...} }
   ```

2. **Backend Sets Cookies**
   ```
   Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Lax; MaxAge=900
   Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Lax; Path=/api/auth/refresh
   ```

3. **Frontend Stores User**
   - Only user object stored in Zustand
   - Cookies automatically sent by browser

4. **Token Refresh**
   - If access token expires, backend returns 401
   - Axios interceptor calls `POST /api/auth/refresh`
   - Backend validates refresh token and issues new access token
   - Request retries with new token

5. **Logout**
   - Clear user from store
   - Frontend doesn't need to clear cookies (httpOnly)
   - Backend invalidates refresh token

## Best Practices

### Form Handling
- Use React Hook Form + Zod for validation
- Validate on submit, not on change (better UX)
- Show validation errors inline
- Use debounce for async validation (email uniqueness)

### Data Fetching
- Use TanStack Query hooks (auto-caching)
- Invalidate queries on mutation success
- Show skeletons instead of spinners
- Handle errors with toasts

### State Management
- Global state: Zustand (auth, UI)
- Server state: TanStack Query (data)
- Form state: React Hook Form (forms)
- Avoid prop drilling with stores

### Performance
- Code split pages with Next.js dynamic imports
- Memoize expensive components
- Debounce search inputs
- Virtualize long lists
- Prefetch on route hover

## Project Structure

```
src/
├── components/
│   ├── ui/           # Base UI components
│   ├── forms/        # Form components
│   ├── layouts/      # Page layouts
│   ├── nav/          # Navigation
│   ├── modals/       # Modal dialogs
│   └── table/        # Table components
├── config/
│   ├── api.ts        # Axios setup
│   └── constants.ts  # Endpoints, messages
├── hooks/
│   ├── queries/      # TanStack Query hooks
│   ├── useAuth.ts
│   ├── useToast.ts
│   └── useUtils.ts
├── lib/
│   ├── queryClient.ts
│   ├── auth/
│   └── prisma/
├── providers/
│   ├── AppProvider.tsx
│   └── QueryProvider.tsx
├── services/
│   ├── client/       # Axios API services
│   └── auth/         # Backend services (existing)
├── stores/
│   ├── authStore.ts
│   ├── uiStore.ts
│   └── formStore.ts
├── types/
│   ├── api.ts
│   ├── ui.ts
│   └── store.ts
├── utils/
│   ├── validation.ts
│   └── helpers.ts
└── validators/       # Zod schemas (existing)

app/
├── layout.tsx        # Root layout with providers
├── page.tsx
├── auth/
│   └── login/        # Login page
├── admin/            # Admin pages
├── teacher/          # Teacher pages
├── student/          # Student pages
└── super-admin/      # Super admin pages
```

## Development

### Start Dev Server
```bash
npm run dev
```

### Run Linter
```bash
npm run lint
```

### Build
```bash
npm run build
npm start
```

## Notes

- All HTTP requests automatically include cookies
- Tokens are never stored in localStorage
- Session automatically refreshes on token expiry
- Logout clears user state (cookies managed by browser)
- Forms use controlled inputs with React Hook Form
- All async operations use TanStack Query for caching
