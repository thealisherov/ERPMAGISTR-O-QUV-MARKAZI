import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsApi } from '../../api/students.api';
import { groupsApi } from '../../api/groups.api';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiCheck, FiMail, FiPhone, FiUser, FiLock } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

const Students = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Initial state for form
  const initialFormState = {
    fullName: '',
    email: '',
    password: '',
    phone: '+998',
    groupIds: []
  };

  const [formData, setFormData] = useState(initialFormState);

  const { data: students = [], isLoading: loading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await studentsApi.getAll();
      return response.data;
    },
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await groupsApi.getAll();
      return response.data;
    },
  });

  // Telefon raqam formatlash - +998 kiritish
  const formatPhoneNumber = (value) => {
    // Faqat raqamlarni qoldirish
    let numbers = value.replace(/\D/g, '');
    
    // Agar 998 bilan boshlanmasa va raqam bo'lsa
    if (numbers && !numbers.startsWith('998')) {
      // 9 bilan boshlangan bo'lsa, uni 998 ga almashtirish
      if (numbers.startsWith('9')) {
        numbers = '998' + numbers;
      } else {
        // Boshqalari uchun 998 qo'shish
        numbers = '998' + numbers;
      }
    }
    
    // +998 formatida qaytarish
    if (numbers.startsWith('998')) {
      return '+' + numbers;
    }
    
    return value;
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Create User
      // Backend expects: { fullName, email, password, phone, role: 'STUDENT' }
      const createData = {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone, // Sending formatted phone
        role: 'STUDENT'
      };
      
      const response = await studentsApi.create(createData);
      const newStudent = response.data;

      // 2. Enroll to groups if selected
      if (data.groupIds && data.groupIds.length > 0) {
        const promises = data.groupIds.map(groupId => 
          groupsApi.addStudent(groupId, newStudent.id)
        );
        await Promise.all(promises);
      }
      
      return newStudent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      setIsModalOpen(false);
      toast.success("O'quvchi muvaffaqiyatli qo'shildi");
    },
    onError: (error) => {
      console.error('Error creating student:', error);
      const msg = error.response?.data?.message || 'Xatolik yuz berdi';
      setFormError(msg);
      toast.error(msg);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Update logic: Only fullName and phone are updateable via this endpoint
      // based on UpdateUserRequest DTO in backend
      const updateData = {
        fullName: data.fullName,
        phone: data.phone
        // email, password, role are not updateable here
      };
      return studentsApi.update(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      setIsModalOpen(false);
      toast.success("O'quvchi muvaffaqiyatli yangilandi");
    },
    onError: (error) => {
      console.error('Error updating student:', error);
      const msg = error.response?.data?.message || 'Xatolik yuz berdi';
      setFormError(msg);
      toast.error(msg);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => studentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      toast.success("O'quvchi muvaffaqiyatli o'chirildi");
    },
    onError: (error) => {
      console.error('Error deleting student:', error);
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  });

  const handleOpenModal = (student = null) => {
    setFormError('');
    setShowPassword(false);
    if (student) {
      setEditingStudent(student);
      setFormData({
        fullName: student.fullName,
        email: student.email, // Read-only in edit
        password: '', // Not needed in edit
        phone: student.phone || '+998',
        groupIds: [] // Cannot edit groups here easily
      });
    } else {
      setEditingStudent(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const toggleGroupSelection = (groupId) => {
    setFormData(prev => {
      const isSelected = prev.groupIds.includes(groupId);
      if (isSelected) {
        return { ...prev, groupIds: prev.groupIds.filter(id => id !== groupId) };
      } else {
        return { ...prev, groupIds: [...prev.groupIds, groupId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (editingStudent) {
        await updateMutation.mutateAsync({ id: editingStudent.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
    } catch (error) {
      // Handled in mutation callbacks
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Haqiqatan ham bu o\'quvchini o\'chirmoqchimisiz?\nESLATMA: Agar o\'quvchining to\'lovlari yoki boshqa bog\'liq ma\'lumotlari bo\'lsa, xatolik berishi mumkin.')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredStudents = students.filter(student =>
    student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">O'quvchilar</h1>
          <p className="text-gray-600 mt-1">Barcha o'quvchilar ro'yxati</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          <FiPlus className="h-5 w-5" />
          Yangi O'quvchi
        </button>
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

        {/* Mobile View (Cards) - Visible on small screens */}
        <div className="block sm:hidden space-y-4">
            {loading ? (
                <div className="text-center py-8 text-gray-500">Yuklanmoqda...</div>
            ) : filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                    <div key={student.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                             <div>
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                  <FiUser className="text-blue-500" /> {student.fullName}
                                </h3>
                                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                  <FiMail className="text-gray-400" /> {student.email}
                                </p>
                             </div>
                             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${student.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {student.active ? 'Aktiv' : 'Nofaol'}
                             </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                          <FiPhone className="text-gray-400" /> {student.phone || 'Tel: N/A'}
                        </p>
                        
                        <div className="flex justify-end gap-2 border-t pt-3">
                             <Link
                                to={`/students/${student.id}`}
                                className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                              >
                                <FiEye className="h-5 w-5" />
                              </Link>
                              <button
                                onClick={() => handleOpenModal(student)}
                                className="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                              >
                                <FiEdit2 className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(student.id)}
                                className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                              >
                                <FiTrash2 className="h-5 w-5" />
                              </button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-gray-500">O'quvchilar topilmadi</div>
            )}
        </div>

        {/* Desktop View (Table) - Hidden on small screens */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ism Familiya</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login (Email)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amallar</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                   <td colSpan="6" className="px-6 py-12 text-center text-gray-500">Yuklanmoqda...</td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{student.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.phone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${student.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {student.active ? 'Aktiv' : 'Nofaol'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link to={`/students/${student.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <FiEye className="h-4 w-4" />
                        </Link>
                        <button onClick={() => handleOpenModal(student)} className="cursor-pointer p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="cursor-pointer p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">O'quvchilar topilmadi</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? "O'quvchini tahrirlash" : "Yangi o'quvchi"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <p className="font-semibold">❌ Xatolik:</p>
              <p>{formError}</p>
            </div>
          )}

          {/* Full Name */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ism Familiya</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Vali Valiyev"
              />
          </div>

          {/* Email - Readonly in Edit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Login (Email)</label>
            <input
              type="text"
              required
              disabled={!!editingStudent}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${!!editingStudent ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user123"
            />
          </div>

           {/* Password - Only for Create */}
           {!editingStudent && (
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parol</label>
                <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-10"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="******"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="cursor-pointer absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                    </button>
                </div>
             </div>
           )}

          {/* Phone */}
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

          {/* Groups Selection - Only for Create */}
          {!editingStudent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Guruhlarga qo'shish</label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {groups.map(group => (
                  <div
                    key={group.id}
                    className={`flex items-center p-2 rounded-lg cursor-pointer border transition-all ${
                      formData.groupIds.includes(group.id)
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => toggleGroupSelection(group.id)}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center mr-2 ${
                      formData.groupIds.includes(group.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                    }`}>
                      {formData.groupIds.includes(group.id) && <FiCheck className="text-white w-3 h-3" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{group.name}</p>
                      <p className="text-xs text-gray-500">{group.teacherName || 'O\'qituvchi yo\'q'}</p>
                    </div>
                  </div>
                ))}
                {groups.length === 0 && <p className="text-sm text-gray-500 text-center">Guruhlar mavjud emas</p>}
              </div>
            </div>
          )}
          
          {editingStudent && (
            <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
              Guruhlarni o'zgartirish uchun guruh sahifasiga o'ting yoki admin panelidan foydalaning.
            </div>
          )}

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
    </div>
  );
};

export default Students;
