# Student Creation Form - Practical Flow

## How the Client Actually Works

### 1. Form Component Example (React/Next.js)

```tsx
// app/admin/students/create/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Guardian {
  id: string
  firstName: string
  lastName: string
  phone: string
}

export default function CreateStudentForm() {
  const router = useRouter()
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'MALE',
    level: 'PRIMARY1',
    dateOfBirth: '',
    phone: '',
    parentUserId: '', // Selected parent ID
    guardianUserIds: [], // Selected additional guardians
    stateOfOrigin: '',
    previousSchool: ''
  })

  // 1. Fetch available parents/guardians on component mount
  useEffect(() => {
    const fetchGuardians = async () => {
      try {
        const res = await fetch('/api/admin/guardians')
        const data = await res.json()
        setGuardians(data.guardians)
      } catch (error) {
        console.error('Failed to fetch guardians:', error)
      }
    }
    fetchGuardians()
  }, [])

  // 2. Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 3. Handle parent selection (single select)
  const handleParentSelect = (guardianId: string) => {
    setFormData(prev => ({
      ...prev,
      parentUserId: guardianId
    }))
  }

  // 4. Handle additional guardians (multi-select)
  const handleGuardianToggle = (guardianId: string) => {
    setFormData(prev => {
      const current = prev.guardianUserIds
      return {
        ...prev,
        guardianUserIds: current.includes(guardianId)
          ? current.filter(id => id !== guardianId)
          : [...current, guardianId]
      }
    })
  }

  // 5. Submit form to API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'STUDENT',
          ...formData
        })
      })

      if (res.ok) {
        router.push('/admin/students')
      } else {
        const error = await res.json()
        console.error('Creation failed:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleInputChange}
          required
        />
      </div>

      {/* Gender & Level */}
      <div className="grid grid-cols-2 gap-4">
        <select name="gender" value={formData.gender} onChange={handleInputChange}>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
        <select name="level" value={formData.level} onChange={handleInputChange} required>
          <option value="">Select Level</option>
          <option value="CRECHE">Creche</option>
          <option value="PRIMARY1">Primary 1</option>
          <option value="PRIMARY2">Primary 2</option>
          {/* ... more levels */}
        </select>
      </div>

      {/* Parent Selection - SINGLE SELECT */}
      <div>
        <label className="block text-sm font-medium mb-2">Primary Parent</label>
        <select
          value={formData.parentUserId}
          onChange={(e) => handleParentSelect(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Select a parent (optional)</option>
          {guardians.map(guardian => (
            <option key={guardian.id} value={guardian.id}>
              {guardian.firstName} {guardian.lastName} ({guardian.phone})
            </option>
          ))}
        </select>
      </div>

      {/* Additional Guardians - MULTI-SELECT */}
      <div>
        <label className="block text-sm font-medium mb-2">Additional Guardians</label>
        <div className="space-y-2 border rounded p-3">
          {guardians.map(guardian => (
            <label key={guardian.id} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.guardianUserIds.includes(guardian.id)}
                onChange={() => handleGuardianToggle(guardian.id)}
                className="mr-2"
              />
              {guardian.firstName} {guardian.lastName} ({guardian.phone})
            </label>
          ))}
        </div>
      </div>

      {/* Other fields... */}
      <input
        type="date"
        name="dateOfBirth"
        value={formData.dateOfBirth}
        onChange={handleInputChange}
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Creating...' : 'Create Student'}
      </button>
    </form>
  )
}
```

---

## Data Flow Visualization

```
┌─────────────────────────────────────────────────────────┐
│ Form Page Loads                                         │
│ useEffect → fetch /api/admin/guardians                │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ Response: [                                             │
│   { id: "uuid-123", firstName: "Jane", lastName: "Doe" │
│   { id: "uuid-456", firstName: "John", lastName: "Doe" │
│ ]                                                       │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ Render Dropdowns/Checkboxes with Guardian Options      │
│ - Select dropdown for parentUserId (single)             │
│ - Checkboxes for guardianUserIds (multiple)             │
└────────────┬────────────────────────────────────────────┘
             │ User clicks checkbox/selects option
             │ silently updates formData state
             ▼
┌─────────────────────────────────────────────────────────┐
│ User Submits Form                                       │
│ formData now contains:                                  │
│ {                                                       │
│   role: 'STUDENT',                                      │
│   firstName: 'John',                                    │
│   lastName: 'Doe',                                      │
│   parentUserId: 'uuid-123',  ← Selected from dropdown   │
│   guardianUserIds: ['uuid-456', 'uuid-789']  ← Checked  │
│   ...otherFields                                        │
│ }                                                       │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ POST /api/admin with JSON body                          │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ admin.service.ts provisionUser()                        │
│ - Validates schema                                      │
│ - Creates user + guardians links                        │
│ - Creates enrollment                                    │
│ - Creates fee balances                                  │
└─────────────────────────────────────────────────────────┘
```

---

## What You Need to Implement

### 1. **API Endpoint to Fetch Guardians** (Missing!)

You need to create `/api/admin/guardians` endpoint:

```tsx
// app/api/admin/guardians/route.ts
import { requireSchoolAdmin } from "@/src/lib/middleware/requireRole";
import { prisma } from "@/src/lib/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
    const auth = await requireSchoolAdmin(req);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Fetch all guardians in the school
    const guardians = await prisma.guardian.findMany({
        where: {
            user: { schoolId: auth.schoolId }
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true
        }
    });

    return NextResponse.json({ guardians });
};
```

### 2. **Data Flow in the Service**

When form submits with:
```json
{
  "parentUserId": "abc-123",
  "guardianUserIds": ["def-456", "ghi-789"]
}
```

The `adminServices.provisionUser()` receives this in `userInput`:
- Checks `userInput.parentUserId` → looks up guardian by userId
- Checks `userInput.guardianUserIds` → looks up multiple guardians
- Creates GuardianStudent links atomically in transaction

---

## Summary

**The ID flow is:**
1. **Form loads** → fetches guardians list
2. **User selects** → state captures IDs (silently)
3. **Form submits** → IDs go to API as `parentUserId` and `guardianUserIds`
4. **Backend** → looks up Guardian records by those IDs and creates links

The parent/guardian never sees or types a UUID—they just click a name!
