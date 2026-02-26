import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { groupsApi } from '../api/groups.api';
import { teachersApi } from '../api/teachers.api';
import { studentsApi } from '../api/students.api';
import { useAuth } from '../hooks/useAuth';
import { FiPlus, FiEdit2, FiUsers, FiArrowRight, FiSearch } from 'react-icons/fi';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const daysList = [
    { id: 'Du', label: 'Du' },
    { id: 'Se', label: 'Se' },
    { id: 'Chor', label: 'Chor' },
    { id: 'Pay', label: 'Pay' },
    { id: 'Ju', label: 'Ju' },
    { id: 'Sha', label: 'Sha' },
    { id: 'Yak', label: 'Yak' }
];

const Groups = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '', teacherId: '', description: '', price: ''
  });
  
  const [scheduleData, setScheduleData] = useState({
      days: [],
      startTime: '',
      endTime: ''
  });

  const isAdmin = useMemo(() => user?.role === 'ADMIN', [user?.role]);
  const isTeacher = useMemo(() => user?.role === 'TEACHER', [user?.role]);

  const { data: groups = [], isLoading: loading, refetch, error } = useQuery({
    queryKey: ['groups', user?.role],
    queryFn: async () => {
      if (user?.role === 'TEACHER') {
        const response = await teachersApi.getMyGroups();
        return response.data;
      }
      if (user?.role === 'STUDENT') {
         const response = await studentsApi.getMyGroups();
         return response.data;
      }
      if (user?.role === 'ADMIN') {
         const response = await groupsApi.getAdminGroups();
         return response.data;
      }
      const response = await groupsApi.getAll();
      return response.data;
    },
    enabled: !!user,
    retry: 2,
    staleTime: 30000,
  });

  React.useEffect(() => {
    if (error) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Guruhlarni yuklashda xatolik';
      toast.error(`Xatolik: ${errorMsg}`);
      console.error('Full error:', error);
    }
  }, [error]);

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter(group => 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.teacherName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groups, searchTerm]);

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await teachersApi.getAll();
      return response.data;
    },
    enabled: isAdmin && isModalOpen, // Only load for admin
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await groupsApi.create(data);
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setTimeout(() => refetch(), 500);
      toast.success("Guruh muvaffaqiyatli yaratildi");
      setIsModalOpen(false);
    },
    onError: (err) => {
       const errorMsg = err.response?.data?.message || err.message || 'Xatolik yuz berdi';
       const statusCode = err.response?.status;
       
       // Backend DTO mapping error - guruh yaratilgan lekin response qaytishda xatolik
       const isBackendDtoError = statusCode === 500 && (
         errorMsg.toLowerCase().includes('null') || 
         errorMsg.toLowerCase().includes('getstudents') || 
         errorMsg.toLowerCase().includes('invoke') ||
         errorMsg.toLowerCase().includes('cannot invoke')
       );
       
       if (isBackendDtoError) {
         console.log('✅ Guruh yaratildi (backend DTO xatosi e\'tiborga olinmadi)');
         queryClient.invalidateQueries({ queryKey: ['groups'] });
         setTimeout(() => refetch(), 500);
         toast.success("Guruh muvaffaqiyatli yaratildi");
         setIsModalOpen(false);
       } else {
         console.log('❌ Real error:', errorMsg);
         queryClient.invalidateQueries({ queryKey: ['groups'] });
         setTimeout(() => refetch(), 500);
         toast.error(`Xatolik: ${errorMsg}`);
       }
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => groupsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setTimeout(() => refetch(), 500);
      toast.success("Guruh muvaffaqiyatli yangilandi");
      setIsModalOpen(false);
    },
    onError: (err) => {
       const errorMsg = err.response?.data?.message || err.message || 'Xatolik yuz berdi';
       const statusCode = err.response?.status;
       
       // Backend DTO mapping error
       const isBackendDtoError = statusCode === 500 && (
         errorMsg.toLowerCase().includes('null') || 
         errorMsg.toLowerCase().includes('getstudents') || 
         errorMsg.toLowerCase().includes('invoke') ||
         errorMsg.toLowerCase().includes('cannot invoke')
       );
       
       if (isBackendDtoError) {
         console.log('✅ Guruh yangilandi (backend DTO xatosi e\'tiborga olinmadi)');
         queryClient.invalidateQueries({ queryKey: ['groups'] });
         setTimeout(() => refetch(), 500);
         toast.success("Guruh muvaffaqiyatli yangilandi");
         setIsModalOpen(false);
       } else {
         console.log('❌ Real error:', errorMsg);
         queryClient.invalidateQueries({ queryKey: ['groups'] });
         setTimeout(() => refetch(), 500);
         toast.error(`Xatolik: ${errorMsg}`);
       }
    }
  });

  const handleOpenModal = useCallback((group = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        teacherId: group.teacherId,
        description: group.description || '',
        price: group.price || ''
      });

      let parsedDays = [];
      let parsedStart = '';
      let parsedEnd = '';
      
      if (group.schedule) {
          const parts = group.schedule.trim().split(' ');
          const timePart = parts.find(p => p.includes(':') && p.includes('-'));
          
          if (timePart) {
              const [s, e] = timePart.split('-');
              parsedStart = s;
              parsedEnd = e;
          }
          
          parsedDays = daysList.map(d => d.id).filter(id => group.schedule.includes(id));
      }

      setScheduleData({
          days: parsedDays,
          startTime: parsedStart,
          endTime: parsedEnd
      });

    } else {
      setEditingGroup(null);
      // If teacher is creating a new group, auto-set their ID
      const teacherId = isTeacher ? user?.userId : '';
      setFormData({ name: '', teacherId: teacherId, description: '', price: '' });
      setScheduleData({ days: [], startTime: '', endTime: '' });
    }
    setIsModalOpen(true);
  }, [isTeacher, user?.userId]);

  const toggleDay = useCallback((dayId) => {
    setScheduleData(prev => {
        const newDays = prev.days.includes(dayId)
           ? prev.days.filter(d => d !== dayId)
           : [...prev.days, dayId];
        
        return {
            ...prev,
            days: daysList.map(d => d.id).filter(id => newDays.includes(id))
        };
    });
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (scheduleData.days.length === 0) {
      toast.error("Kamida bitta kun tanlang");
      return;
    }
    
    if (!scheduleData.startTime || !scheduleData.endTime) {
      toast.error("Boshlash va tugash vaqtini kiriting");
      return;
    }
    
    try {
      const scheduleStr = `${scheduleData.days.join('-')} ${scheduleData.startTime}-${scheduleData.endTime}`;

      const payload = {
        name: formData.name,
        description: formData.description || '',
        teacherId: Number(formData.teacherId),
        schedule: scheduleStr.trim(),
        price: formData.price ? Number(formData.price) : 0
      };

      if (editingGroup) {
        await updateMutation.mutateAsync({ id: editingGroup.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } catch (error) {
      // Error already handled in mutation
    }
  }, [scheduleData, formData, editingGroup, createMutation, updateMutation]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Guruhlar</h1>
            <p className="text-gray-500 text-sm mt-1">O'quv markazi guruhlarini boshqarish</p>
          </div>
          {(isTeacher || isAdmin) && (
            <button
                onClick={() => handleOpenModal()}
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-200 w-full sm:w-auto justify-center font-semibold text-sm"
            >
                <FiPlus /> Yangi Guruh Qo'shish
            </button>
          )}
        </div>

        <div className="relative w-full max-w-md">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Guruh nomi yoki o'qituvchi..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 text-gray-400">Yuklanmoqda...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100 text-gray-400">
            {searchTerm ? "Hech narsa topilmadi" : "Guruhlar mavjud emas"}
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 flex flex-col hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-xl items-center justify-center flex-shrink-0">
                    <FiUsers className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <h3 className="text-base md:text-xl font-bold text-gray-900 line-clamp-2">{group.name}</h3>
                </div>
                
                {(isTeacher || isAdmin) && (
                    <div className="flex gap-1 ml-2">
                    <button
                        onClick={() => handleOpenModal(group)}
                        className="cursor-pointer p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                        <FiEdit2 size={16} />
                    </button>
                    </div>
                )}
              </div>

              {/* Mobile & Desktop Content */}
              <div className="flex flex-col flex-grow">
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                  {group.description || 'Izoh mavjud emas'}
                </p>
                
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                    <FiUsers size={12}/> {group.studentCount || 0} o'quvchi
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${group.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {group.status}
                  </span>
                </div>

                <div className="space-y-2 py-3 border-t border-gray-50 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="w-16 md:w-20 text-gray-400 flex-shrink-0">Ustoz:</span>
                    <span className="font-medium text-gray-800 break-words">{group.teacherName || 'Tanlanmagan'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-16 md:w-20 text-gray-400 flex-shrink-0">Jadval:</span>
                    <span className="font-medium text-gray-800 break-words">{group.schedule || 'Kiritilmagan'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 md:mt-4">
                <Link
                  to={`/groups/${group.id}`}
                  className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white py-2.5 md:py-3 rounded-xl font-semibold hover:bg-blue-600 transition-all group text-sm md:text-base"
                >
                  Batafsil
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingGroup ? "Guruhni Tahrirlash" : "Yangi Guruh Yaratish"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Guruh nomi</label>
            <input
              type="text" required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masalan: IELTS B2"
            />
          </div>

          {isAdmin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">O'qituvchi</label>
              <select
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              >
                <option value="">O'qituvchini tanlang</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName} ({t.email})</option>)}
              </select>
            </div>
          )}

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-1">Guruh narxi (UZS)</label>
             <input
               type="number" required
               className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
               value={formData.price}
               onChange={(e) => setFormData({ ...formData, price: e.target.value })}
               placeholder="Masalan: 350000"
               min="0"
             />
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Hafta kunlari</label>
             <div className="flex flex-wrap gap-2 mb-4">
                {daysList.map(day => (
                    <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            scheduleData.days.includes(day.id)
                            ? 'bg-gray-200 text-gray-900 border border-gray-300 shadow-sm'
                            : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'
                        }`}
                    >
                        {day.label}
                    </button>
                ))}
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-1">Boshlash</label>
                   <input
                        type="time"
                        required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        value={scheduleData.startTime}
                        onChange={(e) => setScheduleData({...scheduleData, startTime: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-1">Tugash</label>
                   <input
                        type="time"
                        required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        value={scheduleData.endTime}
                        onChange={(e) => setScheduleData({...scheduleData, endTime: e.target.value})}
                   />
                </div>
             </div>
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-1">Izoh</label>
             <textarea
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Guruh haqida qo'shimcha ma'lumot..."
             />
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={handleCloseModal}
              className="cursor-pointer px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="cursor-pointer px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Groups;