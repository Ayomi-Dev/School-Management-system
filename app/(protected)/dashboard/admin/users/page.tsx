'use client';

import { useState, useMemo } from 'react';
import { useUsersList, useCreateUserMutation, useDeleteUserMutation, useUpdateUserMutation } from '@/src/hooks/queries/useAdmin';
import { Card } from '@/src/components/ui/Card';
import { DataTable } from '@/src/components/ui/DataTable';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Loader } from '@/src/components/ui/Loader';
import { useDebounce } from '@/src/hooks/useUtils';
import { Edit2, Trash2, Plus } from 'lucide-react';
import CreateUserModal from './components/CreateUserModal';
import EditUserModal from './components/EditUserModal';
import { Role } from './components/modalHelpers';
import { User } from '@/src/types';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';


export default function UsersPage() { 
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roleFilter = (searchParams.get('type') as Role | null) ?? 'ALL';
  // const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  

  const debouncedSearch = useDebounce(search, 300);
  const deleteUserMutation = useDeleteUserMutation();


  const setRoleFilter = (role: Role | 'ALL') => { //role setter to push  Sslectedroles to URL
    const params = new URLSearchParams(searchParams.toString());
    if (role === 'ALL') {
      params.delete('type');
    } else {
      params.set('type', role);
    }
    params.delete('page'); // reset page on filter change
    router.push(`${pathname}?${params.toString()}`);
    setPage(1);
  };

  const { data: usersData, isLoading } = useUsersList({
    role: roleFilter === 'ALL' ? undefined : roleFilter,
    search: debouncedSearch,
    page,
    limit: 10,
  });  

  const users = useMemo(() => usersData?.data || [], [usersData]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(id);
    }
  };

  const roles: Role[] = ['STUDENT', 'TEACHER', 'PARENT', 'BURSAR'];

  const statusColor = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all users in the system</p>
        </div>
        <Button
          variant="primary"
          className="flex items-center gap-2"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={18} />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-64"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setRoleFilter('ALL'); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              roleFilter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => { setRoleFilter(role); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                roleFilter === role
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {role.charAt(0) + role.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>
      

      {/* Users Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader />
          </div>
        ) : (
          <>
            <DataTable<User>
              data={users?.data}
              columns={[
                {
                  key: 'firstName',
                  label: 'Name',
                  render: (value, row) => (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {row.firstName?.[0]}{row.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium">{row.firstName} {row.lastName}</p>
                        <p className="text-xs text-gray-500">{row.email}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'email',
                  label: 'Email',
                  render: (value) => <span className="text-sm">{value}</span>,
                },
                {
                  key: 'role',
                  label: 'Role',
                  render: (value) => (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {(value as string).charAt(0).toUpperCase() + (value as string).slice(1).toLowerCase()}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (value) => (
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColor(value as string)}`}>
                      {value as string}
                    </span>
                  ),
                },
                {
                  key: 'phone',
                  label: 'Phone',
                  render: (value) => <span>{value || '-'}</span>,
                },
              ]}
              rowActions={(row) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(row)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit user"
                  >
                    <Edit2 size={18} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(row.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete user"
                  >
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>
              )}
              isEmpty={users.length === 0}
              emptyMessage="No users found"
            />
          </>
        )}
      </Card>
        
      {/* Pagination */}
      {users?.data?.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {page} • Showing {users.length} users
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(usersData?.data?.total / 10)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateUserModal
          open={isCreateModalOpen}
          onOpenChange={() => setIsCreateModalOpen(false)}
          onSuccess={() => setIsCreateModalOpen(false)}
        />
      )}

      {isEditModalOpen && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}
