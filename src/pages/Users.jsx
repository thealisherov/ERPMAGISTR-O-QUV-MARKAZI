import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users.api';
import { useAuth } from '../hooks/useAuth';
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiX, FiEye, FiEyeOff, FiSearch, FiMail, FiPhone } from 'react-icons/fi';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { parseDeleteError } from '../utils/errorParser';
import toast from 'react-hot-toast';

/**
 * Users Page - Backend bilan 100% mos
 * 
 * Backend UserDTO: { id, email, fullName, phone, role, active }
 * Backend UserRole: ADMIN | TEACHER | STUDENT
 * 
 * Permissions:
 * - ADMIN: Can view/create/edit/delete all users
 * - TEACHER: Can only view users
 */

const Users = () => {
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, userId: null, userName: '' });
  const queryClient = useQueryClient();

  const isAdmin = currentUser?.role === 'ADMIN';

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await usersApi.getAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Foydalanuvchi muvaffaqiyatli yaratildi');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Foydalanuvchi yangilandi');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.refetchQueries({ queryKey: ['users'] });
      toast.success("Foydalanuvchi o'chirildi");
    },
    onError: (error) => {
      console.error('Delete error:', error);
      const msg = parseDeleteError(error, 'Foydalanuvchi');
      toast.error(msg, { duration: 7000 });
      alert(msg);
    },
  });

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user) => {
    setDeleteConfirm({ open: true, userId: user.id, userName: user.fullName || 'Nomsiz' });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(deleteConfirm.userId);
    setDeleteConfirm({ open: false, userId: null, userName: '' });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'TEACHER':
        return 'bg-green-100 text-green-800';
      case 'STUDENT':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = (users || []).filter(user =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Foydalanuvchilar</h1>
          <p className="text-gray-600 mt-1">Tizim foydalanuvchilari</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <FiPlus />
            <span>Yangi foydalanuvchi</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Qidirish (ism, email, telefon)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
        </div>
      </div>

      {usersLoading ? (
        <div className="text-center py-12 text-gray-500">Yuklanmoqda...</div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="block sm:hidden space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Foydalanuvchilar topilmadi</div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FiUser className="text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{user.fullName || 'Nomsiz'}</h3>
                        <p className="text-xs text-gray-500">ID: {user.id}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 mb-3">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <FiMail className="text-gray-400 flex-shrink-0" /> <span className="truncate">{user.email}</span>
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <FiPhone className="text-gray-400 flex-shrink-0" /> {user.phone || '-'}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex justify-end gap-2 border-t pt-3">
                      <button
                        onClick={() => handleEdit(user)}
                        className="cursor-pointer p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <FiEdit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="cursor-pointer p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Foydalanuvchi</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Aloqa</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amallar</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-gray-500">Foydalanuvchilar topilmadi</td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <FiUser className="text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.fullName || 'Nomsiz'}</p>
                              <p className="text-xs text-gray-500">ID: {user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-900">{user.email}</span>
                            <span className="text-xs text-gray-500">{user.phone || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>

                        {isAdmin && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(user)}
                                className="cursor-pointer p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <FiEdit2 />
                              </button>
                              <button
                                onClick={() => handleDelete(user)}
                                className="cursor-pointer p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {isModalOpen && (
        <UserModal
          isOpen={isModalOpen}
          onClose={closeModal}
          user={editingUser}
          onSubmit={(data) => {
            if (editingUser) {
              updateMutation.mutate({ id: editingUser.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title="Foydalanuvchini o'chirish"
        message={`"${deleteConfirm.userName}" foydalanuvchisini nofaol qilmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`}
        confirmText="Ha, o'chirish"
        cancelText="Bekor qilish"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, userId: null, userName: '' })}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

/**
 * User Modal - Backend CreateUserRequest va UpdateUserRequest ga mos
 * 
 * CreateUserRequest: { email, password, fullName, phone, role }
 * UpdateUserRequest: { fullName, phone, email?, password?, role?, active? }
 */
const UserModal = ({ isOpen, onClose, user, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    role: user?.role || 'STUDENT'
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate: New user must have password
    if (!user && !formData.password) {
      toast.error('Yangi foydalanuvchi uchun parol shart');
      return;
    }
    
    // For update: only send changed fields
    let dataToSubmit = { 
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email,
    };
    
    // Only include these fields for new users
    if (!user) {
      dataToSubmit.password = formData.password;
      dataToSubmit.role = formData.role;
    } else {
      // For updates, optionally include password if changed
      if (formData.password) {
        dataToSubmit.password = formData.password;
      }
      // Admin can change active status
    }
    
    onSubmit(dataToSubmit);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {user ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'}
          </h2>
          <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600">
            <FiX className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To'liq ism
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ism Familiya"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (Login)
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="email@example.com"
            />
            {user && <p className="text-xs text-gray-500 mt-1">Email o'zgartirilsa, yangi email bilan kirish kerak bo'ladi</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="+998901234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parol {user && '(o\'zgartirish uchun)'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required={!user}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="********"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <FiEyeOff className="text-lg" />
                ) : (
                  <FiEye className="text-lg" />
                )}
              </button>
            </div>
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="cursor-pointer w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="STUDENT">STUDENT</option>
                <option value="TEACHER">TEACHER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          )}





          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {isLoading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Users;