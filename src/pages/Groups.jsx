import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { groupsApi } from '../api/groups.api';
import { teachersApi } from '../api/teachers.api';
import { useAuth } from '../hooks/useAuth';
import { FiPlus, FiEdit2, FiUsers, FiArrowRight, FiSearch } from 'react-icons/fi';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const Groups = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '', teacherId: '', schedule: '', description: ''
  });

  const isAdmin = user?.role === 'ADMIN';

  const { data: groups = [], isLoading: loading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await groupsApi.getAll();
      return response.data;
    },
  });

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter(group => 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.teacherName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groups, searchTerm]);

  // Only fetch teachers if Admin
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await teachersApi.getAll();
      return response.data;
    },
    enabled: isAdmin && isModalOpen, // Fetch when modal opens and is Admin
  });

  const createMutation = useMutation({
    mutationFn: (data) => groupsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['groups']);
      toast.success("Guruh yaratildi");
      setIsModalOpen(false);
    },
    onError: (err) => {
       toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => groupsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['groups']);
      toast.success("Guruh yangilandi");
      setIsModalOpen(false);
    },
     onError: (err) => {
       toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  });

  // Delete mutation removed as backend support is missing/dubious for now

  const handleOpenModal = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        teacherId: group.teacherId,
        schedule: group.schedule || '',
        description: group.description || ''
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: '', teacherId: '', schedule: '', description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        teacherId: Number(formData.teacherId),
        schedule: formData.schedule
      };

      if (editingGroup) {
        await updateMutation.mutateAsync({ id: editingGroup.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } catch {
      // Error handled in mutation
    }
  };

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
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-200 w-full sm:w-auto justify-center font-semibold text-sm"
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
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
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
                  {/* Price not available in GroupDTO */}
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
        onClose={() => setIsModalOpen(false)}
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
             <label className="block text-sm font-semibold text-gray-700 mb-1">Jadval (kunlar va vaqt)</label>
             <input
              type="text"
              placeholder="Masalan: Dush-Chor-Juma 14:00"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
             />
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-1">Izoh</label>
             <textarea
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
             />
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all"
            >
              Saqlash
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Groups;
