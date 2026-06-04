# Admin Dashboard Documentation

## Overview

This comprehensive admin dashboard follows clean architecture principles with feature-based folder structure, separation of concerns, and production-ready code.

## Architecture

```
src/
├── components/
│   ├── layouts/           # Layout components (Sidebar, Topbar, DashboardLayout)
│   ├── ui/               # Base UI components (Card, DataTable, Button, etc.)
│   └── forms/            # Form components
├── hooks/
│   └── queries/          # TanStack Query hooks for admin features
├── services/
│   └── client/           # API service for admin operations
└── stores/               # Zustand stores for global state

app/(protected)/dashboard/admin/
├── layout.tsx            # Admin layout wrapper
├── page.tsx              # Dashboard overview
├── users/                # User management feature
├── classes/              # Classes management feature
├── subjects/             # Subjects management feature
├── sessions/             # Academic sessions management
├── timetable/            # Timetable management
├── reports/              # Reports feature
│   ├── academic/         # Academic reports
│   ├── financial/        # Financial reports (ready to implement)
│   └── attendance/       # Attendance reports (ready to implement)
└── settings/             # System settings
```

## Features Implemented

### 1. Layout System

**Components:**
- `Sidebar.tsx` - Role-specific navigation with collapsible menu
- `Topbar.tsx` - User info, notifications, profile dropdown
- `DashboardLayout.tsx` - Main layout wrapper

**Features:**
- Responsive design (mobile-first)
- Collapsible sidebar on mobile
- Quick navigation with breadcrumbs support
- User profile dropdown with logout

### 2. Admin Dashboard Overview

**File:** `app/(protected)/dashboard/admin/page.tsx`

**Features:**
- Key metrics cards (Students, Teachers, Revenue, Classes)
- Quick action buttons linking to features
- System health status
- Recent activity feed

**Components:**
- `MetricCard` - Shows key metrics with trends
- `Card` - Reusable container component
- `Loader` - Loading skeleton

### 3. User Management

**Files:**
- `app/(protected)/dashboard/admin/users/page.tsx` - Main users list
- `app/(protected)/dashboard/admin/users/components/CreateUserModal.tsx` - Create user form
- `app/(protected)/dashboard/admin/users/components/EditUserModal.tsx` - Edit user form

**Features:**
- List all users with filters (role, status, search)
- Create new users (multi-step form)
- Edit existing users
- Delete users with confirmation
- Pagination support
- Real-time search with debounce

**API Hooks:**
- `useUsersList()` - Fetch users list
- `useCreateUserMutation()` - Create user
- `useUpdateUserMutation()` - Update user
- `useDeleteUserMutation()` - Delete user

### 4. Classes Management

**File:** `app/(protected)/dashboard/admin/classes/page.tsx`

**Features:**
- Grid view of all classes
- Class details (name, level, teacher, capacity)
- Filter by academic year
- Create new classes
- Edit/delete classes
- Student count display

**Components:**
- Class card with hover effects
- Academic year filter
- Action buttons for edit/delete

### 5. Subjects Management

**File:** `app/(protected)/dashboard/admin/subjects/page.tsx`

**Features:**
- Table view of all subjects
- Subject details (name, code, description)
- Search functionality with debounce
- Create new subjects
- Edit/delete subjects

**Form Validation:**
- Subject name (required)
- Subject code (optional)
- Description (optional)

### 6. Academic Sessions/Terms Management

**File:** `app/(protected)/dashboard/admin/sessions/page.tsx`

**Features:**
- Create academic years with date range
- Set active academic year
- View terms within each academic year
- Add/remove terms
- Date validation (start < end)

**Components:**
- `CreateAcademicYearModal` - Form for creating academic years
- Academic year cards with term management

### 7. Timetable Management

**File:** `app/(protected)/dashboard/admin/timetable/page.tsx`

**Features:**
- Weekly timetable grid view
- Class selector
- Time slots (8:00 - 16:00)
- Add timetable slots
- View subject, teacher, room info
- Visual indicators for scheduled vs available slots

**Components:**
- `CreateTimetableSlotModal` - Add timetable slot form
- Timetable grid with day/time slots

### 8. Reports

**Files:**
- `app/(protected)/dashboard/admin/reports/page.tsx` - Reports home
- `app/(protected)/dashboard/admin/reports/academic/page.tsx` - Academic reports

**Report Types:**
1. **Academic Reports**
   - Class-wise performance
   - Student-wise grades
   - Average scores and pass rates
   - Top performers

2. **Financial Reports** (ready to implement)
   - Revenue tracking
   - Fee collection
   - Expenses

3. **Attendance Reports** (ready to implement)
   - Student attendance
   - Staff attendance
   - Monthly trends

**Features:**
- Date range filtering
- Export to CSV
- Recent reports tracking

### 9. System Settings

**File:** `app/(protected)/dashboard/admin/settings/page.tsx`

**Settings Categories:**
- School Information (name, email, phone)
- Academic Settings (class capacity, attendance threshold)
- Role & Permissions management
- Notification Settings
- Backup & Data Export

## Component Library

### UI Components

1. **Card** (`src/components/ui/Card.tsx`)
   ```typescript
   <Card>
     <h3>Content</h3>
   </Card>
   
   <MetricCard
     label="Total Students"
     value={150}
     icon="🎓"
     color="blue"
     trend={{ value: 5, isPositive: true }}
   />
   ```

