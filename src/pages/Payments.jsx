import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../api/payments.api';
import { teachersApi } from '../api/teachers.api';
import { useAuth } from '../hooks/useAuth';
import { FiPlus, FiSearch, FiCreditCard, FiDollarSign, FiCheck, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { groupsApi } from '../api/groups.api';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';


/**
 * Payments Page - Backend bilan 100% mos
 * 
 * Backend PaymentDTO: {
 *   id, studentId, studentName, teacherId, teacherName,
 *   groupId, groupName, amount, paymentDate, method, notes, createdAt
 * }
 * 
 * Backend PaymentMethod: CASH | CARD | TRANSFER
 * 
 * Permissions:
 * - ADMIN: Can view ALL payments (Pending + Confirmed), confirm payments, view by teacher/student/group
 * - TEACHER: Can create payments, view own payments
 * - STUDENT: Can view own payments
 */

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

  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  
  const [editingPayment, setEditingPayment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, paymentId: null });

  // Fetch payments based on role
  const { data: payments = [], isLoading: loading } = useQuery({
    queryKey: ['payments', user?.role],
    queryFn: async () => {
      if (isAdmin) {
        // Admin sees ALL payments (via workaround fetching from teachers)
        const response = await paymentsApi.getAll();
        return response.data;
      } else if (isTeacher) {
        // Teacher sees their own payments
        const response = await paymentsApi.getTeacherPayments();
        return response.data;
      } else {
        // Student sees their own payments
        const response = await paymentsApi.getStudentPayments();
        return response.data;
      }
    },
    enabled: !!user,
  });



  const handleOpenModal = () => {
    if (!isTeacher && !isAdmin) {
      toast.error("Huquqingiz yo'q");
      return;
    }
    setEditingPayment(null);
    setIsModalOpen(true);
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setIsModalOpen(true);
  };

  const handleDelete = (paymentId) => {
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

  const filteredPayments = payments.filter(payment => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (payment.studentName?.toLowerCase() || '').includes(searchLower) ||
      (payment.teacherName?.toLowerCase() || '').includes(searchLower) ||
      (payment.groupName?.toLowerCase() || '').includes(searchLower);
    return matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:gap-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">To'lovlar</h1>
            <p className="text-gray-600 mt-1">
              {isAdmin ? "Barcha to'lovlar" : isTeacher ? "Mening to'lovlarim" : "Mening to'lovlarim"}
            </p>
          </div>
          {(isTeacher || isAdmin) && (
            <button
              onClick={handleOpenModal}
              className="cursor-pointer bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center font-medium"
            >
              <FiPlus /> Yangi To'lov
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Qidirish (talaba, o'qituvchi, guruh)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yuklanmoqda...</div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">To'lovlar topilmadi</div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="block sm:hidden space-y-4">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{payment.studentName}</h3>
                    <p className="text-xs text-gray-500">{payment.groupName}</p>
                  </div>
                  <span className="text-lg font-bold text-green-600 flex-shrink-0 ml-2">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">O'qituvchi:</span>
                    <span className="text-gray-900">{payment.teacherName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Usul:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      payment.method === 'CASH' ? 'bg-green-100 text-green-700' :
                      payment.method === 'CARD' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {payment.method === 'CASH' ? 'Naqd' : payment.method === 'CARD' ? 'Karta' : 'Transfer'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sana:</span>
                    <span className="text-gray-900">{formatDateTime(payment.paymentDate)}</span>
                  </div>
                </div>

                {/* Actions for Admin/Teacher */}
                {(isAdmin || isTeacher) && (
                  <div className="flex justify-end gap-2 border-t pt-3 mt-3">
                    <button
                      onClick={() => handleEdit(payment)}
                      className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Tahrirlash"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(payment.id)}
                      className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      title="O'chirish"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Talaba</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Guruh</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">O'qituvchi</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Summa</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Usul</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Sana</th>
                    {(isAdmin || isTeacher) && (
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Amallar</th>
                    )}

                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {payment.studentName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {payment.groupName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {payment.teacherName}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          payment.method === 'CASH' ? 'bg-green-100 text-green-700' :
                          payment.method === 'CARD' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {payment.method === 'CASH' ? 'Naqd' : payment.method === 'CARD' ? 'Karta' : 'Transfer'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDateTime(payment.paymentDate)}
                      </td>
                      {(isAdmin || isTeacher) && (
                        <td className="px-6 py-4 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(payment)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Tahrirlash"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(payment.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="O'chirish"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {isModalOpen && (
        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          payment={editingPayment}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, paymentId: null })}
        onConfirm={() => deleteMutation.mutate(deleteConfirm.paymentId)}
        title="To'lovni o'chirish"
        message="Haqiqatan ham bu to'lovni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        type="danger"
        loading={deleteMutation.isPending}
      />


    </div>
  );
};

/**
 * Payment Modal - Create or Edit payment
 * Backend CreatePaymentRequest: { studentId, groupId, amount, paymentDate, method, notes }
 * Backend UpdatePaymentRequest: { studentId, groupId, amount, paymentDate, method, notes }
 */
const PaymentModal = ({ isOpen, onClose, payment = null }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [formData, setFormData] = useState({
    studentId: payment?.studentId || '',
    groupId: payment?.groupId || '',
    amount: payment?.amount || '',
    paymentDate: payment?.paymentDate ? new Date(payment.paymentDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    method: payment?.method || 'CASH',
    notes: payment?.notes || '',
  });

  // Fetch groups based on role
  const { data: groups = [] } = useQuery({
    queryKey: ['payment-modal-groups', user?.role],
    queryFn: async () => {
      if (isAdmin) {
        const response = await groupsApi.getAdminGroups();
        return response.data;
      } else {
        const response = await teachersApi.getMyGroups();
        return response.data;
      }
    },
    enabled: isOpen,
  });

  // Fetch students for selected group
  const { data: students = [] } = useQuery({
    queryKey: ['payment-modal-students', formData.groupId],
    queryFn: async () => {
      if (!formData.groupId) return [];
      if (isAdmin) {
        const response = await groupsApi.getGroupStudents(formData.groupId);
        return response.data;
      } else {
        const response = await teachersApi.getGroupStudents(formData.groupId);
        return response.data;
      }
    },
    enabled: !!formData.groupId,
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (payment?.id) {
        return paymentsApi.update(payment.id, data, user.role);
      }
      return paymentsApi.create(data, user.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(payment ? "To'lov yangilandi" : "To'lov muvaffaqiyatli yaratildi");
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.groupId || !formData.studentId || !formData.amount) {
      toast.error("Barcha maydonlarni to'ldiring");
      return;
    }

    const payload = {
      studentId: Number(formData.studentId),
      groupId: Number(formData.groupId),
      amount: parseFloat(formData.amount),
      paymentDate: formData.paymentDate,
      method: formData.method,
      notes: formData.notes || ''
    };

    mutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={payment ? "To'lovni tahrirlash" : "Yangi To'lov"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Guruh</label>
          <select
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={formData.groupId}
            onChange={(e) => setFormData({ ...formData, groupId: e.target.value, studentId: '' })}
          >
            <option value="">Tanlang</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Talaba</label>
          <select
            required
            disabled={!formData.groupId}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100"
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
          >
            <option value="">Tanlang</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.fullName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">To'lov usuli</label>
          <div className="flex gap-4">
            <label className={`flex items-center gap-2 cursor-pointer p-3 border-2 rounded-lg transition-all hover:bg-gray-50 flex-1 ${
              formData.method === 'CASH' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="CASH"
                checked={formData.method === 'CASH'}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="w-4 h-4 text-blue-600 cursor-pointer"
              />
              <FiDollarSign className="text-green-600 text-xl" />
              <span className="font-medium text-gray-700">Naqd</span>
            </label>

            <label className={`flex items-center gap-2 cursor-pointer p-3 border-2 rounded-lg transition-all hover:bg-gray-50 flex-1 ${
              formData.method === 'CARD' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="CARD"
                checked={formData.method === 'CARD'}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="w-4 h-4 text-blue-600 cursor-pointer"
              />
              <FiCreditCard className="text-blue-600 text-xl" />
              <span className="font-medium text-gray-700">Karta</span>
            </label>

            <label className={`flex items-center gap-2 cursor-pointer p-3 border-2 rounded-lg transition-all hover:bg-gray-50 flex-1 ${
              formData.method === 'TRANSFER' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="TRANSFER"
                checked={formData.method === 'TRANSFER'}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="w-4 h-4 text-blue-600 cursor-pointer"
              />
              <span className="font-medium text-gray-700">Transfer</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To'lov sanasi</label>
          <input
            type="datetime-local"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={formData.paymentDate}
            onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Summa (UZS)</label>
          <input
            type="number"
            required
            min="0"
            step="1000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="500000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Izoh</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            rows="3"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Qo'shimcha izoh..."
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="cursor-pointer px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default Payments;