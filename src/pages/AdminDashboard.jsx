import { useEffect, useState } from 'react'
import {
    getPendingRequests, approveRequest,
    getAllUsers, createUser, changeUserRole, changeUserDept,
    getShiftTypes, addShiftType, updateShiftType, deleteShiftType,
    getAllSchedules, getDutyWeek, autoScheduleDuty, updateDuty,
    getAdminWindowStatus, openWindow, closeWindow,
} from '../api/scheduleApi'
import Navbar from '../components/Navbar.jsx'
import DutyTable from '../components/DutyTable.jsx'
import DepartmentScheduleGrid from '../components/DepartmentScheduleGrid.jsx'
import AdminReportView from '../components/AdminReportView.jsx'
import AdminDutyRules from '../components/AdminDutyRules.jsx'
import { shiftSolid } from '../constants/colors.js'
import { parseJwt } from '../utils/jwt.js'
import dayjs from 'dayjs'

const DEPT_LABEL = {
    CASHIER: 'Cashier', SALES: 'Sales',
    WAREHOUSE: 'Warehouse', MARKETING: 'Marketing',
    TECHNICIAN: 'Technician'
}

const DEPT_COLOR = {
    CASHIER:    'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
    SALES:      'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
    WAREHOUSE:  'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    MARKETING:  'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
    TECHNICIAN: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300',
}

const TABS = [
    { key: 'schedule', label: '📅 Xếp lịch'  },
    { key: 'duty',     label: '🗓️ Lịch trực' },
    { key: 'report',   label: '📸 Báo cáo'   },
    { key: 'users',    label: '👥 Nhân viên' },
    { key: 'shifts',   label: '⚙️ Ca làm'    },
    { key: 'dutyRules',label: '🧩 Điều kiện' },
]

const EMPTY_NEW_USER = { name: '', email: '', password: '', department: 'SALES', role: 'EMPLOYEE' }

