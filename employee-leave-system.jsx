import React, { useState, useEffect } from 'react';
import { Calendar, Users, FileText, Clock, Clipboard, LogOut, Download, Plus, Edit2, Trash2, Check, Bell } from 'lucide-react';

// 初始化資料
const initialData = {
  users: [
    {
      id: 'E001',
      username: 'admin',
      password: 'admin123',
      name: '管理員',
      region: '台北',
      department: '管理部',
      position: '經理',
      email: 'admin@company.com',
      phone: '0912-345-678',
      birthday: '1980-01-01',
      shift: ['早'],
      isAdmin: true,
      annualLeave: 14,
      usedAnnualLeave: 0
    },
    {
      id: 'E002',
      username: 'user001',
      password: 'pass123',
      name: '王小明',
      region: '台北',
      department: '業務部',
      position: '專員',
      email: 'wang@company.com',
      phone: '0923-456-789',
      birthday: '1990-05-15',
      shift: ['早', '晚'],
      isAdmin: false,
      annualLeave: 10,
      usedAnnualLeave: 2
    }
  ],
  leaves: [],
  compensatoryLeaves: [],
  schedules: [],
  vacationSettings: {
    openStart: '',
   openEnd: '',
    monthlyVacationDays: ''
  },
  vacationSchedule: {},
  vacationNotes: {},
  auditLogs: []
};

// 國定假日資料
const holidays2026 = [
  { date: '2026-01-01', name: '元旦' },
  { date: '2026-02-15', name: '小年夜' },
  { date: '2026-02-16', name: '農曆除夕' },
  { date: '2026-02-17', name: '春節初一' },
  { date: '2026-02-18', name: '春節初二' },
  { date: '2026-02-19', name: '春節初三' },
  { date: '2026-02-27', name: '和平紀念日前一日' },
  { date: '2026-02-28', name: '和平紀念日' },
  { date: '2026-04-03', name: '兒童節' },
  { date: '2026-04-04', name: '清明節' },
  { date: '2026-06-25', name: '端午節' },
  { date: '2026-10-01', name: '中秋節' },
  { date: '2026-10-10', name: '國慶日' }
];

