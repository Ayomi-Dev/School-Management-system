"use client"

import { Button } from '@/src/components/ui/Button'
import { useLogoutMutation } from '@/src/hooks/queries/useAuth'
import { useAuth } from '@/src/hooks/useAuth'
import { useRouter } from 'next/navigation'




const StudentDashboard = () => {
    const router = useRouter()
    const logoutMutation = useLogoutMutation()
    const { logout, user} = useAuth()
    console.log( user )
    if(!user){
        router.replace('/auth/refresh-session')
    }
    
    const handleLogout = async() => {
        logout()
        await logoutMutation.mutateAsync();
        router.replace('/auth/login')
    }
  return (
    <>
            <div>This is {user?.role} StudentDashboard</div>
            <Button variant='primary' size='sm' onClick={handleLogout}>
                Logout
            </Button>
        </>
  )
}

export default StudentDashboard