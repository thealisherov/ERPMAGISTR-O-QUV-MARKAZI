import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { coinsApi } from '../../api/coins.api';
import { groupsApi } from '../../api/groups.api';
import { FiAward, FiCalendar, FiFilter, FiSearch, FiTrendingUp, FiX } from 'react-icons/fi';

// ── Week helper (Mon–Sun) ──
const getWeekRange = (offsetWeeks = 0) => {
  const now = new Date();
  const dow = now.getDay();
  const diff = (dow === 0 ? -6 : 1 - dow) + offsetWeeks * 7;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return { from: mon, to: sun };
};

const formatDate = (d) =>
  d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' });

const MEDALS = ['🥇', '🥈', '🥉'];

const GlobalLeaderboard = () => {
  const [filterMode, setFilterMode] = useState('ALL'); // ALL | WEEK | MONTH | CUSTOM
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [weekOffset, setWeekOffset] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');

  // 1. Fetch all groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['adminGroupsForLeaderboard'],
    queryFn: async () => {
      const res = await groupsApi.getAdminGroups();
      return (res.data || []).filter(g => g.status === 'ACTIVE');
    },
  });

  // 2. Fetch coins for each group
  const { data: allCoins = [], isLoading: coinsLoading } = useQuery({
    queryKey: ['globalCoins', groups.map(g => g.id).join(',')],
    queryFn: async () => {
      if (groups.length === 0) return [];
      const results = await Promise.all(
        groups.map(g =>
          coinsApi.getByGroup(g.id)
            .then(res => (res.data || []).map(c => ({ ...c, groupName: g.name })))
            .catch(() => [])
        )
      );
      return results.flat();
    },
    enabled: groups.length > 0,
  });

  // 3. Compute effective date range
  const effectiveRange = useMemo(() => {
    if (filterMode === 'ALL') return { from: null, to: null };
    if (filterMode === 'WEEK') return getWeekRange(weekOffset);
    if (filterMode === 'MONTH') {
      const [y, m] = selectedMonth.split('-').map(Number);
      return { from: new Date(y, m - 1, 1, 0, 0, 0), to: new Date(y, m, 0, 23, 59, 59, 999) };
    }
    // CUSTOM
    return {
      from: dateFrom ? (() => { const d = new Date(dateFrom); d.setHours(0,0,0,0); return d; })() : null,
      to: dateTo   ? (() => { const d = new Date(dateTo);   d.setHours(23,59,59,999); return d; })() : null,
    };
  }, [filterMode, weekOffset, selectedMonth, dateFrom, dateTo]);

  // 4. Filter coins by date + group, then aggregate by student
  const leaderboard = useMemo(() => {
    const { from, to } = effectiveRange;

    const filtered = allCoins.filter(coin => {
      const d = new Date(coin.awardedDate || coin.createdAt);
      if (from && d < from) return false;
      if (to   && d > to)   return false;
      if (selectedGroup !== 'ALL' && String(coin.groupId) !== String(selectedGroup)) return false;
      return true;
    });

    const map = {};
    filtered.forEach(coin => {
      const key = coin.studentId;
      if (!map[key]) {
        map[key] = {
          studentId: coin.studentId,
          studentName: coin.studentName || `Student #${coin.studentId}`,
          totalCoins: 0,
          groups: new Set(),
        };
      }
      map[key].totalCoins += Number(coin.amount || 0);
      if (coin.groupName) map[key].groups.add(coin.groupName);
    });

    return Object.values(map)
      .filter(e => e.totalCoins > 0)
      .sort((a, b) => b.totalCoins - a.totalCoins)
      .map(e => ({ ...e, groups: [...e.groups].join(', ') }));
  }, [allCoins, effectiveRange, selectedGroup]);

  // 5. Search filter
  const displayed = useMemo(() => {
    if (!searchTerm.trim()) return leaderboard;
    const t = searchTerm.toLowerCase();
    return leaderboard.filter(e =>
      e.studentName.toLowerCase().includes(t) ||
      e.groups.toLowerCase().includes(t)
    );
  }, [leaderboard, searchTerm]);

  const isLoading = groupsLoading || coinsLoading;

  const weekLabel = () => {
    const { from, to } = getWeekRange(weekOffset);
    if (weekOffset === 0) return 'Bu hafta';
    if (weekOffset === -1) return "O'tgan hafta";
    return `${formatDate(from)} – ${formatDate(to)}`;
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <span className="text-3xl">🏆</span> Global Reyting
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Barcha guruhlar bo'yicha o'quvchilar reytingi</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Jami o'quvchilar</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{leaderboard.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Jami coinlar</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {leaderboard.reduce((s, e) => s + e.totalCoins, 0)} 🪙
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 font-medium">Faol guruhlar</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{groups.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm space-y-4">
        {/* Period tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
          {[
            { key: 'ALL',    label: 'Hammasi' },
            { key: 'WEEK',   label: 'Haftalik' },
            { key: 'MONTH',  label: 'Oylik' },
            { key: 'CUSTOM', label: 'Custom' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setFilterMode(t.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                filterMode === t.key
                  ? 'bg-white shadow text-blue-600'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Week controls */}
        {filterMode === 'WEEK' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setWeekOffset(o => o - 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >← Oldingi</button>
            <span className="px-4 py-1.5 bg-blue-50 text-blue-700 font-semibold rounded-lg text-sm">
              {weekLabel()}
            </span>
            <button
              onClick={() => setWeekOffset(o => Math.min(o + 1, 0))}
              disabled={weekOffset === 0}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-40"
            >Keyingi →</button>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <FiX size={12} /> Reset
              </button>
            )}
          </div>
        )}

        {/* Month picker */}
        {filterMode === 'MONTH' && (
          <div className="flex items-center gap-3">
            <FiCalendar className="text-gray-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span className="text-sm text-gray-500">
              {new Date(selectedMonth + '-01').toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' })}
            </span>
          </div>
        )}

        {/* Custom date range */}
        {filterMode === 'CUSTOM' && (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Dan</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Gacha</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-2 rounded border border-red-200 hover:bg-red-50">
                <FiX size={12} /> Tozalash
              </button>
            )}
          </div>
        )}

        {/* Search + Group filter row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="O'quvchi qidirish..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          <select
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm min-w-[180px]"
          >
            <option value="ALL">Barcha guruhlar</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leaderboard table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Yuklanmoqda...</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">🏅</div>
          <p className="text-gray-500 font-medium">Bu davrda coin berilmagan</p>
          <p className="text-gray-400 text-sm mt-1">Boshqa davr yoki guruhni tanlang</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Top 3 podium */}
          {filterMode === 'ALL' || displayed.length >= 3 ? (
            <div className="p-6 bg-gradient-to-br from-amber-50 to-white border-b border-gray-100">
              <div className="flex items-end justify-center gap-3 sm:gap-6">
                {/* 2nd place */}
                {displayed[1] && (
                  <div className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                      {displayed[1].studentName?.charAt(0)}
                    </div>
                    <span className="text-2xl">🥈</span>
                    <p className="text-xs font-bold text-gray-700 text-center line-clamp-2">{displayed[1].studentName}</p>
                    <span className="bg-gray-100 text-gray-700 font-bold text-sm px-3 py-1 rounded-full">{displayed[1].totalCoins} 🪙</span>
                    <div className="w-full h-16 bg-gray-200 rounded-t-lg flex items-end justify-center pb-2">
                      <span className="text-xs font-bold text-gray-500">2</span>
                    </div>
                  </div>
                )}
                {/* 1st place */}
                {displayed[0] && (
                  <div className="flex flex-col items-center gap-2 flex-1 max-w-[140px]">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg ring-4 ring-amber-200">
                      {displayed[0].studentName?.charAt(0)}
                    </div>
                    <span className="text-3xl">🥇</span>
                    <p className="text-sm font-extrabold text-gray-900 text-center line-clamp-2">{displayed[0].studentName}</p>
                    <span className="bg-amber-100 text-amber-700 font-extrabold text-sm px-3 py-1 rounded-full">{displayed[0].totalCoins} 🪙</span>
                    <div className="w-full h-24 bg-gradient-to-t from-amber-400 to-amber-300 rounded-t-lg flex items-end justify-center pb-2">
                      <span className="text-xs font-bold text-amber-800">1</span>
                    </div>
                  </div>
                )}
                {/* 3rd place */}
                {displayed[2] && (
                  <div className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                      {displayed[2].studentName?.charAt(0)}
                    </div>
                    <span className="text-2xl">🥉</span>
                    <p className="text-xs font-bold text-gray-700 text-center line-clamp-2">{displayed[2].studentName}</p>
                    <span className="bg-orange-100 text-orange-700 font-bold text-sm px-3 py-1 rounded-full">{displayed[2].totalCoins} 🪙</span>
                    <div className="w-full h-12 bg-orange-200 rounded-t-lg flex items-end justify-center pb-2">
                      <span className="text-xs font-bold text-orange-600">3</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Full list */}
          <div className="divide-y divide-gray-100">
            {displayed.map((entry, index) => (
              <div
                key={entry.studentId}
                className={`flex items-center gap-4 px-4 sm:px-6 py-3.5 transition-colors hover:bg-gray-50/80 ${
                  index === 0 ? 'bg-amber-50/60' :
                  index === 1 ? 'bg-gray-50/60' :
                  index === 2 ? 'bg-orange-50/60' : ''
                }`}
              >
                {/* Rank */}
                <div className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow' :
                  index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow' :
                  index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {index < 3 ? MEDALS[index] : index + 1}
                </div>

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                  index === 0 ? 'bg-amber-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-400' :
                  'bg-blue-500'
                }`}>
                  {entry.studentName?.charAt(0)?.toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold truncate text-sm ${index < 3 ? 'text-gray-900' : 'text-gray-700'}`}>
                    {entry.studentName}
                  </p>
                  {entry.groups && (
                    <p className="text-xs text-gray-400 truncate">{entry.groups}</p>
                  )}
                </div>

                {/* Coins badge */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm flex-shrink-0 ${
                  index === 0 ? 'bg-amber-100 text-amber-700' :
                  index === 1 ? 'bg-gray-100 text-gray-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  <span>{entry.totalCoins}</span>
                  <span>🪙</span>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-3 text-xs text-gray-400 border-t border-gray-100 flex justify-between">
            <span>Jami: {displayed.length} o'quvchi</span>
            <span>Barcha coinlar: {displayed.reduce((s, e) => s + e.totalCoins, 0)} 🪙</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalLeaderboard;
