import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../../api/groups.api';
import { studentsApi } from '../../api/students.api';
import { attendanceApi } from '../../api/attendance.api';
import { useAuth } from '../../hooks/useAuth';
import {
  FiUsers,
  FiClock,
  FiUserPlus,
  FiTrash2,
  FiArrowLeft,
  FiMessageSquare,
  FiSearch,
  FiCheckCircle
} from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const GroupDetails = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceList, setAttendanceList] = useState({}); // { studentId: status }

  // Fetch Group
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => {
      const res = await groupsApi.getById(id);
      return res.data;
    },
    enabled: !!id
  });

  // Fetch Group Students
  const { data: groupStudents = [] } = useQuery({
    queryKey: ['groupStudents', id],
    queryFn: async () => {
        const res = await groupsApi.getGroupStudents(id);
        return res.data;
    },
    enabled: !!id
  });

  // Fetch All Students (for adding)
  const { data: allStudents = [] } = useQuery({
      queryKey: ['allStudents'],
      queryFn: async () => {
          const res = await studentsApi.getAll();
          return res.data;
      },
      enabled: isAddStudentModalOpen && isAdmin
  });

  // Add student mutation
  const addStudentMutation = useMutation({
      mutationFn: ({ groupId, studentId }) => groupsApi.addStudent(groupId, studentId),
      onSuccess: () => {
          queryClient.invalidateQueries(['groupStudents', id]);
          setIsAddStudentModalOpen(false);
          setSelectedStudentId('');
          setStudentSearchTerm('');
          toast.success("O'quvchi guruhga qo'shildi");
      },
      onError: (err) => {
          toast.error(err.response?.data?.message || "Xatolik yuz berdi");
      }
  });

  // Remove student mutation
  const removeStudentMutation = useMutation({
      mutationFn: ({ groupId, studentId }) => groupsApi.removeStudent(groupId, studentId),
      onSuccess: () => {
          queryClient.invalidateQueries(['groupStudents', id]);
          toast.success("O'quvchi guruhdan olib tashlandi");
      },
      onError: (err) => {
          toast.error(err.response?.data?.message || "Xatolik yuz berdi");
      }
  });

  const handleAddStudent = (e) => {
      e.preventDefault();
      if (!selectedStudentId) return;
      addStudentMutation.mutate({ groupId: id, studentId: selectedStudentId });
  };

  const handleRemoveStudent = (studentId) => {
      if (window.confirm("Haqiqatan ham bu o'quvchini guruhdan olib tashlamoqchimisiz?")) {
          removeStudentMutation.mutate({ groupId: id, studentId });
      }
  };

  const handleAttendanceSubmit = async () => {
      try {
          const promises = Object.entries(attendanceList).map(([studentId, status]) => {
             // Skip if no status selected (though usually default is PRESENT)
             return attendanceApi.mark({
                 studentId: Number(studentId),
                 groupId: Number(id),
                 lessonDate: new Date(attendanceDate).toISOString(),
                 status: status, // PRESENT, ABSENT, LATE, EXCUSED
                 notes: ''
             });
          });

          await Promise.all(promises);
          toast.success("Davomat saqlandi");
          setIsAttendanceModalOpen(false);
      } catch (error) {
          console.error("Attendance error", error);
          toast.error("Davomatni saqlashda xatolik");
      }
  };

  const handleOpenAttendanceModal = () => {
      const initialAttendance = {};
      groupStudents.forEach(s => {
          initialAttendance[s.id] = 'PRESENT';
      });
      setAttendanceList(initialAttendance);
      setAttendanceDate(new Date().toISOString().split('T')[0]);
      setIsAttendanceModalOpen(true);
  };

  const handleSendAbsentSms = (student) => {
      const phone = student.phone;
      if (!phone) {
          toast.error("Telefon raqam topilmadi");
          return;
      }
      const cleanPhone = phone.replace(/\s/g, '');
      const message = `Assalomu alaykum. ${student.fullName} bugun darsga qatnashmadi.`;
      const encodedMessage = encodeURIComponent(message);
      window.location.assign(`sms:${cleanPhone}?body=${encodedMessage}`);
  };

  if (groupLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!group) {
    return <div className="p-6 text-center text-gray-500">Guruh topilmadi</div>;
  }

  const totalStudents = groupStudents.length;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <Link to="/groups" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors">
        <FiArrowLeft /> Guruhlarga qaytish
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
                <p className="text-gray-600 mb-4">{group.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <FiUsers className="text-blue-500" />
                        <span>O'qituvchi: <strong>{group.teacherName}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FiClock className="text-green-500" />
                        <span>Jadval: {group.schedule}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">Guruh o'quvchilari ({totalStudents})</h2>
            <div className="flex w-full md:w-auto gap-2">
                {(isAdmin || isTeacher) && (
                    <button
                        onClick={handleOpenAttendanceModal}
                        className="flex-1 md:flex-none justify-center cursor-pointer flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <FiCheckCircle /> Davomat
                    </button>
                )}
                {isAdmin && (
                    <button
                        onClick={() => setIsAddStudentModalOpen(true)}
                        className="flex-1 md:flex-none cursor-pointer flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <FiUserPlus />
                        <span className="hidden md:inline">O'quvchi qo'shish</span>
                    </button>
                )}
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-4 md:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">F.I.SH</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Telefon</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Email</th>
                        <th className="px-4 md:px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right md:text-left">Amallar</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {groupStudents.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="px-4 md:px-6 py-4 text-center text-gray-500">Guruhda o'quvchilar yo'q</td>
                        </tr>
                    ) : (
                        groupStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-4 md:px-6 py-4 text-sm font-medium text-gray-900">
                                    {student.fullName}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                                    {student.phone || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                                    {student.email || '-'}
                                </td>
                                <td className="px-4 md:px-6 py-4 text-sm">
                                    <div className="flex items-center justify-end md:justify-start gap-2">
                                        <button
                                            onClick={() => handleSendAbsentSms(student)}
                                            className="cursor-pointer text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 p-2 rounded-lg transition-colors"
                                            title="SMS"
                                        >
                                            <FiMessageSquare size={20} />
                                        </button>
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleRemoveStudent(student.id)}
                                                className="cursor-pointer text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors hidden md:block"
                                                title="Guruhdan o'chirish"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        )}
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
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title="Davomat qilish"
      >
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sana</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                   <div className="flex justify-between items-center px-2 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg sticky top-0">
                        <span className="text-xs font-semibold text-gray-500 uppercase">O'quvchi</span>
                        <span className="text-xs font-semibold text-gray-500 uppercase">Status</span>
                   </div>
                   <div className="divide-y divide-gray-100">
                       {groupStudents.map(student => (
                           <div 
                                key={student.id}
                                className="flex justify-between items-center px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
                                onClick={() => {
                                    const currentStatus = attendanceList[student.id];
                                    const newStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
                                    setAttendanceList(prev => ({ ...prev, [student.id]: newStatus }));
                                }}
                           >
                               <span className="text-base font-medium text-gray-900">{student.fullName}</span>
                               <label className="flex items-center gap-3 cursor-pointer pointer-events-none">
                                    <div className={`w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${attendanceList[student.id] === 'PRESENT' ? 'bg-green-500' : 'bg-gray-300'}`}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${attendanceList[student.id] === 'PRESENT' ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </div>
                                    <span className={`text-sm font-bold w-8 ${attendanceList[student.id] === 'PRESENT' ? 'text-green-600' : 'text-red-600'}`}>
                                        {attendanceList[student.id] === 'PRESENT' ? 'BOR' : 'YO\'Q'}
                                    </span>
                               </label>
                           </div>
                       ))}
                   </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                type="button"
                onClick={() => setIsAttendanceModalOpen(false)}
                className="cursor-pointer px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                Bekor qilish
                </button>
                <button
                onClick={handleAttendanceSubmit}
                className="cursor-pointer px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                Saqlash
                </button>
            </div>
          </div>
      </Modal>

      <Modal
        isOpen={isAddStudentModalOpen}
        onClose={() => {
            setIsAddStudentModalOpen(false);
            setStudentSearchTerm('');
        }}
        title="O'quvchi qo'shish"
      >
          <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qidirish</label>
                  <div className="relative mb-3">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                          type="text"
                          placeholder="Ism yoki telefon orqali qidirish..."
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={studentSearchTerm}
                          onChange={(e) => setStudentSearchTerm(e.target.value)}
                      />
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">O'quvchini tanlang</label>
                  <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      size={5}
                  >
                      <option value="">Tanlang</option>
                      {allStudents
                        .filter(s => !groupStudents.some(existing => existing.id === s.id))
                        .filter(s => 
                            s.fullName?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                            s.phone?.includes(studentSearchTerm)
                        )
                        .map(student => (
                          <option key={student.id} value={student.id}>
                              {student.fullName} ({student.phone})
                          </option>
                      ))}
                  </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                type="button"
                onClick={() => {
                    setIsAddStudentModalOpen(false);
                    setStudentSearchTerm('');
                }}
                className="cursor-pointer px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                Bekor qilish
                </button>
                <button
                type="submit"
                disabled={addStudentMutation.isLoading}
                className="cursor-pointer px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                {addStudentMutation.isLoading ? 'Yuklanmoqda...' : 'Qo\'shish'}
                </button>
            </div>
          </form>
      </Modal>
    </div>
  );
};

export default GroupDetails;
