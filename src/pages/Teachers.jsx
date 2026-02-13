import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersApi } from '../api/teachers.api';
import { groupsApi } from '../api/groups.api';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiUser, FiPhone, FiMail, FiGrid, FiUsers, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { parseDeleteError } from '../utils/errorParser';
import { useAuth } from '../hooks/useAuth';

const Teachers = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, teacherId: null, teacherName: '' });

  // Initial Form State
  const initialFormState = {
    fullName: '',
    email: '',
    password: '',
    phone: '+998',
  };

  const [formData, setFormData] = useState(initialFormState);

  // Check if user is ADMIN
  const isAdmin = user?.role === 'ADMIN';

  // Fetch Teachers
  const { data: teachers = [], isLoading: loading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await teachersApi.getAll();
      return response.data;
    },
  });

  // Fetch All Groups for Statistics
  const { data: allGroups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      // Use Admin endpoint to ensure we get ALL groups across all teachers
      const res = await groupsApi.getAdminGroups();
      return res.data;
    },
  });

  // Format Phone Number
  const formatPhoneNumber = (value) => {
    let numbers = value.replace(/\D/g, '');
    if (numbers && !numbers.startsWith('998')) {
      if (numbers.startsWith('9')) {
        numbers = '998' + numbers;
      } else {
        numbers = '998' + numbers;
      }
    }
    if (numbers.startsWith('998')) {
      return '+' + numbers;
    }
    return value;
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const createData = {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: 'TEACHER'
      };
      return teachersApi.create(createData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsModalOpen(false);
      toast.success("O'qituvchi muvaffaqiyatli qo'shildi");
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Xatolik yuz berdi';
      setFormError(msg);
      toast.error(msg);
    }
  });

  // Update Mutation
  // Backend UpdateUserRequest: { fullName, phone, email, password, role, active }
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const updateData = {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        // Only include password if it was changed (not empty)
        ...(data.password && { password: data.password })
      };
      return teachersApi.update(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsModalOpen(false);
      toast.success("O'qituvchi muvaffaqiyatli yangilandi");
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Xatolik yuz berdi';
      setFormError(msg);
      toast.error(msg);
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => teachersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success("O'qituvchi muvaffaqiyatli o'chirildi");
    },
    onError: (error) => {
      console.error('Delete teacher error:', error);
      const msg = parseDeleteError(error, "O'qituvchi");
      toast.error(msg, { duration: 7000 });
      alert(msg);
    }
  });

  const handleOpenModal = (teacher = null) => {
    setFormError('');
    setShowPassword(false);
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        fullName: teacher.fullName,
        email: teacher.email,
        password: '',
        phone: teacher.phone || '+998',
        phone: teacher.phone || '+998'
      });
    } else {
      setEditingTeacher(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (editingTeacher) {
        await updateMutation.mutateAsync({ id: editingTeacher.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
    } catch (error) {
       // Handled
    }
  };

  const handleDelete = (teacher) => {
    const teacherGroupsCount = allGroups.filter(g => g.teacherName === teacher.fullName).length;
    
    if (teacherGroupsCount > 0) {
      toast.error(`Bu o'qituvchiga ${teacherGroupsCount} ta guruh biriktirilgan. Avval guruhlarni boshqa o'qituvchiga o'tkazing.`);
      return;
    }

    setDeleteConfirm({ open: true, teacherId: teacher.id, teacherName: teacher.fullName });
  };

  const confirmDeleteTeacher = () => {
    deleteMutation.mutate(deleteConfirm.teacherId);
    setDeleteConfirm({ open: false, teacherId: null, teacherName: '' });
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">O'qituvchilar</h1>
          <p className="text-gray-600 mt-1">O'qituvchilar ro'yxati va boshqaruvi</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => handleOpenModal()}
            className="cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            <FiPlus className="h-5 w-5" />
            Yangi O'qituvchi
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Qidirish (Ism yoki Login)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="block sm:hidden space-y-4">
            {loading ? (
                <div className="text-center py-8 text-gray-500">Yuklanmoqda...</div>
            ) : filteredTeachers.length > 0 ? (
                filteredTeachers.map(teacher => {
                    const groupCount = allGroups.filter(g => g.teacherName === teacher.fullName).length;
                    return (
                    <div key={teacher.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                             <div>
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                  <FiUser className="text-blue-500" /> {teacher.fullName}
                                </h3>
                                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                  <FiMail className="text-gray-400" /> {teacher.email}
                                </p>
                             </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 my-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                                <FiPhone /> {teacher.phone || 'N/A'}
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <FiGrid /> Guruhlar: {groupCount}
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-2 border-t pt-3">
                             <Link
                                to={`/teachers/${teacher.id}`}
                                className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                              >
                                <FiEye className="h-5 w-5" />
                              </Link>
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => handleOpenModal(teacher)}
                                    className="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                                  >
                                    <FiEdit2 className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(teacher)}
                                    className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                                  >
                                    <FiTrash2 className="h-5 w-5" />
                                  </button>
                                </>
                              )}
                        </div>
                    </div>
                )})
            ) : (
                <div className="text-center py-8 text-gray-500">O'qituvchilar topilmadi</div>
            )}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ism Familiya</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login (Email)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guruhlar</th>



                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amallar</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                   <td colSpan="7" className="px-6 py-12 text-center text-gray-500">Yuklanmoqda...</td>
                </tr>
              ) : filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher, index) => {
                  const groupCount = allGroups.filter(g => g.teacherName === teacher.fullName).length;
                  return (
                  <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{teacher.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.phone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{groupCount}</span>
                    </td>



                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link to={`/teachers/${teacher.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <FiEye className="h-4 w-4" />
                        </Link>
                        {isAdmin && (
                          <>
                            <button onClick={() => handleOpenModal(teacher)} className="cursor-pointer p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                              <FiEdit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(teacher)} className="cursor-pointer p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">O'qituvchilar topilmadi</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <p className="font-semibold">❌ Xatolik:</p>
              <p>{formError}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ism Familiya</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Ali Aliyev"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Login (Email)</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="teacher123"
            />
            {editingTeacher && (
              <p className="text-xs text-gray-500 mt-1">Login o'zgartirilsa, yangi login bilan kirish kerak bo'ladi</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {editingTeacher ? 'Yangi Parol (ixtiyoriy)' : 'Parol'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required={!editingTeacher}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-10"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingTeacher ? 'Bo\'sh qoldiring agar o\'zgartirmoqchi bo\'lmasangiz' : '******'}
                minLength={editingTeacher ? 0 : 6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
              </button>
            </div>
            {editingTeacher && (
              <p className="text-xs text-gray-500 mt-1">Parolni o'zgartirish uchun yangi parol kiriting. Bo'sh qoldiring agar saqlamoqchi bo'lsangiz.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqam</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
              placeholder="+998"
            />
          </div>



            <div className="flex justify-end gap-3 mt-6">
              <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="cursor-pointer px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="cursor-pointer px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title="O'qituvchini o'chirish"
        message={`"${deleteConfirm.teacherName}" o'qituvchisini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`}
        confirmText="Ha, o'chirish"
        cancelText="Bekor qilish"
        variant="danger"
        onConfirm={confirmDeleteTeacher}
        onCancel={() => setDeleteConfirm({ open: false, teacherId: null, teacherName: '' })}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Teachers;