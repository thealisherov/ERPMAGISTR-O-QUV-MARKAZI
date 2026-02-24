import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../api/payments.api';
import { teachersApi } from '../api/teachers.api';
import { studentsApi } from '../api/students.api';
import { useAuth } from '../hooks/useAuth';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiUser, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { groupsApi } from '../api/groups.api';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

const MONTHLY_FEE = 320000; // Fixed monthly fee for now

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0 UZS';
  const number = Number(amount);
  if (isNaN(number)) return '0 UZS';
  const rounded = Math.round(number);
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(rounded);
};

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const Payments = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter state for Month Selection
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // ALL, PAID, PARTIAL, UNPAID

  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';
  
  const [viewMode, setViewMode] = useState('STATUS'); // 'STATUS' | 'LOGS'
  
  const [editingPayment, setEditingPayment] = useState(null);
  const [preSelectedStudent, setPreSelectedStudent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, paymentId: null });

  // 1. Fetch Data
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', user?.role],
    queryFn: async () => {
      if (isAdmin) return (await paymentsApi.getAll()).data;
      if (isTeacher) return (await paymentsApi.getTeacherPayments()).data;
      return (await paymentsApi.getStudentPayments()).data;
    },
    enabled: !!user,
    refetchInterval: 10000 // Real-time background data fetching
  });

  const { data: myStudents = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['myStudents', user?.role],
    queryFn: async () => {
      if (isAdmin) return (await studentsApi.getAll()).data;
      if (isTeacher) return (await teachersApi.getMyStudents()).data;
      return [];
    },
    enabled: isTeacher || isAdmin,
  });

  // 2. Data Processing for Teacher View (Student Status)
  const studentStatusList = useMemo(() => {
    if (isStudent) return [];

    const [yearStr, monthStr] = selectedMonth.split('-');
    const filterYear = parseInt(yearStr);
    const filterMonth = parseInt(monthStr) - 1; // JS months are 0-indexed

    return myStudents.map(student => {
      // Find payments for this student
      const studentPayments = payments.filter(p => p.studentId === student.id);
      
      // Calculate total paid this month
      const currentMonthPayments = studentPayments.filter(p => {
        const d = new Date(p.paymentDate);
        return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
      });

      const paidThisMonth = currentMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const debt = Math.max(0, MONTHLY_FEE - paidThisMonth);
      
      let status = 'UNPAID';
      if (paidThisMonth >= MONTHLY_FEE) status = 'PAID';
      else if (paidThisMonth > 0) status = 'PARTIAL';
      
      // Get the ID of the main payment for this month (if any) to allow editing/deleting
      const monthPayment = currentMonthPayments.length > 0 ? currentMonthPayments[0] : null;

      const groupNames = student.groupName || student.groups?.map(g => g.name || g).join(', ') || '-';

      return {
        ...student,
        groupNames,
        paidThisMonth,
        debt,
        status,
        monthPayment, // The payment object for this month, if exists
        lastPaymentDate: studentPayments.length > 0 ? studentPayments[0].paymentDate : null
      };
    });
  }, [myStudents, payments, isTeacher, selectedMonth]);

  const filteredData = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const [yearStr, monthStr] = selectedMonth.split('-');
    const filterYear = parseInt(yearStr);
    const filterMonth = parseInt(monthStr) - 1;

    if ((isTeacher) || (isAdmin && viewMode === 'STATUS')) {
      return studentStatusList.filter(s => {
        const matchesSearch = (s.fullName?.toLowerCase() || '').includes(searchLower) ||
                              (s.phone?.toLowerCase() || '').includes(searchLower);
        const matchesStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
        return matchesSearch && matchesStatus;
      });
    }
    
    return payments.filter(payment => {
        const d = new Date(payment.paymentDate);
        const matchesMonth = d.getFullYear() === filterYear && d.getMonth() === filterMonth;
        
        const matchesSearch = (
          (payment.studentName?.toLowerCase() || '').includes(searchLower) ||
          (payment.teacherName?.toLowerCase() || '').includes(searchLower) ||
          (payment.groupName?.toLowerCase() || '').includes(searchLower)
        );
        
        let matchesStatus = true;
        if (selectedStatus !== 'ALL') {
             // For individual payments, if amount >= MONTHLY_FEE it's PAID, else PARTIAL
             const pStatus = Number(payment.amount) >= MONTHLY_FEE ? 'PAID' : 'PARTIAL';
             // UNPAID payments don't exist in logs (since they are logs of actual payments)
             matchesStatus = (pStatus === selectedStatus);
        }
        
        return matchesMonth && matchesSearch && matchesStatus;
    });
  }, [searchTerm, isTeacher, studentStatusList, payments, selectedMonth, selectedStatus, isAdmin, viewMode]);

  // Generators
  const handleOpenModal = () => {
    setEditingPayment(null);
    setPreSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handlePayForStudent = (student) => {
    setEditingPayment(null);
    setPreSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setPreSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleDeletePayment = (paymentId) => {
    setDeleteConfirm({ open: true, paymentId });
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => paymentsApi.delete(id, user.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success("To'lov o'chirildi");
      setDeleteConfirm({ open: false, paymentId: null });
    },
    onError: (error) => {
      toast.error("O'chirishda xatolik");
    },
  });

  if (paymentsLoading || (isTeacher && studentsLoading)) {
    return <div className="text-center py-12 text-gray-500">Yuklanmoqda...</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:gap-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">To'lovlar</h1>
            <p className="text-gray-600 mt-1">
              {isTeacher ? "O'quvchilar to'lov holati" : isAdmin ? "To'lovlarni boshqarish" : "Mening to'lovlarim"}
            </p>
          </div>
          {!isStudent && (
            <button
              onClick={handleOpenModal}
              className="cursor-pointer bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center font-medium"
            >
              <FiPlus /> Yangi To'lov
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
            {isAdmin && (
              <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setViewMode('STATUS')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'STATUS' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                  >Holat</button>
                  <button 
                    onClick={() => setViewMode('LOGS')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'LOGS' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                  >Tarix</button>
              </div>
            )}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={isTeacher || (isAdmin && viewMode === 'STATUS') ? "O'quvchi qidirish..." : "Qidirish..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {((isTeacher) || (isAdmin && viewMode === 'STATUS')) && (
                <>
                  <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[140px]"
                  >
                      <option value="ALL">Barcha statuslar</option>
                      <option value="PAID">To'liq to'langan</option>
                      <option value="PARTIAL">Qisman to'langan</option>
                      <option value="UNPAID">To'lanmagan</option>
                  </select>
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiCalendar className="text-gray-400" />
                      </div>
                      <input
                          type="month"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      />
                  </div>
                </>
            )}
        </div>
      </div>

      {(isTeacher || (isAdmin && viewMode === 'STATUS')) ? (
        // TEACHER / ADMIN STATUS VIEW: Student Status List with Month Filter
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">O'quvchi</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Telefon</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Guruhlar</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-green-700">To'lagan ({selectedMonth})</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-red-600">Qarzdorlik</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">O'quvchilar topilmadi</td>
                  </tr>
                ) : (
                  filteredData.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                                {student.fullName?.charAt(0)}
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900">{student.fullName}</div>
                                <div className="text-xs text-gray-500">{student.phone}</div>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{student.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.groupNames}</td>
                      <td className="px-6 py-4 text-sm text-green-600 font-bold">{formatCurrency(student.paidThisMonth)}</td>
                      <td className="px-6 py-4 text-sm text-red-600 font-bold">{formatCurrency(student.debt)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          student.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                          student.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {student.status === 'PAID' ? "To'liq" : student.status === 'PARTIAL' ? 'Qisman' : "To'lamagan"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         {student.status === 'PAID' && student.monthPayment ? (
                             <div className="flex items-center justify-end gap-2">
                                 <button
                                     onClick={() => handleEditPayment(student.monthPayment)}
                                     className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                     title="Tahrirlash"
                                 >
                                     <FiEdit2 size={16} />
                                 </button>
                                 <button
                                     onClick={() => handleDeletePayment(student.monthPayment.id)}
                                     className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                     title="O'chirish"
                                 >
                                     <FiTrash2 size={16} />
                                 </button>
                             </div>
                         ) : (
                             <button
                               onClick={() => handlePayForStudent(student)}
                               className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors shadow-sm"
                             >
                               To'lov
                             </button>
                         )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // ADMIN / STUDENT VIEW: Payments Log
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Talaba</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Guruh</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Summa</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Usul</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">To'lov Oyi</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">To'langan Vaqt</th>
                    {isAdmin && <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Amallar</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.length === 0 ? (
                     <tr><td colSpan="7" className="text-center py-8 text-gray-500">To'lovlar topilmadi</td></tr>
                  ) : (
                    filteredData.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{payment.studentName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{payment.groupName}</td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600">{formatCurrency(payment.amount)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          payment.method === 'CASH' ? 'bg-green-100 text-green-700' :
                          payment.method === 'CARD' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {payment.method === 'CASH' ? 'Naqd' : payment.method === 'CARD' ? 'Karta' : 'Transfer'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">
                        {new Date(payment.paymentDate).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(payment.createdAt || payment.paymentDate)}</td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-sm text-right">
                          <button onClick={() => handleEditPayment(payment)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-2"><FiEdit2 /></button>
                          <button onClick={() => handleDeletePayment(payment.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 /></button>
                        </td>
                      )}
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
        </div>
      )}

      {isModalOpen && (
        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          payment={editingPayment}
          preSelectedStudent={preSelectedStudent}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, paymentId: null })}
        onConfirm={() => deleteMutation.mutate(deleteConfirm.paymentId)}
        title="To'lovni o'chirish"
        message="Haqiqatan ham bu to'lovni o'chirmoqchimisiz?"
        confirmText="O'chirish"
        type="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

// Payment Modal Component
const PaymentModal = ({ isOpen, onClose, payment = null, preSelectedStudent = null }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [formData, setFormData] = useState({
    studentId: payment?.studentId || preSelectedStudent?.id || '',
    groupId: payment?.groupId || '',
    amount: payment?.amount || MONTHLY_FEE,
    paymentDate: payment?.paymentDate ? new Date(payment.paymentDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    method: payment?.method || 'CASH',
    notes: payment?.notes || '',
  });

  // Fetch groups
  const { data: groups = [] } = useQuery({
    queryKey: ['payment-modal-groups', user?.role],
    queryFn: async () => {
      const res = isAdmin ? await groupsApi.getAdminGroups() : await teachersApi.getMyGroups();
      return res.data;
    },
    enabled: isOpen,
  });

  // Fetch students for selected group
  const { data: students = [] } = useQuery({
    queryKey: ['payment-modal-students', formData.groupId],
    queryFn: async () => {
      if (!formData.groupId) return [];
      const res = isAdmin ? await groupsApi.getGroupStudents(formData.groupId) : await teachersApi.getGroupStudents(formData.groupId);
      return res.data;
    },
    enabled: !!formData.groupId,
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (payment?.id) return paymentsApi.update(payment.id, data, user.role);
      return paymentsApi.create(data, user.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(payment ? "To'lov yangilandi" : "To'lov qabul qilindi");
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.groupId || !formData.studentId || !formData.amount) {
      toast.error("Ma'lumotlar to'liq emas");
      return;
    }
    mutation.mutate({
      ...formData,
      studentId: Number(formData.studentId),
      groupId: Number(formData.groupId),
      amount: parseFloat(formData.amount),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={payment ? "To'lovni tahrirlash" : preSelectedStudent ? `${preSelectedStudent.fullName} uchun to'lov` : "Yangi to'lov"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Guruh</label>
          <select
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.groupId}
            onChange={(e) => setFormData({ ...formData, groupId: e.target.value, studentId: '' })}
          >
            <option value="">Tanlang</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Talaba</label>
           <select
             required
             disabled={!formData.groupId && !preSelectedStudent} 
             className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
             value={formData.studentId}
             onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
           >
             <option value="">Tanlang</option>
             {students.map(s => (
               <option key={s.id} value={s.id}>{s.fullName}</option>
             ))}
           </select>
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Summa (UZS)</label>
           <input 
             type="number"
             required
             className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
             value={formData.amount}
             onChange={(e) => setFormData({...formData, amount: e.target.value})}
           />
        </div>
        
        {/* Methods */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To'lov usuli</label>
          <div className="flex gap-4">
            {['CASH', 'CARD', 'TRANSFER'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setFormData({...formData, method: m})}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  formData.method === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {m === 'CASH' ? 'Naqd' : m === 'CARD' ? 'Karta' : 'Transfer'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">To'lov qaysi oy uchun?</label>
               <input 
                 type="month"
                 required
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                 value={formData.paymentDate.slice(0, 7)}
                 onChange={(e) => {
                     const newMonth = e.target.value;
                     const timePart = formData.paymentDate.slice(11, 16) || "12:00";
                     setFormData({...formData, paymentDate: `${newMonth}-01T${timePart}`});
                 }}
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Hujjat sanasi va vaqti</label>
               <input 
                 type="datetime-local"
                 required
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                 value={formData.paymentDate}
                 onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
               />
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Izoh</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            rows="3"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Qo'shimcha izoh..."
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
           <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Bekor qilish</button>
           <button type="submit" disabled={mutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">{mutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}</button>
        </div>

      </form>
    </Modal>
  );
};

export default Payments;