export default function AdminDashboard() {
    const [tab, setTab] = useState('schedule')
    const [requests, setRequests] = useState([])
    const [users, setUsers] = useState([])
    const [shiftTypes, setShiftTypes] = useState([])
    const [duties, setDuties] = useState([])
    const [allSchedules, setAllSchedules] = useState({ shifts: [], duties: [] })
    const [weekStart, setWeekStart] = useState(
        dayjs().startOf('week').add(1,'week').format('YYYY-MM-DD'))
    const [newShift, setNewShift] = useState({
        code: '', name: '', startTime: '', endTime: '', isPartTime: false })
    const [editDuty, setEditDuty] = useState(null)
    const [editUser, setEditUser] = useState(null)
    const [newUser, setNewUser] = useState(EMPTY_NEW_USER)
    const [addingUser, setAddingUser] = useState(false)
    const [approvingAll, setApprovingAll] = useState(false)
    const [windowInfo, setWindowInfo] = useState(null)

    const token = localStorage.getItem('token')
    const payload = parseJwt(token)

    const fetchBase = async () => {
        const [rRes, uRes, stRes, wRes] = await Promise.allSettled([
            getPendingRequests(), getAllUsers(), getShiftTypes(), getAdminWindowStatus(),
        ])
        if (rRes.status === 'fulfilled') setRequests(rRes.value.data || [])
        else console.error('getPendingRequests failed:', rRes.reason)

        if (uRes.status === 'fulfilled') setUsers(uRes.value.data || [])
        else console.error('getAllUsers failed:', uRes.reason)

        if (stRes.status === 'fulfilled') setShiftTypes(stRes.value.data || [])
        else console.error('getShiftTypes failed:', stRes.reason)

        if (wRes.status === 'fulfilled') setWindowInfo(wRes.value.data)
        else console.error('getAdminWindowStatus failed:', wRes.reason)
    }

    const fetchWeek = async () => {
        const [dRes, sRes] = await Promise.allSettled([
            getDutyWeek(weekStart),
            getAllSchedules(weekStart)
        ])
        if (dRes.status === 'fulfilled') setDuties(dRes.value.data || [])
        else console.error('getDutyWeek failed:', dRes.reason)

        if (sRes.status === 'fulfilled') {
            setAllSchedules(sRes.value.data || { shifts: [], duties: [] })
        } else {
            console.error('getAllSchedules failed:', sRes.reason)
        }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { fetchBase() }, [])
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    useEffect(() => { fetchWeek() }, [weekStart])

    const handleApproveAll = async () => {
        if (!confirm(`Duyệt tất cả ${requests.length} yêu cầu? Không thể hoàn tác!`)) return
        setApprovingAll(true)
        try {
            for (const r of requests) {
                await approveRequest(r.id)
            }
        } catch (err) {
            console.error('Duyệt all failed:', err)
        }
        await fetchBase()
        setApprovingAll(false)
    }

    const handleToggleWindow = async () => {
        if (windowInfo?.canRegister) await closeWindow()
        else await openWindow()
        await fetchBase()
    }

    const handleAutoSchedule = async () => {
        if (!confirm(`Xếp lịch trực tự động tuần ${weekStart}?`)) return
        await autoScheduleDuty(weekStart)
        await fetchWeek()
    }

    const handleSaveDuty = async () => {
        if (!editDuty) return
        await updateDuty(editDuty.id, {
            userId: String(editDuty.userId), note: editDuty.note
        })
        setEditDuty(null)
        await fetchWeek()
    }

    const handleAddShift = async () => {
        if (!newShift.code || !newShift.startTime || !newShift.endTime) return
        await addShiftType(newShift)
        setNewShift({code:'',name:'',startTime:'',endTime:'',isPartTime:false})
        await fetchBase()
    }

    const handleSaveUser = async () => {
        if (!editUser) return
        await changeUserRole(editUser.id, editUser.role)
        if (editUser.department) {
            await changeUserDept(editUser.id, editUser.department)
        }
        setEditUser(null)
        await fetchBase()
    }

    const handleCreateUser = async () => {
        if (!newUser.name || !newUser.email) {
            alert('Vui lòng nhập tên và email!')
            return
        }
        setAddingUser(true)
        try {
            await createUser(newUser)
            setNewUser(EMPTY_NEW_USER)
            await fetchBase()
        } catch (err) {
            alert(err.response?.data || 'Không tạo được tài khoản, thử lại.')
        }
        setAddingUser(false)
    }

    const employees = users.filter(u => u.role === 'EMPLOYEE')

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
            <Navbar name={payload.name || 'Admin'} role="ADMIN"/>
            <div className="max-w-5xl mx-auto px-3 py-4 animate-fade-in-up">

                {/* Stats — 1 dải gọn thay vì 3 card rời rạc */}
                <div className="flex bg-white dark:bg-slate-800/60 rounded-2xl mb-3
              shadow-sm shadow-slate-900/5 border border-slate-100 dark:border-slate-700
              divide-x divide-slate-100 dark:divide-slate-700 overflow-hidden">
                    {[
                        { label: 'Chờ duyệt', value: requests.length,   color: 'text-amber-500' },
                        { label: 'Nhân viên', value: employees.length,  color: 'text-sky-500'   },
                        { label: 'Loại ca',   value: shiftTypes.length, color: 'text-indigo-500'},
                    ].map(s => (
                        <div key={s.label} className="flex-1 py-2.5 text-center">
                            <p className={`text-base font-bold leading-tight ${s.color}`}>
                                {s.value}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                {s.label}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Tabs — thanh cuộn ngang 1 dòng, không vỡ dòng trên mobile */}
                <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-3 px-3
              [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-medium
                whitespace-nowrap transition-all duration-200 relative ${
                                    tab === t.key
                                        ? 'bg-slate-900 dark:bg-sky-500 text-white shadow-md shadow-slate-900/10'
                                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-700'}`}>
                            {t.label}
                            {t.key === 'schedule' && requests.length > 0 && (
                                <span className={`ml-1 text-xs px-1 py-0.5 rounded-full ${
                                    tab === t.key
                                        ? 'bg-white/25 text-white'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'}`}>
                                    {requests.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ===== XẾP LỊCH (lịch tham khảo duy nhất — click ô để duyệt/từ chối/gán) ===== */}
                {tab === 'schedule' && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm
              shadow-slate-900/5 border border-slate-100 dark:border-slate-700
              overflow-hidden">
                            <div className="px-4 pt-3 pb-2.5">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                            📅 Lịch tham khảo
                                        </h2>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                            Bấm vào ô để duyệt / từ chối / gán ca
                                        </p>
                                    </div>
                                    <span className={`shrink-0 text-[11px] px-2 py-1 rounded-full font-medium ${
                                        windowInfo?.canRegister
                                            ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-300'
                                            : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'}`}>
                                        {windowInfo?.canRegister ? '🔓 Đang mở' : '🔒 Đã đóng'}
                                    </span>
                                </div>

                                {requests.length > 0 && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                                        ⏳ {requests.length} yêu cầu đang chờ duyệt
                                    </p>
                                )}

                                <div className="flex items-center gap-2 mt-3">
                                    <input type="date" value={weekStart}
                                           onChange={e => setWeekStart(e.target.value)}
                                           className="flex-1 min-w-0 text-xs px-2.5 py-2 bg-slate-50 dark:bg-slate-900
                      border border-slate-200 dark:border-slate-700
                      text-slate-700 dark:text-slate-200 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                                    <button onClick={handleToggleWindow}
                                            className={`shrink-0 text-xs px-3 py-2 rounded-lg
                      font-medium transition ${
                                                windowInfo?.canRegister
                                                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 active:bg-rose-100 dark:active:bg-rose-500/20'
                                                    : 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-300 active:bg-sky-100 dark:active:bg-sky-500/20'}`}>
                                        {windowInfo?.canRegister ? 'Đóng ĐK' : 'Mở ĐK'}
                                    </button>
                                    {requests.length > 0 && (
                                        <button onClick={handleApproveAll}
                                                disabled={approvingAll}
                                                className="shrink-0 text-xs px-3 py-2 bg-slate-900 dark:bg-sky-500
                      active:bg-slate-800 dark:active:bg-sky-400
                      text-white rounded-lg font-medium
                      disabled:opacity-50 transition">
                                            {approvingAll ? '...' : `✓ Duyệt (${requests.length})`}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <DepartmentScheduleGrid
                                employees={employees}
                                shifts={allSchedules?.shifts || []}
                                weekStart={weekStart}
                                shiftTypes={shiftTypes}
                                onChanged={() => {
                                    fetchBase()
                                    fetchWeek()
                                }}
                            />
                        </div>

                    </div>
                )}

                {/* ===== LỊCH TRỰC ===== */}
                {tab === 'duty' && (
                    <div>
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <input type="date" value={weekStart}
                                   onChange={e => setWeekStart(e.target.value)}
                                   className="text-sm px-3 py-2 bg-white dark:bg-slate-800
                  border border-slate-200 dark:border-slate-700
                  text-slate-700 dark:text-slate-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                            <button onClick={handleAutoSchedule}
                                    className="px-4 py-2 bg-slate-900 dark:bg-sky-500
                  hover:bg-slate-800 dark:hover:bg-sky-400
                  text-white text-sm font-medium rounded-xl transition">
                                ⚡ Xếp tự động
                            </button>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                Xếp dựa trên ca đã duyệt trong tuần
                            </span>
                        </div>

                        <DutyTable
                            duties={duties}
                            weekStart={weekStart}
                            isAdmin={true}
                            onEditDuty={d => setEditDuty({
                                ...d, userId: d.user?.id
                            })}
                        />

                        {editDuty && (
                            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm
                flex items-center justify-center z-50 p-4">
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full
                  max-w-sm shadow-xl animate-fade-in-up">
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
                                        ✏️ Chỉnh sửa nhiệm vụ
                                    </h3>
                                    <div className="mb-3">
                                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                                            Nhân viên phụ trách
                                        </label>
                                        <select value={editDuty.userId || ''}
                                                onChange={e => setEditDuty({
                                                    ...editDuty, userId: e.target.value })}
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-900
                        border border-slate-200 dark:border-slate-700
                        text-slate-700 dark:text-slate-200 rounded-xl text-sm
                        focus:outline-none focus:ring-2 focus:ring-sky-500">
                                            {employees.map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name} ({DEPT_LABEL[u.department] || ''})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-4">
                                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                                            Ghi chú / Giờ
                                        </label>
                                        <input value={editDuty.note || ''}
                                               onChange={e => setEditDuty({
                                                   ...editDuty, note: e.target.value })}
                                               className="w-full px-3 py-2 bg-white dark:bg-slate-900
                        border border-slate-200 dark:border-slate-700
                        text-slate-700 dark:text-slate-200 rounded-xl text-sm
                        focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleSaveDuty}
                                                className="flex-1 py-2 bg-slate-900 dark:bg-sky-500
                        text-white text-sm font-medium rounded-xl
                        hover:bg-slate-800 dark:hover:bg-sky-400 transition">
                                            Lưu
                                        </button>
                                        <button onClick={() => setEditDuty(null)}
                                                className="flex-1 py-2 bg-slate-100 dark:bg-slate-700
                        text-slate-700 dark:text-slate-200 text-sm font-medium
                        rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                                            Huỷ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== BÁO CÁO ===== */}
                {tab === 'report' && (
                    <AdminReportView />
                )}

                {/* ===== NHÂN VIÊN ===== */}
                {tab === 'users' && (
                    <div className="space-y-4">
                        {/* Thêm nhân viên mới */}
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm
              shadow-slate-900/5 border border-slate-100 dark:border-slate-700 p-4">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
                                + Thêm nhân viên
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Họ tên</label>
                                    <input value={newUser.name}
                                           onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                           placeholder="Nguyễn Văn A"
                                           className="w-full px-3 py-2 bg-white dark:bg-slate-900
                      border border-slate-200 dark:border-slate-700
                      text-slate-700 dark:text-slate-200 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Email</label>
                                    <input value={newUser.email}
                                           onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                           placeholder="a@company.com"
                                           className="w-full px-3 py-2 bg-white dark:bg-slate-900
                      border border-slate-200 dark:border-slate-700
                      text-slate-700 dark:text-slate-200 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                                        Mật khẩu ban đầu
                                    </label>
                                    <input value={newUser.password}
                                           onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                           placeholder="Mặc định: 123456"
                                           className="w-full px-3 py-2 bg-white dark:bg-slate-900
                      border border-slate-200 dark:border-slate-700
                      text-slate-700 dark:text-slate-200 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Bộ phận</label>
                                    <select value={newUser.department}
                                            onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-900
                      border border-slate-200 dark:border-slate-700
                      text-slate-700 dark:text-slate-200 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-sky-500">
                                        {Object.entries(DEPT_LABEL).map(([k, l]) => (
                                            <option key={k} value={k}>{l}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button onClick={handleCreateUser}
                                    disabled={addingUser}
                                    className="w-full py-2.5 bg-slate-900 dark:bg-sky-500
                  hover:bg-slate-800 dark:hover:bg-sky-400 text-white text-sm
                  font-medium rounded-xl transition disabled:opacity-50">
                                {addingUser ? 'Đang tạo...' : '+ Tạo tài khoản'}
                            </button>
                        </div>

                        {/* Danh sách nhân viên */}
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm
              shadow-slate-900/5 border border-slate-100 dark:border-slate-700 overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    👥 Danh sách ({users.length} người)
                                </span>
                            </div>
                            {users.map((u, idx) => (
                                <div key={u.id}
                                     className={`px-4 py-3 flex items-center justify-between
                    border-b border-slate-50 dark:border-slate-700/50 last:border-0
                    ${idx%2===0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/50 dark:bg-slate-800/30'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-sky-100 dark:bg-sky-500/15 rounded-full
                      flex items-center justify-center
                      text-sky-600 dark:text-sky-300 font-bold text-sm shrink-0">
                                            {(u.name||'?')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                                {u.name}
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">{u.email}</p>
                                            {u.department && (
                                                <span className={`text-xs px-1.5 py-0.5 rounded
                          font-medium ${DEPT_COLOR[u.department]}`}>
                                                    {DEPT_LABEL[u.department]}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => setEditUser({
                                        id: u.id, name: u.name,
                                        role: u.role, department: u.department
                                    })}
                                            className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700
                      hover:bg-slate-200 dark:hover:bg-slate-600
                      text-slate-700 dark:text-slate-200 rounded-lg transition shrink-0">
                                        ✏️ Sửa
                                    </button>
                                </div>
                            ))}

                            {editUser && (
                                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm
                  flex items-center justify-center z-50 p-4">
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full
                    max-w-sm shadow-xl animate-fade-in-up">
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
                                            ✏️ {editUser.name}
                                        </h3>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                                            Chỉnh sửa role và phòng ban
                                        </p>
                                        <div className="mb-3">
                                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                                                Role
                                            </label>
                                            <select value={editUser.role}
                                                    onChange={e => setEditUser({
                                                        ...editUser, role: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900
                          border border-slate-200 dark:border-slate-700
                          text-slate-700 dark:text-slate-200 rounded-xl text-sm
                          focus:outline-none focus:ring-2 focus:ring-sky-500">
                                                <option value="EMPLOYEE">EMPLOYEE</option>
                                                <option value="ADMIN">ADMIN</option>
                                            </select>
                                        </div>
                                        <div className="mb-4">
                                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                                                Phòng ban
                                            </label>
                                            <select value={editUser.department || ''}
                                                    onChange={e => setEditUser({
                                                        ...editUser, department: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900
                          border border-slate-200 dark:border-slate-700
                          text-slate-700 dark:text-slate-200 rounded-xl text-sm
                          focus:outline-none focus:ring-2 focus:ring-sky-500">
                                                {Object.entries(DEPT_LABEL).map(([k, l]) => (
                                                    <option key={k} value={k}>{l}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={handleSaveUser}
                                                    className="flex-1 py-2 bg-slate-900 dark:bg-sky-500
                          text-white text-sm font-medium rounded-xl
                          hover:bg-slate-800 dark:hover:bg-sky-400 transition">
                                                Lưu
                                            </button>
                                            <button onClick={() => setEditUser(null)}
                                                    className="flex-1 py-2 bg-slate-100 dark:bg-slate-700
                          text-slate-700 dark:text-slate-200 text-sm font-medium
                          rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                                                Huỷ
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ===== CA LÀM ===== */}
                {tab === 'shifts' && (
                    <div>
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm
              shadow-slate-900/5 border border-slate-100 dark:border-slate-700
              overflow-hidden mb-4">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    ⚙️ Loại ca làm việc
                                </span>
                            </div>
                            {shiftTypes.map(st => (
                                <div key={st.id}
                                     className="px-4 py-3 flex items-center justify-between
                    border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm font-bold px-3 py-1
                      rounded-lg ${shiftSolid(st.code)}`}>
                                            {st.code}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                                {st.name}
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                {st.startTime} — {st.endTime}
                                                {st.partTime && (
                                                    <span className="ml-1 text-violet-500 dark:text-violet-400">
                                                        (Part-time)
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            st.active
                                                ? 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300'
                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                            {st.active ? 'Bật' : 'Tắt'}
                                        </span>
                                        <button
                                            onClick={() => updateShiftType(st.id, {
                                                isActive: String(!st.active)
                                            }).then(fetchBase)}
                                            className="text-xs px-2 py-1 bg-slate-50 dark:bg-slate-700
                        text-slate-600 dark:text-slate-300 rounded-lg
                        hover:bg-slate-100 dark:hover:bg-slate-600 transition">
                                            {st.active ? 'Tắt' : 'Bật'}
                                        </button>
                                        <button
                                            onClick={() => deleteShiftType(st.id).then(fetchBase)}
                                            className="text-xs px-2 py-1 bg-rose-50 dark:bg-rose-500/10
                        text-rose-600 dark:text-rose-300 rounded-lg
                        hover:bg-rose-100 dark:hover:bg-rose-500/20 transition">
                                            Xoá
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm
              shadow-slate-900/5 border border-slate-100 dark:border-slate-700 p-4">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
                                + Thêm ca mới
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { key: 'code',      label: 'Mã ca',       placeholder: 'PT1' },
                                    { key: 'name',      label: 'Tên ca',      placeholder: 'Part-time sáng' },
                                    { key: 'startTime', label: 'Giờ bắt đầu', type: 'time' },
                                    { key: 'endTime',   label: 'Giờ kết thúc',type: 'time' },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                                            {f.label}
                                        </label>
                                        <input type={f.type || 'text'}
                                               placeholder={f.placeholder}
                                               value={newShift[f.key]}
                                               onChange={e => setNewShift({
                                                   ...newShift, [f.key]: e.target.value })}
                                               className="w-full px-3 py-2 bg-white dark:bg-slate-900
                        border border-slate-200 dark:border-slate-700
                        text-slate-700 dark:text-slate-200 rounded-xl text-sm
                        focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                                <input type="checkbox" id="pt"
                                       checked={newShift.isPartTime}
                                       onChange={e => setNewShift({
                                           ...newShift, isPartTime: e.target.checked })}/>
                                <label htmlFor="pt" className="text-sm text-slate-600 dark:text-slate-300">
                                    Ca part-time
                                </label>
                            </div>
                            <button onClick={handleAddShift}
                                    className="w-full mt-3 py-2.5 bg-slate-900 dark:bg-sky-500
                  hover:bg-slate-800 dark:hover:bg-sky-400 text-white text-sm
                  font-medium rounded-xl transition">
                                + Thêm ca
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== ĐIỀU KIỆN XẾP LỊCH TRỰC ===== */}
                {tab === 'dutyRules' && (
                    <AdminDutyRules users={employees} />
                )}
            </div>
        </div>
    )
}