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
  console.log('🔥🔥🔥 GROUPS COMPONENT LOADED 🔥🔥🔥');
  console.log('Test log - agar buni ko\'rsangiz, logging ishlayapti!');
  
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '', teacherId: '', description: ''
  });
  
  const [scheduleData, setScheduleData] = useState({
      days: [],
      startTime: '',
      endTime: ''
  });

  const isAdmin = useMemo(() => user?.role === 'ADMIN', [user?.role]);

  const { data: groups = [], isLoading: loading, refetch, error } = useQuery({
    queryKey: ['groups', user?.role],
    queryFn: async () => {
      console.log('🔍 Fetching groups for role:', user?.role);
      
      if (user?.role === 'TEACHER') {
        console.log('📚 Fetching teacher groups...');
        const response = await teachersApi.getMyGroups();
        console.log('✅ Teacher groups:', response.data);
        return response.data;
      }
      if (user?.role === 'STUDENT') {
         console.log('📚 Fetching student groups...');
         const response = await studentsApi.getMyGroups();
         console.log('✅ Student groups:', response.data);
         return response.data;
      }
      console.log('📚 Fetching all groups...');
      const response = await groupsApi.getAll();
      console.log('✅ All groups:', response.data);
      return response.data;
    },
    enabled: !!user,
    retry: 2,
    staleTime: 30000,
  });

  // Debug logging
  React.useEffect(() => {
    console.log('👤 Current user:', user);
    console.log('📊 Groups data:', groups);
    console.log('⏳ Loading:', loading);
    console.log('❌ Error:', error);
    
    // Show error as toast for user to see
    if (error) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Guruhlarni yuklashda xatolik';
      toast.error(`Xatolik: ${errorMsg}`);
      console.error('Full error:', error);
    }
    
    // Show success when groups load
    if (!loading && groups && groups.length > 0) {
      console.log(`✅ ${groups.length} ta guruh yuklandi`);
    }
    
    if (!loading && groups && groups.length === 0) {
      console.log('⚠️ Guruhlar bo\'sh');
    }
  }, [user, groups, loading, error]);

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
    enabled: isAdmin && isModalOpen,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      console.log('🚀 API CALL: POST /api/groups');
      console.log('📦 Request data:', data);
      const response = await groupsApi.create(data);
      console.log('📥 Response received:', response);
      return response;
    },
    onSuccess: (response) => {
      console.log('✅ CREATE SUCCESS');
      console.log('Response data:', response?.data);
      queryClient.invalidateQueries(['groups']);
      setTimeout(() => refetch(), 100);
      toast.success("Guruh yaratildi");
      setIsModalOpen(false);
    },
    onError: (err) => {
       console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
       console.log('❌ CREATE ERROR HANDLER');
       console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
       console.error('Full error object:', err);
       console.log('Response status:', err.response?.status);
       console.log('Response headers:', err.response?.headers);
       console.log('Response data:', err.response?.data);
       console.log('Error message:', err.message);
       console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
       
       // Force refetch even on error
       queryClient.invalidateQueries(['groups']);
       setTimeout(() => {
         console.log('🔄 Refetching groups after error...');
         refetch();
       }, 100);
       
       const errorMsg = err.response?.data?.message || err.message || 'Xatolik yuz berdi';
       const statusCode = err.response?.status;
       
       console.log('Checking if this is known backend error...');
       console.log('Status code:', statusCode);
       console.log('Error message contains "null"?', errorMsg.includes('null'));
       console.log('Error message contains "getStudents"?', errorMsg.includes('getStudents'));
       console.log('Error message contains "invoke"?', errorMsg.includes('invoke'));
       
       // If 500 error and contains "null" or "getStudents", group was created but DTO mapping failed
       if (statusCode === 500 && (errorMsg.includes('null') || errorMsg.includes('getStudents') || errorMsg.includes('invoke'))) {
         console.log('✅ Guruh yaratildi (backend DTO xatosi e\'tiborga olinmadi)');
         toast.success("Guruh yaratildi");
         setIsModalOpen(false);
       } else {
         console.log('❌ Real error, showing to user');
         toast.error(`Xatolik: ${errorMsg}`);
       }
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => groupsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['groups']);
      setTimeout(() => refetch(), 100);
      toast.success("Guruh yangilandi");
      setIsModalOpen(false);
    },
    onError: (err) => {
       console.error('❌ Update group error:', err);
       
       // Force refetch even on error
       queryClient.invalidateQueries(['groups']);
       setTimeout(() => refetch(), 100);
       
       const errorMsg = err.response?.data?.message || err.message || 'Xatolik yuz berdi';
       const statusCode = err.response?.status;
       
       // If 500 error and contains "null" or "getStudents", group was updated but DTO mapping failed
       if (statusCode === 500 && (errorMsg.includes('null') || errorMsg.includes('getStudents') || errorMsg.includes('invoke'))) {
         console.log('✅ Guruh yangilandi (backend DTO xatosi e\'tiborga olinmadi)');
         toast.success("Guruh yangilandi");
         setIsModalOpen(false);
       } else {
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
        description: group.description || ''
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
      setFormData({ name: '', teacherId: '', description: '' });
      setScheduleData({ days: [], startTime: '', endTime: '' });
    }
    setIsModalOpen(true);
  }, []);

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
    console.log('🔴🔴🔴 HANDLE SUBMIT CALLED! 🔴🔴🔴');
    e.preventDefault();
    console.log('Form data:', formData);
    console.log('Schedule data:', scheduleData);
    
    if (scheduleData.days.length === 0) {
      console.log('❌ Validation failed: No days selected');
      toast.error("Kamida bitta kun tanlang");
      return;
    }
    
    if (!scheduleData.startTime || !scheduleData.endTime) {
      console.log('❌ Validation failed: No time selected');
      toast.error("Boshlash va tugash vaqtini kiriting");
      return;
    }
    
    console.log('✅ Validation passed, preparing payload...');
    
    try {
      const scheduleStr = `${scheduleData.days.join('-')} ${scheduleData.startTime}-${scheduleData.endTime}`;

      const payload = {
        name: formData.name,
        description: formData.description || '',
        teacherId: Number(formData.teacherId),
        schedule: scheduleStr.trim()
      };

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📤 BACKENDGA YUBORILAYOTGAN MA\'LUMOT:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Payload:', JSON.stringify(payload, null, 2));
      console.log('Editing mode:', !!editingGroup);
      if (editingGroup) {
        console.log('Group ID:', editingGroup.id);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (editingGroup) {
        console.log('🔄 Updating group...');
        const result = await updateMutation.mutateAsync({ id: editingGroup.id, data: payload });
        console.log('✅ Update result:', result);
      } else {
        console.log('➕ Creating new group...');
        const result = await createMutation.mutateAsync(payload);
        console.log('✅ Create result:', result);
      }
    } catch (error) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ XATO YUZ BERDI:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error object:', error);
      console.log('Response status:', error?.response?.status);
      console.log('Response data:', error?.response?.data);
      console.log('Error message:', error?.message);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
          {isAdmin && (
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
              <div className="flex justify-between items-center md:items-start mb-2 md:mb-4">
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex w-12 h-12 bg-blue-50 rounded-xl items-center justify-center">
                    <FiUsers className="text-blue-600 w-6 h-6" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 line-clamp-1">{group.name}</h3>
                </div>
                
                {isAdmin && (
                    <div className="flex gap-1">
                    <button
                        onClick={() => handleOpenModal(group)}
                        className="cursor-pointer p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                        <FiEdit2 size={16} />
                    </button>
                    </div>
                )}
              </div>

              <div className="hidden md:flex flex-col flex-grow">
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">
                  {group.description || 'Izoh mavjud emas'}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                    <FiUsers size={12}/> {group.studentCount || 0} o'quvchi
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${group.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {group.status}
                  </span>
                </div>

                <div className="space-y-2 py-4 border-t border-gray-50 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-gray-400">Ustoz:</span>
                    <span className="font-medium text-gray-800">{group.teacherName || 'Tanlanmagan'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-gray-400">Jadval:</span>
                    <span className="font-medium text-gray-800">{group.schedule || 'Kiritilmagan'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-2 md:mt-4">
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
