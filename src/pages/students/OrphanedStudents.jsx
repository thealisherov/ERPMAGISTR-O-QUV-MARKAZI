import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { studentsApi } from '../../api/students.api';
import { groupsApi } from '../../api/groups.api';
import toast from 'react-hot-toast';
import { FiUsers, FiUserCheck, FiAlertTriangle, FiUser, FiPhone, FiMail } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const OrphanedStudents = () => {
  const [orphanedStudents, setOrphanedStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsRes, groupsRes] = await Promise.all([
        studentsApi.getOrphanedStudents(),
        groupsApi.getAdminGroups()
      ]);
      setOrphanedStudents(studentsRes.data);
      setGroups(groupsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Ma\'lumotlarni yuklashda xatolik yuz berdi!');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (studentId, groupId) => {
    if (!groupId) {
      toast.error('Iltimos, guruh tanlang!');
      return;
    }
    
    try {
      await groupsApi.addStudent(groupId, studentId);
      toast.success('O\'quvchi guruhga muvaffaqiyatli qo\'shildi!');
      const studentsRes = await studentsApi.getOrphanedStudents();
      setOrphanedStudents(studentsRes.data);
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error(error.response?.data?.message || 'Guruhga qo\'shishda xatolik!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FiAlertTriangle className="text-orange-500" />
            Guruhsiz O'quvchilar
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Guruhga biriktirilmagan o'quvchilarni guruhlarga qo'shish
          </p>
        </div>
        <button 
          onClick={() => navigate('/students')}
          className="cursor-pointer w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors shadow-sm"
        >
          Barcha o'quvchilar
        </button>
      </div>

      {orphanedStudents.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <FiUserCheck className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-green-800 mb-2">Ajoyib!</h3>
          <p className="text-green-600">Barcha o'quvchilar guruhlarga biriktirilgan. Guruhsiz o'quvchilar mavjud emas.</p>
        </div>
      ) : (
        <>
          <div className="p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-xl mb-4 flex items-center gap-3">
            <FiAlertTriangle className="text-orange-500 h-5 w-5 flex-shrink-0" />
            <span className="text-orange-700 font-medium text-sm sm:text-base">
              Diqqat! {orphanedStudents.length} ta o'quvchi hech qanday guruhga biriktirilmagan.
            </span>
          </div>

          {/* Mobile Cards */}
          <div className="block sm:hidden space-y-4">
            {orphanedStudents.map((student) => (
              <OrphanedStudentCard 
                key={student.id} 
                student={student} 
                groups={groups} 
                onEnroll={handleEnroll} 
              />
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F.I.SH</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon / Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guruh Tanlash</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orphanedStudents.map((student) => (
                    <OrphanedStudentRow 
                      key={student.id} 
                      student={student} 
                      groups={groups} 
                      onEnroll={handleEnroll} 
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Mobile Card Component
const OrphanedStudentCard = ({ student, groups, onEnroll }) => {
  const [selectedGroupId, setSelectedGroupId] = useState('');

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
          <FiUser className="text-orange-600" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{student.fullName}</h3>
          <p className="text-xs text-gray-500">ID: #{student.id}</p>
        </div>
      </div>

      <div className="space-y-1 mb-3 text-sm">
        <p className="text-gray-600 flex items-center gap-2">
          <FiPhone className="text-gray-400 flex-shrink-0" /> {student.phone || '-'}
        </p>
        <p className="text-gray-600 flex items-center gap-2 truncate">
          <FiMail className="text-gray-400 flex-shrink-0" /> <span className="truncate">{student.email || '-'}</span>
        </p>
      </div>

      <div className="space-y-3 border-t pt-3">
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="cursor-pointer w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="">-- Guruh tanlang --</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name} ({group.teacherName})
            </option>
          ))}
        </select>
        <button
          onClick={() => onEnroll(student.id, selectedGroupId)}
          disabled={!selectedGroupId}
          className={`cursor-pointer w-full py-2 px-4 text-sm font-medium rounded-lg text-white transition-all ${
            !selectedGroupId 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Guruhga Qo'shish
        </button>
      </div>
    </div>
  );
};

// Desktop Table Row
const OrphanedStudentRow = ({ student, groups, onEnroll }) => {
  const [selectedGroupId, setSelectedGroupId] = useState('');

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{student.id}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="font-medium text-gray-900">{student.fullName}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{student.phone}</div>
        <div className="text-sm text-gray-500">{student.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="cursor-pointer block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">-- Guruh tanlang --</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name} ({group.teacherName})
            </option>
          ))}
        </select>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => onEnroll(student.id, selectedGroupId)}
          disabled={!selectedGroupId}
          className={`cursor-pointer inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white transition-all
            ${!selectedGroupId 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
        >
          Guruhga Qo'shish
        </button>
      </td>
    </tr>
  );
};

export default OrphanedStudents;
