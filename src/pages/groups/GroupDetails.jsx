import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../../api/groups.api';
import { studentsApi } from '../../api/students.api';
import { teachersApi } from '../../api/teachers.api';
import { attendanceApi } from '../../api/attendance.api';
import { coinsApi } from '../../api/coins.api';
import { paymentsApi } from '../../api/payments.api';
import { useAuth } from '../../hooks/useAuth';
import {
  FiUsers,
  FiClock,
  FiUserPlus,
  FiTrash2,
  FiArrowLeft,
  FiMessageSquare,
  FiSearch,
  FiCheckCircle,
  FiAward,
  FiStar
} from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { parseDeleteError } from '../../utils/errorParser';
import toast from 'react-hot-toast';

const GroupDetails = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';
  
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [removeConfirm, setRemoveConfirm] = useState({ open: false, studentId: null, studentName: '' });

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceList, setAttendanceList] = useState({}); // { studentId: status }

  // Coin system states
  const [isCoinModalOpen, setIsCoinModalOpen] = useState(false);
  const [selectedStudentForCoin, setSelectedStudentForCoin] = useState(null);
  const [coinAmount, setCoinAmount] = useState(10);
  const [coinReason, setCoinReason] = useState('');

  // Fetch Group
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['group', id, user?.role],
    queryFn: async () => {
      if (user?.role === 'TEACHER') {
        const res = await teachersApi.getGroupById(id);
        return res.data;
      }
      if (user?.role === 'STUDENT') {
        const res = await studentsApi.getMyGroups();
        const group = res.data.find(g => g.id === Number(id));
        if (!group) throw new Error("Guruh topilmadi");
        return group;
      }
      const res = await groupsApi.getById(id);
      return res.data;
    },
    enabled: !!id
  });

  // Fetch Group Students
  const { data: groupStudents = [] } = useQuery({
    queryKey: ['groupStudents', id, user?.role],
    queryFn: async () => {
        if (user?.role === 'TEACHER') {
             const res = await teachersApi.getGroupStudents(id);
             return res.data;
        }
        if (user?.role === 'STUDENT') {
             return [];
        }
        const res = await groupsApi.getGroupStudents(id);
        return res.data;
    },
    enabled: !!id
  });

  // Fetch Leaderboard (Coin ranking)
  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard', id],
    queryFn: async () => {
      try {
        const res = isStudent 
          ? await coinsApi.getStudentGroupLeaderboard(id)
          : await coinsApi.getGroupLeaderboard(id);
        return res.data;
      } catch (error) {
        console.warn("Leaderboard fetching failed:", error);
        return [];
      }
    },
    enabled: !!id,
    retry: false
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

  // Fetch My Payments for this Group (Student only)
  const { data: groupPayments = [] } = useQuery({
    queryKey: ['myPayments', id],
    queryFn: async () => {
      const res = await paymentsApi.getStudentGroupPayments(id);
      return res.data;
    },
    enabled: !!id && isStudent
  });

  // Fetch My Coins for this Group (Student only)
  const { data: groupCoins = [] } = useQuery({
    queryKey: ['myCoins', id],
    queryFn: async () => {
      const res = await coinsApi.getMyCoinsByGroup(id);
      return res.data;
    },
    enabled: !!id && isStudent
  });

  // Fetch My Attendance for this Group (Student only)
  const { data: groupAttendance = [] } = useQuery({
    queryKey: ['myAttendance', id],
    queryFn: async () => {
      const res = await attendanceApi.getStudentGroupAttendance(id);
      return res.data;
    },
    enabled: !!id && isStudent
  });

  // Add student mutation
  const addStudentMutation = useMutation({
      mutationFn: ({ groupId, studentId }) => groupsApi.addStudent(groupId, studentId),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['groupStudents', id] });
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
          queryClient.invalidateQueries({ queryKey: ['groupStudents', id] });
          toast.success("O'quvchi guruhdan olib tashlandi");
      },
      onError: (err) => {
          console.error('Remove student error:', err);
          const msg = parseDeleteError(err, "O'quvchi");
          toast.error(msg, { duration: 5000 });
      }
  });

  // Award coins mutation
  const awardCoinsMutation = useMutation({
    mutationFn: (data) => coinsApi.award(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['leaderboard', id]);
      setIsCoinModalOpen(false);
      setSelectedStudentForCoin(null);
      setCoinAmount(10);
      setCoinReason('');
      toast.success("Coin muvaffaqiyatli berildi! 🎉");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Xatolik yuz berdi");
    }
  });

  const handleOpenCoinModal = (student) => {
    setSelectedStudentForCoin(student);
    setCoinAmount(10);
    setCoinReason('');
    setIsCoinModalOpen(true);
  };

  const handleAwardCoins = (e) => {
    e.preventDefault();
    if (!selectedStudentForCoin || coinAmount <= 0) return;
    
    awardCoinsMutation.mutate({
      studentId: selectedStudentForCoin.id,
      groupId: Number(id),
      amount: coinAmount,
      reason: coinReason || 'Yaxshi ishlagan uchun'
    });
  };

  const handleAddStudent = (e) => {
      e.preventDefault();
      if (!selectedStudentId) return;
      addStudentMutation.mutate({ groupId: id, studentId: selectedStudentId });
  };

  const handleRemoveStudent = (studentId, studentName) => {
    setRemoveConfirm({ open: true, studentId, studentName: studentName || 'Nomsiz' });
  };

  const confirmRemoveStudent = () => {
    removeStudentMutation.mutate({ groupId: id, studentId: removeConfirm.studentId });
    setRemoveConfirm({ open: false, studentId: null, studentName: '' });
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
      
      window.location.href = `sms:${cleanPhone}?body=${encodedMessage}`;
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {group.name} {isTeacher && <span className="text-sm font-normal text-gray-500 ml-2">(ID: {id})</span>}
                </h1>
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
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto mt-4 lg:mt-0">
               {leaderboard.length > 0 && (
                   <button
                       onClick={() => setIsLeaderboardModalOpen(true)}
                       className="flex-1 md:flex-none justify-center cursor-pointer flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-sm"
                   >
                       <FiStar /> Reyting
                   </button>
               )}
            </div>
        </div>
      </div>

      {/* Coin Modal */}
      <Modal
         isOpen={isLeaderboardModalOpen}
         onClose={() => setIsLeaderboardModalOpen(false)}
         title="Guruh Reytingi"
         maxWidth="max-w-md"
      >
        <div className="bg-white p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600"></div>
          
            {/* Leaderboard List - Unified View */}
            
            {/* Leaderboard List - Unified View */}
            <div className="flex flex-col gap-3">
              {leaderboard.map((entry, index) => (
                <div 
                  key={entry.studentId} 
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    index === 0 ? 'bg-gradient-to-r from-amber-50 to-white border-amber-200 shadow-sm' :
                    index === 1 ? 'bg-gradient-to-r from-gray-50 to-white border-gray-200 shadow-sm' :
                    index === 2 ? 'bg-gradient-to-r from-orange-50 to-white border-orange-200 shadow-sm' :
                    'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                   <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                           index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' :
                           index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                           index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white' :
                           'bg-gray-100 text-gray-500'
                      }`}>
                          {index < 3 ? (
                            index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'
                          ) : (
                            index + 1
                          )}
                      </div>
                      <div className="min-w-0 flex-1">
                           <h3 className={`font-bold truncate text-sm ${index < 3 ? 'text-gray-900' : 'text-gray-700'}`}>
                              {entry.studentName}
                           </h3>
                           {index === 0 && <span className="text-[10px] text-amber-600 font-medium block truncate">Guruh yetakchisi</span>}
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                       <div className={`px-2 py-1 rounded-full font-bold flex items-center gap-1 text-xs ${
                          index === 0 ? 'bg-amber-100 text-amber-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-50 text-blue-700'
                       }`}>
                          <span>{entry.totalCoins}</span>
                          <span className="text-[10px]">🪙</span>
                       </div>
                   </div>
                </div>
              ))}
            </div>
        </div>
      </Modal>

      {isStudent ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* My Payments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>💳</span> Mening To'lovlarim
                </h2>
                {groupPayments.length > 0 ? (
                    <div className="space-y-3">
                        {groupPayments.map(payment => (
                            <div key={payment.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-900">{payment.amount.toLocaleString()} UZS</p>
                                    <p className="text-xs text-gray-500">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                                </div>
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                    {payment.method}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">To'lovlar mavjud emas</p>
                )}
            </div>

            {/* My Coins */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>🪙</span> Mening Coinlarim
                </h2>
                {groupCoins.length > 0 ? (
                    <div className="space-y-3">
                        {groupCoins.map(coin => (
                            <div key={coin.id} className="p-3 bg-amber-50 rounded-lg flex justify-between items-center border border-amber-100">
                                <div>
                                    <p className="font-bold text-amber-700">+{coin.amount} Coin</p>
                                    <p className="text-xs text-amber-600/80">{coin.reason}</p>
                                </div>
                                <span className="text-xs text-amber-600/60 font-medium">
                                    {new Date(coin.awardedDate).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">Coinlar mavjud emas</p>
                )}
            </div>

            {/* My Attendance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-2">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📅</span> Mening Davomatim
                </h2>
                {groupAttendance.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {groupAttendance.map(att => (
                            <div key={att.id} className={`p-3 rounded-lg text-center flex flex-col justify-center items-center gap-1 border ${
                                att.status === 'PRESENT' ? 'bg-green-50 border-green-100 text-green-700' :
                                att.status === 'LATE' ? 'bg-yellow-50 border-yellow-100 text-yellow-700' :
                                att.status === 'EXCUSED' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                'bg-red-50 border-red-100 text-red-700'
                            }`}>
                                <span className="font-bold text-sm">
                                  {new Date(att.lessonDate).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' })}
                                </span>
                                <span className="text-xs font-semibold opacity-80 uppercase tracking-widest leading-none">
                                  {att.status === 'PRESENT' ? 'BOR' :
                                   att.status === 'LATE' ? 'KECH' :
                                   att.status === 'EXCUSED' ? 'SABABLI' : 'YO\'Q'}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">Davomat mavjud emas</p>
                )}
            </div>
        </div>
      ) : (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">Guruh o'quvchilari ({totalStudents})</h2>
            <div className="flex flex-wrap w-full md:w-auto gap-2">
                {(isAdmin || isTeacher) && (
                    <button
                        onClick={handleOpenAttendanceModal}
                        className="flex-1 md:flex-none justify-center cursor-pointer flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                    >
                        <FiCheckCircle /> Davomat
                    </button>
                )}
                {isAdmin && (
                    <button
                        onClick={() => setIsAddStudentModalOpen(true)}
                        className="flex-1 md:flex-none cursor-pointer flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                        <FiUserPlus />
                        <span className="hidden md:inline">O'quvchi qo'shish</span>
                        <span className="inline md:hidden">Qo'shish</span>
                    </button>
                )}
            </div>
        </div>

        {/* Mobile View - Cards */}
        <div className="block md:hidden space-y-4">
            {groupStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    Guruhda o'quvchilar yo'q
                </div>
            ) : (
                groupStudents.map((student) => (
                    <div key={student.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <Link to={`/students/${student.id}`} className="font-bold text-gray-900 hover:text-blue-600 block mb-1">
                                    {student.fullName}
                                </Link>
                                <div className="text-sm text-gray-500 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">📞</span> {student.phone || '-'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">✉️</span> {student.email || '-'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                            {isTeacher && (
                                <button
                                    onClick={() => handleOpenCoinModal(student)}
                                    className="cursor-pointer text-amber-600 hover:bg-amber-100 p-2 rounded-lg bg-white border border-gray-200 shadow-sm"
                                    title="Coin berish"
                                >
                                    <FiAward size={18} />
                                </button>
                            )}
                            <button
                                onClick={() => handleSendAbsentSms(student)}
                                className="cursor-pointer text-yellow-600 hover:bg-yellow-100 p-2 rounded-lg bg-white border border-gray-200 shadow-sm"
                                title="SMS"
                            >
                                <FiMessageSquare size={18} />
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => handleRemoveStudent(student.id, student.fullName)}
                                    className="cursor-pointer text-red-500 hover:bg-red-50 p-2 rounded-lg bg-white border border-gray-200 shadow-sm"
                                    title="Guruhdan o'chirish"
                                >
                                    <FiTrash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">F.I.SH</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Telefon</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Amallar</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {groupStudents.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="px-6 py-8 text-center text-gray-500">Guruhda o'quvchilar yo'q</td>
                        </tr>
                    ) : (
                        groupStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    <Link to={`/students/${student.id}`} className="hover:text-blue-600 hover:underline">
                                        {student.fullName}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {student.phone || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {student.email || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {isTeacher && (
                                            <button
                                                onClick={() => handleOpenCoinModal(student)}
                                                className="cursor-pointer text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 p-2 rounded-lg transition-colors"
                                                title="Coin berish"
                                            >
                                                <FiAward size={20} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleSendAbsentSms(student)}
                                            className="cursor-pointer text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 p-2 rounded-lg transition-colors"
                                            title="SMS"
                                        >
                                            <FiMessageSquare size={20} />
                                        </button>
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleRemoveStudent(student.id, student.fullName)}
                                                className="cursor-pointer text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
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
      )}

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

      {/* Coin Modal */}
      <Modal
        isOpen={isCoinModalOpen}
        onClose={() => setIsCoinModalOpen(false)}
        title={`${selectedStudentForCoin?.fullName} ga Coin berish`}
      >
        <form onSubmit={handleAwardCoins} className="space-y-4">
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="text-6xl">🪙</div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600">{coinAmount}</p>
              <p className="text-gray-500">Coin</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Miqdori</label>
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 15, 20, 25, 50].map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setCoinAmount(amount)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                    coinAmount === amount 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>
            
            <div className="mt-4 flex items-center gap-3">
              <button 
                  type="button"
                  onClick={() => setCoinAmount(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-600 hover:bg-gray-200"
              >
                  -
              </button>
              <input 
                  type="number"
                  min="1"
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(Number(e.target.value))}
                  className="flex-1 text-center font-bold text-xl py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <button 
                  type="button"
                  onClick={() => setCoinAmount(prev => prev + 1)}
                  className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-600 hover:bg-gray-200"
              >
                  +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sabab (ixtiyoriy)</label>
            <input
              type="text"
              value={coinReason}
              onChange={(e) => setCoinReason(e.target.value)}
              placeholder="Masalan: Faol qatnashgan"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsCoinModalOpen(false)}
              className="cursor-pointer px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={awardCoinsMutation.isPending}
              className="cursor-pointer px-6 py-2 text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <FiAward />
              {awardCoinsMutation.isPending ? 'Yuklanmoqda...' : 'Berish'}
            </button>
          </div>
        </form>
      </Modal>


      <ConfirmDialog
        isOpen={removeConfirm.open}
        title="O'quvchini guruhdan olib tashlash"
        message={`"${removeConfirm.studentName}" o'quvchisini guruhdan olib tashlamoqchimisiz?`}
        confirmText="Ha, olib tashlash"
        cancelText="Bekor qilish"
        variant="warning"
        onConfirm={confirmRemoveStudent}
        onCancel={() => setRemoveConfirm({ open: false, studentId: null, studentName: '' })}
        loading={removeStudentMutation.isPending}
      />
    </div>
  );
};

export default GroupDetails;
