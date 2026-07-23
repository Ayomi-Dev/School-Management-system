export const USER_SELECT = { //Defines a reusable selection set for Prisma queries involving the User model. By centralizing this selection, we ensure consistency across the codebase and can easily modify which fields are retrieved from the database in one place if needed.
  id:                 true,
  email:              true,
  passwordHash:       true,
  role:               true,
  schoolId:           true,
  status:             true,
  isActive:           true,
  mustChangePassword: true,
  failedLoginCount:   true,
  lockedUntil:        true,
  firstName:          true,
  lastName:           true,
  userCode:           true,
  lastLoginAt: true
} as const;

export const SLOT_SELECT = {
  id:        true,
  classId:   true,
  dayOfWeek: true,
  startTime: true,
  endTime:   true,
  room:      true,
  subject: { select: { id: true, name: true, code: true } },
  teacher: {
    select: {
      id:   true,
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  },
} as const;
 