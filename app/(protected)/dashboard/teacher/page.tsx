"use client"

import { useProfileStore } from '@/src/stores/profileStore'
import React from 'react'

const TeacherDashboardPage = () => {
  const { profile } = useProfileStore()
  return (
    <div>TeacherDashboardPage</div>
  )
}

export default TeacherDashboardPage