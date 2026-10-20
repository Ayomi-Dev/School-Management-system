export enum Role {
  SUPER_ADMIN,
  ADMIN,
  TEACHER,
  STUDENT,
  PARENT,
  BURSAR,
}

export enum UserStatus {
  ACTIVE,
  INACTIVE,
  SUSPENDED,
  PENDING
}

export enum TokenType {
  REFRESH,
  SET_UP,
  VERIFICATION,
  PASSWORD_RESET
}

export enum ClassLevel {
  CRECHE,
  NURSERY1,
  NURSERY2,
  PRIMARY1,
  PRIMARY2,
  PRIMARY3,
  PRIMARY4,
  PRIMARY5,
  PRIMARY6,
  JSS1,
  JSS2,
  JSS3,
  SS1,
  SS2,
  SS3
}

export enum Department {
  ART,
  COMMERCIAL,
  SCIENCE
}

export enum Gender {
  MALE,
  FEMALE
}

export enum AttendanceStatus {
  PRESENT,
  ABSENT,
  LATE,
  UNMARKED
}

export enum TermPeriod {
  FIRST,
  SECOND,
  THIRD
}

export enum StudentStatus {
  ACTIVE,
  GRADUATED,
  TRANSFERRED,
  SUSPENDED,
  WITHDRAWN
}

export enum ReportCardStatus {
  DRAFT,
  PUBLISHED
}

export enum PaymentMethod {
  CASH,
  BANK_TRANSFER,
  POS,
  ONLINE
}

export enum NotificationChannel {
  IN_APP,
  EMAIL,
  SMS
}

export enum NotificationEventType {
  STUDENT_ABSENT,
  GRADE_PUBLISHED,
  REPORT_CARD_PUBLISHED,
  FEE_PAYMENT_RECORDED,
  FEE_REMINDER,
  ANNOUNCEMENT,
  OTP_SENT
}

export enum AnnouncementTarget {
  SCHOOL,
  CLASS,
  INDIVIDUAL
}
export enum EmployeeType {
  FULL_TIME,
  PART_TIME
}

export enum Relationship {
  MOTHER,
  FATHER,
  GUARDIAN
}
export enum PaymentStatus {
  PAID,
  NOT_PAID,
  PARTIAL,
  WAIVED
}
export enum DayOfWeek {
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY
}