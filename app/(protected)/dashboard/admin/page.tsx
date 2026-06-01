"use client"

import { Button } from '@/src/components/ui/Button'
import { useLogoutMutation } from '@/src/hooks/queries/useAuth'
import { useAuth } from '@/src/hooks/useAuth'
import { useRouter } from 'next/navigation'

const page = () => {
    const logoutMutation = useLogoutMutation()
    const router = useRouter()
    const { logout, user} = useAuth()

    const handleLogout = async() => {
        logout()
        await logoutMutation.mutateAsync();
        router.replace('/auth/login')
    }
  return (
    <>
        <div>This is {user?.role}</div>
        <Button variant='primary' size='sm' onClick={handleLogout}>
            Logout
        </Button>
    </>
    
  )
}

export default page