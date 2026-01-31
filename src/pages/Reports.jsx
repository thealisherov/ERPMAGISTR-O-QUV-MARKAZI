import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports.api';
import { branchesApi } from '../api/branches.api';
import { paymentsApi } from '../api/payments.api';
import { useAuth } from '../hooks/useAuth';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiCalendar, FiMapPin, FiCreditCard } from 'react-icons/fi';

const Reports = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('financial'); // financial, payments, expenses

  // Date Range Filters
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Branch Selection for Super Admin
  const [selectedBranchId, setSelectedBranchId] = useState(user?.branchId || '');

  // Fetch Branches for Super Admin
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await branchesApi.getAll();
      return response.data;
    },
    enabled: user?.role === 'SUPER_ADMIN',
  });

  const { data: reportData, isLoading: loading } = useQuery({
    queryKey: ['reports', activeTab, startDate, endDate, selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId && user?.role === 'SUPER_ADMIN') return null;

      const params = { startDate, endDate, branchId: selectedBranchId };
      let response;

      if (activeTab === 'financial') {
        response = await reportsApi.getFinancialSummaryRange(params);
      } else if (activeTab === 'payments') {
        // Fetch detailed payments to calculate split on frontend,
        // OR fetch summary and if summary doesn't have split, fetch list.
        // The previous implementation used getPaymentsByRange which returns only total.
        // We need split. So we will fetch all payments in range and sum them here.
        // This is inefficient for large datasets but required since backend summary doesn't support it.
        const paymentsRes = await paymentsApi.getByDateRange(params);
        const payments = paymentsRes.data || [];

        const total = payments.reduce((sum, p) => sum + p.amount, 0);
        const cash = payments.filter(p => p.category === 'CASH').reduce((sum, p) => sum + p.amount, 0);
        const card = payments.filter(p => p.category === 'CARD').reduce((sum, p) => sum + p.amount, 0);

        return {
            totalPayments: total,
            cashTotal: cash,
            cardTotal: card,
            paymentsList: payments
        };
      } else if (activeTab === 'expenses') {
        response = await reportsApi.getExpensesByRange(params);
      }

      return response?.data;
    },
    enabled: !!startDate && !!endDate && (!!selectedBranchId || !!user?.branchId),
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Hisobotlar</h1>
        <p className="text-gray-600 mt-1">Moliya, to'lovlar va xarajatlar tahlili</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col gap-4">

        {/* Branch Selector for Super Admin */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="flex items-center gap-2 w-full md:w-1/3">
             <div className="relative w-full">
                <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="cursor-pointer pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  <option value="">Filialni tanlang</option>
                  {branches?.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
             </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
            {['financial', 'payments', 'expenses'].map((tab) => (
                <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                >
                {tab === 'financial' && 'Moliya'}
                {tab === 'payments' && 'To\'lovlar'}
                {tab === 'expenses' && 'Xarajatlar'}
                </button>
            ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-auto flex-1 md:flex-none">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className=" cursor-pointer pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <span className="text-gray-400 hidden sm:block">-</span>
            <div className="relative w-full sm:w-auto flex-1 md:flex-none">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="cursor-pointer pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Yuklanmoqda...</div>
      ) : !reportData && user?.role === 'SUPER_ADMIN' && !selectedBranchId ? (
          <div className="text-center py-12 text-gray-500">Hisobotlarni ko'rish uchun filialni tanlang</div>
      ) : !reportData ? (
          <div className="text-center py-12 text-gray-500">Ma'lumot topilmadi</div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'financial' && (
            <FinancialReport data={reportData} />
          )}
          {activeTab === 'payments' && (
            <PaymentsReport data={reportData} />
          )}
          {activeTab === 'expenses' && (
            <ExpensesReport data={reportData} />
          )}
        </div>
      )}
    </div>
  );
};

const FinancialReport = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-500 font-medium">Jami Kirim</h3>
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <FiTrendingUp className="text-green-600" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{data.totalIncome?.toLocaleString() || 0} UZS</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
         <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-500 font-medium">Jami Chiqim</h3>
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <FiTrendingDown className="text-red-600" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{data.totalExpenses?.toLocaleString() || 0} UZS</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
         <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-500 font-medium">Sof Foyda</h3>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <FiDollarSign className="text-blue-600" />
          </div>
        </div>
        <p className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {data.netProfit?.toLocaleString() || 0} UZS
        </p>
      </div>
    </div>
  );
};

const PaymentsReport = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Jami Tushum</h3>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <FiTrendingUp className="text-green-600" />
                </div>
            </div>
            <p className="text-2xl font-bold text-green-600">{data.totalPayments?.toLocaleString() || 0} UZS</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Naqd Pul</h3>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiDollarSign className="text-blue-600" />
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.cashTotal?.toLocaleString() || 0} UZS</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Karta Orqali</h3>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <FiCreditCard className="text-purple-600" />
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.cardTotal?.toLocaleString() || 0} UZS</p>
        </div>
    </div>
  );
};

const ExpensesReport = ({ data }) => {
  // Similar to payments, getExpenseRangeReport returns aggregate.
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-gray-500 font-medium mb-2">Doimiy Xarajatlar</h3>
            <p className="text-xl font-bold text-gray-900">{data.regularExpenses?.toLocaleString() || 0} UZS</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-gray-500 font-medium mb-2">Oylik To'lovlar (Ish haqi)</h3>
            <p className="text-xl font-bold text-gray-900">{data.salaryExpenses?.toLocaleString() || 0} UZS</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-gray-500 font-medium mb-2">Jami Xarajatlar</h3>
            <p className="text-xl font-bold text-red-600">{data.totalExpenses?.toLocaleString() || 0} UZS</p>
        </div>
    </div>
  );
};

export default Reports;