const EmployeeLeaveSystem = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('management');
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('leaveSystemData');
    if (!saved) return initialData;
    const parsed = JSON.parse(saved);
    return {
      ...initialData,
      ...parsed,
      vacationSettings: {
        ...initialData.vacationSettings,
        ...parsed.vacationSettings
      },
      vacationSchedule: parsed.vacationSchedule || {},
      vacationNotes: parsed.vacationNotes || {}
    };
  });

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filterRegion, setFilterRegion] = useState('全部');
  const [filterDepartment, setFilterDepartment] = useState('全部');
  const [filterShift, setFilterShift] = useState('全部');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedVacationMarker, setSelectedVacationMarker] = useState('▲');
  const [newLeaveForm, setNewLeaveForm] = useState({
    type: '特休',
    startDate: '',
    endDate: '',
    reason: '',
    hours: 8
  });

  // 儲存資料到 localStorage
  useEffect(() => {
    localStorage.setItem('leaveSystemData', JSON.stringify(data));
  }, [data]);

  // 登入處理
  const handleLogin = (e) => {
    e.preventDefault();
    const user = data.users.find(
      u => u.username === loginForm.username && u.password === loginForm.password
    );
    if (user) {
      setCurrentUser(user);
      setLoginForm({ username: '', password: '' });
    } else {
      alert('帳號或密碼錯誤');
    }
  };

  // 登出
  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('management');
  };

  // 新增/編輯員工
  const handleSaveUser = (userData) => {
    if (editingUser) {
      setData(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === editingUser.id ? { ...u, ...userData } : u),
        auditLogs: [...prev.auditLogs, {
          timestamp: new Date().toISOString(),
          user: currentUser.name,
          action: '編輯員工',
          target: userData.name,
          details: `修改員工資料`
        }]
      }));
    } else {
      const newUser = {
        ...userData,
        id: 'E' + String(data.users.length + 1).padStart(3, '0'),
        isAdmin: false,
        annualLeave: 10,
        usedAnnualLeave: 0
      };
      setData(prev => ({
        ...prev,
        users: [...prev.users, newUser],
        auditLogs: [...prev.auditLogs, {
          timestamp: new Date().toISOString(),
          user: currentUser.name,
          action: '新增員工',
          target: userData.name,
          details: `新增員工資料`
        }]
      }));
    }
    setShowAddUser(false);
    setEditingUser(null);
  };

  // 刪除員工
  const handleDeleteUser = (userId) => {
    if (confirm('確定要刪除此員工嗎?')) {
      const user = data.users.find(u => u.id === userId);
      setData(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== userId),
        auditLogs: [...prev.auditLogs, {
          timestamp: new Date().toISOString(),
          user: currentUser.name,
          action: '刪除員工',
          target: user.name,
          details: `刪除員工資料`
        }]
      }));
    }
  };

  // 送出請假申請
  const handleSubmitLeave = (e) => {
    e.preventDefault();
    const newLeave = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      department: currentUser.department,
      region: currentUser.region,
      ...newLeaveForm,
      status: '待審核',
      submittedAt: new Date().toISOString()
    };
    
    setData(prev => ({
      ...prev,
      leaves: [...prev.leaves, newLeave],
      auditLogs: [...prev.auditLogs, {
        timestamp: new Date().toISOString(),
        user: currentUser.name,
        action: '送出請假申請',
        target: currentUser.name,
        details: `${newLeaveForm.type} ${newLeaveForm.startDate} ~ ${newLeaveForm.endDate}`
      }]
    }));
    
    setNewLeaveForm({
      type: '特休',
      startDate: '',
      endDate: '',
      reason: '',
      hours: 8
    });
    
    alert('請假申請已送出,等待管理員核准');
  };

  // 核准/拒絕請假
  const handleApproveLeave = (leaveId, status) => {
    const leave = data.leaves.find(l => l.id === leaveId);
    setData(prev => ({
      ...prev,
      leaves: prev.leaves.map(l => 
        l.id === leaveId ? { ...l, status, approvedBy: currentUser.name, approvedAt: new Date().toISOString() } : l
      ),
      auditLogs: [...prev.auditLogs, {
        timestamp: new Date().toISOString(),
        user: currentUser.name,
        action: status === '已核准' ? '核准請假' : '拒絕請假',
        target: leave.userName,
        details: `${leave.type} ${leave.startDate} ~ ${leave.endDate}`
      }]
    }));
  };

  // 匯出 Excel (簡易 CSV)
  const exportToCSV = (dataType) => {
    let csvContent = '';
    let filename = '';
    
    if (dataType === 'users') {
      csvContent = '員工代號,姓名,地區,部門,職稱,Email,電話,生日,班別\n';
      data.users.forEach(u => {
        csvContent += `${u.id},${u.name},${u.region},${u.department},${u.position},${u.email},${u.phone},${u.birthday},${u.shift.join('/')}\n`;
      });
      filename = '員工資料.csv';
    } else if (dataType === 'leaves') {
      csvContent = '員工,部門,假別,開始日期,結束日期,時數,狀態\n';
      data.leaves.forEach(l => {
        csvContent += `${l.userName},${l.department},${l.type},${l.startDate},${l.endDate},${l.hours},${l.status}\n`;
      });
      filename = '請假紀錄.csv';
    }
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // 取得月份的日期陣列
  const getMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  // 檢查是否為假日
  const isHoliday = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays2026.find(h => h.date === dateStr);
  };

  const isWithinOpenRange = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const { openStart, openEnd } = data.vacationSettings;
    if (!openStart || !openEnd) return false;
    return dateStr >= openStart && dateStr <= openEnd;
  };

  const handleVacationSettingChange = (field, value) => {
    setData(prev => ({
      ...prev,
      vacationSettings: {
        ...prev.vacationSettings,
        [field]: value
      }
    }));
  };

  const handleToggleVacation = (userId, dateStr) => {
    if (!data.vacationSettings.openStart || !data.vacationSettings.openEnd) return;
    const isOpen = dateStr >= data.vacationSettings.openStart && dateStr <= data.vacationSettings.openEnd;
    if (!isOpen) return;
    if (currentUser.id !== userId) return;
    setData(prev => {
      const userSchedule = prev.vacationSchedule[userId] || {};
      const currentMarker = userSchedule[dateStr];
      const nextMarker = currentMarker === selectedVacationMarker ? '' : selectedVacationMarker;
      return {
        ...prev,
        vacationSchedule: {
          ...prev.vacationSchedule,
          [userId]: {
            ...userSchedule,
            [dateStr]: nextMarker
          }
        }
      };
    });
  };

  const handleVacationNoteChange = (userId, value) => {
    setData(prev => ({
      ...prev,
      vacationNotes: {
        ...prev.vacationNotes,
        [userId]: value
      }
    }));
  };

  // 檢查是否為週末
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // 計算當天上班人數
  const getWorkingCount = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const leavesOnDate = data.leaves.filter(l => 
      l.status === '已核准' && 
      dateStr >= l.startDate && 
      dateStr <= l.endDate
    );
    return data.users.length - leavesOnDate.length;
  };

  // 登入頁面
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 text-base md:text-lg">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">員工假勤系統</h1>
            <p className="text-gray-500 mt-2">請使用帳號密碼登入</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
             <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">帳號</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="請輸入帳號"
                required
              />
            </div>
            
            <div>
             <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">密碼</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="請輸入密碼"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              登入
            </button>
          </form>
          
           <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm md:text-base text-gray-600">
            <p className="font-medium mb-1">測試帳號:</p>
            <p>管理員 - 帳號: admin / 密碼: admin123</p>
            <p>一般員工 - 帳號: user001 / 密碼: pass123</p>
          </div>
        </div>
      </div>
    );
  }

  // 主系統介面
  return (
    <div className="min-h-screen bg-gray-50 text-base md:text-lg">
      {/* 頂部導航 */}
      <nav className="bg-white shadow-sm border-b">
       <div className="max-w-screen-2xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <Users className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">員工假勤系統</h1>
                <p className="text-sm md:text-base text-gray-500">歡迎, {currentUser.name} {currentUser.isAdmin && '(管理員)'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm md:text-base text-gray-600">可休特休</p>
                <p className="text-lg font-bold text-indigo-600">
                  {currentUser.annualLeave - currentUser.usedAnnualLeave} 天
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <LogOut size={18} />
                <span>登出</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 功能選單 */}
      <div className="bg-white border-b">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'management', label: '人員管理', icon: Users, admin: true },
              { id: 'vacation', label: '休假表', icon: Calendar },
              { id: 'compensatory', label: '補休表', icon: Clock },
              { id: 'schedule', label: '排程表', icon: Clipboard },
              { id: 'leave', label: '請假', icon: FileText },
              { id: 'annual', label: '特休', icon: Calendar }
            ].map(tab => {
              if (tab.admin && !currentUser.isAdmin) return null;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 主要內容區 */}
       <div className="max-w-screen-2xl mx-auto px-4 py-6">
        
        {/* 人員管理 */}
        {activeTab === 'management' && currentUser.isAdmin && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">人員管理</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => exportToCSV('users')}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download size={18} />
                  <span>匯出Excel</span>
                </button>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus size={18} />
                  <span>新增員工</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">員工代號</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">地區</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">部門</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">職稱</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">電話</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">生日</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">班別</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                         <td className="px-4 py-3 text-sm md:text-base">{user.id}</td>
                        <td className="px-4 py-3 text-sm md:text-base font-medium">{user.name}</td>
                        <td className="px-4 py-3 text-sm md:text-base">{user.region}</td>
                        <td className="px-4 py-3 text-sm md:text-base">{user.department}</td>
                        <td className="px-4 py-3 text-sm md:text-base">{user.position}</td>
                        <td className="px-4 py-3 text-sm md:text-base">{user.email}</td>
                        <td className="px-4 py-3 text-sm md:text-base">{user.phone}</td>
                        <td className="px-4 py-3 text-sm md:text-base">{user.birthday}</td>
                        <td className="px-4 py-3 text-sm md:text-base">
                          <div className="flex space-x-1">
                            {user.shift.includes('早') && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">早</span>
                            )}
                            {user.shift.includes('晚') && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">晚</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm md:text-base">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setShowAddUser(true);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 操作紀錄 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-bold mb-4">操作紀錄</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.auditLogs.slice(-10).reverse().map((log, idx) => (
                   <div key={idx} className="text-sm md:text-base p-2 bg-gray-50 rounded">
                    <span className="text-gray-500">{new Date(log.timestamp).toLocaleString('zh-TW')}</span>
                    {' - '}
                    <span className="font-medium">{log.user}</span>
                    {' '}
                    <span className="text-indigo-600">{log.action}</span>
                    {' - '}
                    <span>{log.details}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 休假表 */}
        {activeTab === 'vacation' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">休假表</h2>
              <div className="flex space-x-2">
                <select
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option>全部</option>
                  <option>台北</option>
                  <option>台中</option>
                  <option>高雄</option>
                </select>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option>全部</option>
                  <option>管理部</option>
                  <option>業務部</option>
                  <option>技術部</option>
                </select>
                <select
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option>全部</option>
                  <option>早</option>
                  <option>晚</option>
                </select>
                <button
                  onClick={() => exportToCSV('leaves')}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download size={18} />
                  <span>匯出Excel</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
                     {currentUser.isAdmin && (
                <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                   <p className="text-sm md:text-base font-medium text-indigo-700 mb-2">班表開放日期設定 (管理員)</p>
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm md:text-base text-gray-700">開始</label>
                      <input
                        type="date"
                        value={data.vacationSettings.openStart}
                        onChange={(e) => handleVacationSettingChange('openStart', e.target.value)}
                        className="px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm md:text-base text-gray-700">結束</label>
                      <input
                        type="date"
                        value={data.vacationSettings.openEnd}
                        onChange={(e) => handleVacationSettingChange('openEnd', e.target.value)}
                        className="px-3 py-2 border rounded-lg"
                      />
                    </div>
                     <div className="flex items-center space-x-2">
                      <label className="text-sm md:text-base text-gray-700">本月可休天數</label>
                      <input
                        type="number"
                        min="0"
                        value={data.vacationSettings.monthlyVacationDays}
                        onChange={(e) => handleVacationSettingChange('monthlyVacationDays', e.target.value)}
                        className="w-24 px-3 py-2 border rounded-lg"
                      />
                      <span className="text-sm md:text-base text-gray-600">天</span>
                    </div>
                    <span className="text-xs text-gray-600">
                      開放期間內員工可自行編輯休假日
                    </span>
                  </div>
                </div>
              )}
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm md:text-base text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-700">休假符號:</span>
                  <button
                    onClick={() => setSelectedVacationMarker('▲')}
                    className={`px-2 py-1 rounded border ${selectedVacationMarker === '▲' ? 'border-gray-800 bg-gray-100' : 'border-gray-200'}`}
                  >
                    <span className="text-gray-900 font-bold">▲</span> 黑色
                  </button>
                  <button
                    onClick={() => setSelectedVacationMarker('★')}
                    className={`px-2 py-1 rounded border ${selectedVacationMarker === '★' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                  >
                    <span className="text-red-600 font-bold">★</span> 紅色
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  {data.vacationSettings.openStart && data.vacationSettings.openEnd
                    ? `開放期間: ${data.vacationSettings.openStart} ~ ${data.vacationSettings.openEnd}`
                    : '尚未設定開放日期'}
                </div>
                 <div className="text-sm md:text-base text-gray-600">
                  本月可休: {data.vacationSettings.monthlyVacationDays || '未設定'} 天
                </div>
              </div>
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  上個月
                </button>
                <h3 className="text-xl font-bold">
                  {selectedMonth.getFullYear()}年 {selectedMonth.getMonth() + 1}月
                </h3>
                <button
                  onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  下個月
                </button>
              </div>

                <div>
                <table className="w-full border-collapse table-fixed text-sm md:text-base">
                  <thead>
                    <tr>
                     <th className="border p-2 bg-gray-50 sticky left-0 z-10 w-28">員工</th>
                      {getMonthDays(selectedMonth).map(day => {
                        const holiday = isHoliday(day);
                        const weekend = isWeekend(day);
                        return (
                          <th
                            key={day.toISOString()}
                            className={`border p-2 min-w-[4.5rem] ${
                              holiday ? 'bg-red-100 text-red-800' :
                              weekend ? 'bg-blue-50 text-blue-800' :
                              'bg-gray-50'
                            }`}
                          >
                           <div className="text-sm md:text-base font-semibold">{day.getDate()}</div>
                            <div className="text-sm md:text-base font-normal">
                              {holiday ? holiday.name : ['日','一','二','三','四','五','六'][day.getDay()]}
                            </div>
                           <div className="text-xs md:text-sm font-normal text-green-600">
                              {getWorkingCount(day)}人
                            </div>
                          </th>
                        );
                      })}
                         <th className="border p-2 bg-gray-50 w-20 text-sm md:text-base">已選天數</th>
                      <th className="border p-2 bg-gray-50 w-40 text-sm md:text-base">國定假日/星期/日期/備註</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users
                      .filter(u => 
                        (filterRegion === '全部' || u.region === filterRegion) &&
                        (filterDepartment === '全部' || u.department === filterDepartment) &&
                        (filterShift === '全部' || u.shift.includes(filterShift))
                      )
                      .map(user => {
                        const userLeaves = data.leaves.filter(l => 
                          l.userId === user.id && 
                          l.status === '已核准' &&
                          new Date(l.startDate).getMonth() === selectedMonth.getMonth()
                        );
                        
                        return (
                          <tr key={user.id}>
                            <td className="border p-2 font-medium bg-white sticky left-0 z-10 text-sm md:text-base">
                              {user.name}
                              <div className="text-xs md:text-sm text-gray-500">{user.department}</div>
                            </td>
                            {getMonthDays(selectedMonth).map(day => {
                              const dateStr = day.toISOString().split('T')[0];
                              const leave = userLeaves.find(l => 
                                dateStr >= l.startDate && dateStr <= l.endDate
                              );
                             const customMarker = data.vacationSchedule[user.id]?.[dateStr];
                              const isOpen = isWithinOpenRange(day);
                              const isEditable = isOpen && currentUser.id === user.id;
                              
                              return (
                                <td
                                  key={day.toISOString()}
                                  onClick={() => handleToggleVacation(user.id, dateStr)}
                                  className={`border p-2 min-w-[4.5rem] text-center ${
                                    leave ? 'bg-orange-100 text-orange-800 font-medium' : ''
                                    } ${isEditable ? 'cursor-pointer hover:bg-indigo-50' : ''}`}
                                >
                                    {leave ? (
                                    <span className="text-purple-700 font-semibold">請</span>
                                  ) : customMarker ? (
                                    <span className={customMarker === '★' ? 'text-red-600 font-bold' : 'text-gray-900 font-bold'}>
                                      {customMarker}
                                    </span>
                                  ) : (
                                    ''
                                  )}
                                </td>
                              );
                            })}
                            <td className="border p-2 text-center font-medium text-indigo-600 text-sm md:text-base">
                                     {(data.vacationSchedule[user.id] && Object.values(data.vacationSchedule[user.id]).filter(Boolean).length) || 0}
                            </td>
                            <td className="border p-2">
                              <input
                                type="text"
                                value={data.vacationNotes[user.id] || ''}
                                onChange={(e) => handleVacationNoteChange(user.id, e.target.value)}
                                className={`w-full px-2 py-1 border rounded text-sm md:text-base ${
                                  currentUser.isAdmin || currentUser.id === user.id ? '' : 'bg-gray-50'
                                }`}
                                disabled={!currentUser.isAdmin && currentUser.id !== user.id}
                                placeholder="可輸入備註"
                              />
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 請假申請 */}
        {activeTab === 'leave' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">請假申請</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 申請表單 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold mb-4">新增請假</h3>
                <form onSubmit={handleSubmitLeave} className="space-y-4">
                  <div>
                    <label className="block text-sm md:text-base font-medium mb-1">申請人</label>
                    <input
                      type="text"
                      value={currentUser.name}
                      disabled
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm md:text-base font-medium mb-1">假別</label>
                    <select
                      value={newLeaveForm.type}
                      onChange={(e) => setNewLeaveForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    >
                      <option>特休</option>
                      <option>病假</option>
                      <option>事假</option>
                      <option>旅遊假</option>
                      <option>喪假</option>
                      <option>生理假</option>
                      <option>補休(時)</option>
                      <option>補休(天)</option>
                      <option>年假</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm md:text-base font-medium mb-1">開始日期</label>
                    <input
                      type="date"
                      value={newLeaveForm.startDate}
                      onChange={(e) => setNewLeaveForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm md:text-base font-medium mb-1">結束日期</label>
                    <input
                      type="date"
                      value={newLeaveForm.endDate}
                      onChange={(e) => setNewLeaveForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  
                  <div>
                     <label className="block text-sm md:text-base font-medium mb-1">時數</label>
                    <input
                      type="number"
                      value={newLeaveForm.hours}
                      onChange={(e) => setNewLeaveForm(prev => ({ ...prev, hours: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="1"
                      max="8"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm md:text-base font-medium mb-1">請假事由</label>
                    <textarea
                      value={newLeaveForm.reason}
                      onChange={(e) => setNewLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="3"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                  >
                    送出申請
                  </button>
                </form>
              </div>

              {/* 申請紀錄 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold mb-4">我的申請紀錄</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.leaves
                    .filter(l => l.userId === currentUser.id)
                    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                    .map(leave => (
                      <div key={leave.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium">{leave.type}</span>
                            <span className="text-sm md:text-base text-gray-500 ml-2">
                              {leave.startDate} ~ {leave.endDate}
                            </span>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded ${
                            leave.status === '已核准' ? 'bg-green-100 text-green-800' :
                            leave.status === '已拒絕' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {leave.status}
                          </span>
                        </div>
                        <p className="text-sm md:text-base text-gray-600">{leave.reason}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          申請時間: {new Date(leave.submittedAt).toLocaleString('zh-TW')}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* 管理員審核區 */}
            {currentUser.isAdmin && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">待審核請假 (管理員)</h3>
                  <Bell className="text-orange-500" size={20} />
                </div>
                <div className="space-y-3">
                  {data.leaves
                    .filter(l => l.status === '待審核')
                    .map(leave => (
                      <div key={leave.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{leave.userName} - {leave.type}</p>
                            <p className="text-sm md:text-base text-gray-600">{leave.department} / {leave.region}</p>
                            <p className="text-sm md:text-base text-gray-600 mt-1">
                              {leave.startDate} ~ {leave.endDate} ({leave.hours}小時)
                            </p>
                             <p className="text-sm md:text-base text-gray-500 mt-1">{leave.reason}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveLeave(leave.id, '已核准')}
                              className="px-3 py-1 bg-green-600 text-white text-sm md:text-base rounded hover:bg-green-700"
                            >
                              核准
                            </button>
                            <button
                              onClick={() => handleApproveLeave(leave.id, '已拒絕')}
                              className="px-3 py-1 bg-red-600 text-white text-sm md:text-base rounded hover:bg-red-700"
                            >
                              拒絕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  {data.leaves.filter(l => l.status === '待審核').length === 0 && (
                    <p className="text-center text-gray-500 py-4">目前沒有待審核的請假申請</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 特休總覽 */}
        {activeTab === 'annual' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">特休總覽</h2>
              <div className="flex space-x-2">
                <select
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option>全部</option>
                  <option>台北</option>
                  <option>台中</option>
                  <option>高雄</option>
                </select>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option>全部</option>
                  <option>管理部</option>
                  <option>業務部</option>
                  <option>技術部</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">員工</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">部門</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">地區</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">總特休</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">已使用</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">剩餘</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">使用日期</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.users
                    .filter(u => 
                      (filterRegion === '全部' || u.region === filterRegion) &&
                      (filterDepartment === '全部' || u.department === filterDepartment)
                    )
                    .map(user => {
                      const annualLeaves = data.leaves.filter(l => 
                        l.userId === user.id && 
                        l.type === '特休' && 
                        l.status === '已核准'
                      );
                      
                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm md:text-base font-medium">{user.name}</td>
                          <td className="px-4 py-3 text-sm md:text-base">{user.department}</td>
                          <td className="px-4 py-3 text-sm md:text-base">{user.region}</td>
                          <td className="px-4 py-3 text-sm md:text-base">{user.annualLeave} 天</td>
                          <td className="px-4 py-3 text-sm md:text-base text-orange-600">{annualLeaves.length} 天</td>
                          <td className="px-4 py-3 text-sm md:text-base">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-medium">
                              {user.annualLeave - annualLeaves.length} 天
                            </span>
                          </td>
                           <td className="px-4 py-3 text-sm md:text-base">
                            <div className="space-y-1">
                              {annualLeaves.map(leave => (
                                <div key={leave.id} className="text-xs text-gray-600">
                                  {leave.startDate} ~ {leave.endDate}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 補休表 */}
        {activeTab === 'compensatory' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">補休表</h2>
            <p className="text-gray-500">補休功能開發中...</p>
          </div>
        )}

        {/* 排程表 */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">排程表</h2>
            <p className="text-gray-500">排程功能開發中...</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default EmployeeLeaveSystem;
