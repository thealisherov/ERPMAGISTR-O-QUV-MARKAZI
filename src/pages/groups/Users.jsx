import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { usersApi } from '../../api/users.api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiEye, FiUser, FiMail, FiPhone, FiEyeOff, FiX } from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { parseDeleteError } from '../../utils/errorParser';
import toast from 'react-hot-toast';

/**
 * Users Page (Groups section) - Backend bilan 100% mos
 * 
 * Backend UserDTO: { id, email, fullName, phone, role, active }
 * Backend UserRole: ADMIN | TEACHER | STUDENT
 * 
 * Note: SUPER_ADMIN va CEO backendda yo'q, olib tashlandi.
 */

const Users = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, userId: null, userName: '' });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'TEACHER'
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await usersApi.getAll();
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      resetForm();
      toast.success("Foydalanuvchi qo'shildi");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Xatolik yuz berdi");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setEditingUser(null);
      resetForm();
      toast.success("Foydalanuvchi yangilandi");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Xatolik yuz berdi");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Foydalanuvchi o'chirildi");
    },
    onError: (error) => {
      console.error('Delete user error:', error);
      const msg = parseDeleteError(error, 'Foydalanuvchi');
      toast.error(msg, { duration: 5000 });
    }
  });

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      role: 'TEACHER'
    });
    setShowPassword(false);
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        role: user.role || 'TEACHER'
      });
    } else {
      setEditingUser(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      const data = { 
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
      };
      if (formData.password) data.password = formData.password;
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (user) => {
    setDeleteConfirm({ open: true, userId: user.id, userName: user.fullName || 'Nomsiz' });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(deleteConfirm.userId);
    setDeleteConfirm({ open: false, userId: null, userName: '' });
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-blue-100 text-blue-800';
      case 'TEACHER': return 'bg-green-100 text-green-800';
      case 'STUDENT': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Foydalanuvchilar</h1>
          <p className="text-gray-600 mt-1">Tizim foydalanuvchilari boshqaruvi</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="cursor-pointer w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> Yangi Foydalanuvchi
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="mb-6 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Qidirish (ism, email, telefon)..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Mobile Cards */}
        <div className="block sm:hidden space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Yuklanmoqda...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Foydalanuvchilar topilmadi</div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FiUser className="text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{user.fullName || 'Nomsiz'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
                <p className="text-sm text-gray-600 flex items-center gap-1 mb-3">
                  <FiPhone className="text-gray-400" /> {user.phone || '-'}
                </p>
                <div className="flex justify-end gap-2 border-t pt-2">
                  <button
                    onClick={() => handleOpenModal(user)}
                    className="cursor-pointer p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Tahrirlash"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="cursor-pointer p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="O'chirish"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Foydalanuvchi</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Telefon</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Yuklanmoqda...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Foydalanuvchilar topilmadi</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {user.fullName || 'Nomsiz'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="cursor-pointer p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Tahrirlash"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="cursor-pointer p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="O'chirish"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To'liq ism</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ism Familiya"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (Login)</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="+998901234567"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parol {editingUser && "(o'zgartirish uchun)"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required={!editingUser}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={editingUser ? "O'zgartirish uchun yangi parol kiriting" : "********"}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select
                className="cursor-pointer w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="TEACHER">O'qituvchi</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="cursor-pointer px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="cursor-pointer px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title="Foydalanuvchini o'chirish"
        message={`"${deleteConfirm.userName}" foydalanuvchisini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`}
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

export default Users;