2. **DataTable** (`src/components/ui/DataTable.tsx`)
   ```typescript
   <DataTable
     data={users}
     columns={[
       { key: 'name', label: 'Name' },
       { key: 'email', label: 'Email' }
     ]}
     rowActions={(row) => <button>Edit</button>}
   />
   ```

3. **Button** (`src/components/ui/Button.tsx`)
   ```typescript
   <Button variant="primary" size="sm">
     Click Me
   </Button>
   ```

4. **Input** (`src/components/ui/Input.tsx`)
   ```typescript
   <Input
     placeholder="Enter name"
     error="Name is required"
   />
   ```

## Hooks & Services

### API Service

**File:** `src/services/client/admin.ts`

```typescript
// Usage
const response = await adminService.getUsers({ role: 'STUDENT', page: 1 });
const newUser = await adminService.createUser(userData);
```

### Query Hooks

**File:** `src/hooks/queries/useAdmin.ts`

```typescript
// Usage
const { data: users, isLoading } = useUsersList({ role: 'STUDENT' });
const createMutation = useCreateUserMutation();

await createMutation.mutateAsync({
  email: 'user@school.com',
  firstName: 'John',
  // ...
});
```

## State Management

### Global State
- **AuthStore** - User authentication and roles (Zustand)
- **UIStore** - Modal states, sidebar toggle (Zustand)

### Server State
- **TanStack Query** - All data fetching and caching
- **Query Keys** - Organized in `useAdmin.ts`

### Form State
- **React Hook Form** - All form handling
- **Zod** - Validation schemas

## Styling

- **Tailwind CSS** - Utility-first styling
- **Color Scheme:**
  - Primary: Blue (blue-600)
  - Success: Green (green-600)
  - Warning: Orange (orange-600)
  - Danger: Red (red-600)

## Responsive Design

- Mobile-first approach
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px)
- Sidebar collapses on mobile
- Tables become scrollable on small screens
- Grids adjust from 1 column on mobile to 2-4 columns on desktop

## Adding New Features

### 1. Create Feature Folder
```
app/(protected)/dashboard/admin/[feature-name]/
├── page.tsx
└── components/
    ├── Create[Feature]Modal.tsx
    └── Edit[Feature]Modal.tsx
```

### 2. Create API Service
```typescript
// Add to src/services/client/admin.ts
export const adminService = {
  getFeature: () => client.get('/api/admin/feature'),
  createFeature: (data) => client.post('/api/admin/feature', data),
  // ...
};
```

### 3. Create Query Hooks
```typescript
// Add to src/hooks/queries/useAdmin.ts
export const useFeatureList = () => {
  return useQuery({
    queryKey: queryKeys.feature(),
    queryFn: () => adminService.getFeature(),
  });
};
```

### 4. Create Feature Page
```typescript
'use client';

export default function FeaturePage() {
  const { data, isLoading } = useFeatureList();
  // Implementation
}
```

## Best Practices

1. **Always use query hooks** for data fetching
2. **Validate forms** with Zod schemas
3. **Show loading states** with Loader or Skeleton
4. **Handle errors** with toast notifications
5. **Debounce search** to avoid excessive API calls
6. **Use TypeScript** with strict mode
7. **Memoize expensive computations** with useMemo
8. **Split large components** into smaller ones
9. **Keep modals small** and focused
10. **Test all user flows** before deployment

## API Endpoints (Backend Integration)

```
GET    /api/admin/stats              - Dashboard metrics
GET    /api/admin/users              - List users
POST   /api/admin/create-user        - Create user
PUT    /api/admin/users/:id          - Update user
DELETE /api/admin/users/:id          - Delete user

GET    /api/admin/classes            - List classes
POST   /api/admin/classes            - Create class
PUT    /api/admin/classes/:id        - Update class
DELETE /api/admin/classes/:id        - Delete class

GET    /api/admin/subjects           - List subjects
POST   /api/admin/subjects/create    - Create subject
PUT    /api/admin/subjects/:id       - Update subject
DELETE /api/admin/subjects/:id       - Delete subject

GET    /api/admin/academic-years     - List academic years
POST   /api/admin/academic-years     - Create academic year
PUT    /api/admin/academic-years/:id - Update academic year

GET    /api/admin/timetable          - Get timetable
POST   /api/admin/timetable          - Create timetable slot
PUT    /api/admin/timetable/:id      - Update timetable slot
DELETE /api/admin/timetable/:id      - Delete timetable slot

GET    /api/admin/reports/academic   - Academic reports
GET    /api/admin/reports/financial  - Financial reports
GET    /api/admin/reports/attendance - Attendance reports

GET    /api/admin/settings           - Get settings
PUT    /api/admin/settings           - Update settings
```

## Next Steps

To complete the dashboard for other roles:

1. **Teacher Dashboard** - Own classes, subjects, assignments
2. **Student Dashboard** - Grades, attendance, schedule
3. **Parent Dashboard** - Child's progress, fees
4. **Bursar Dashboard** - Fee management, reports

Each dashboard should follow the same architecture pattern with role-specific features.

## Production Checklist

- [ ] All API endpoints implemented
- [ ] Form validation tested
- [ ] Error handling tested
- [ ] Loading states working
- [ ] Responsive design tested on mobile
- [ ] Accessibility (WCAG) compliance
- [ ] Performance optimized (lazy loading, code splitting)
- [ ] Security checks (CSRF, XSS, SQL injection)
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Documentation complete
- [ ] Staging environment tested
