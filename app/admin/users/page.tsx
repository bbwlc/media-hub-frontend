import { redirect } from 'next/navigation'
import { getMe } from '@/app/actions'
import { getAllUsers } from './actions'
import UserStatusManager from './UserStatusManager'

export default async function AdminUsersPage() {
  const me = await getMe()

  if (me.role !== 'ROLE_ADMIN') redirect('/')

  const users = await getAllUsers()

  return <UserStatusManager users={users} />
}