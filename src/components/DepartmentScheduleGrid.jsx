import { useState, Fragment } from 'react'
import dayjs from 'dayjs'
import { assignShift, clearShift, approveRequest, rejectRequest } from '../api/scheduleApi'
import { shiftClass, OFF_COLOR, PENDING_RING, REJECTED_STYLE } from '../constants/colors.js'

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật']

const DEPT_ORDER = ['CASHIER', 'SALES', 'WAREHOUSE', 'MARKETING', 'TECHNICIAN']
const DEPT_LABEL = {
    CASHIER: 'CASHIER', SALES: 'SALES', WAREHOUSE: 'WAREHOUSE',
    MARKETING: 'MARKETING', TECHNICIAN: 'TECHNICIAN',
}

const STATUS_LABEL = {
    PENDING:  '⏳ Đang chờ duyệt',
    APPROVED: '✓ Đã duyệt',
    REJECTED: '✗ Đã từ chối',
}

export default function DepartmentScheduleGrid({
                                                     employees = [], shifts = [],
                                                     weekStart, shiftTypes = [], onChanged,
                                                 }) {
    // modal = { userId, userName, date, entries: [ShiftRequest...] }
    const [modal, setModal] = useState(null)
    const [saving, setSaving] = useState(false)

    const days = Array.from({ length: 7 }, (_, i) => dayjs(weekStart).add(i, 'day'))

    const codes = (shiftTypes.length ? shiftTypes.map(s => s.code) : ['A', 'B', 'F'])

    const cellFor = (userId, dateStr) =>
        shifts.filter(s => s.user?.id === userId && s.date === dateStr)

    const openModal = (user, dateStr) => {
        setModal({
            userId: user.id,
            userName: user.name,
            date: dateStr,
            entries: cellFor(user.id, dateStr),
        })
    }

    const refreshModal = () => {
        if (!modal) return
        setModal(m => ({ ...m, entries: cellFor(m.userId, m.date) }))
    }

    const handleApprove = async (id) => {
        setSaving(true)
        try {
            await approveRequest(id)
            onChanged?.()
        } catch {
            alert('❌ Duyệt thất bại, thử lại.')
        }
        setSaving(false)
        setModal(null)
    }

    const handleReject = async (id) => {
        const reason = prompt('Lý do từ chối:')
        if (!reason) return
        setSaving(true)
        try {
            await rejectRequest(id, reason)
            onChanged?.()
        } catch {
            alert('❌ Từ chối thất bại, thử lại.')
        }
        setSaving(false)
        setModal(null)
    }

    const handleAssign = async (code) => {
        if (!modal) return
        setSaving(true)
        try {
            if (code === 'OFF') {
                await clearShift(modal.userId, modal.date)
            } else {
                await assignShift(modal.userId, modal.date, code)
            }
            setModal(null)
            onChanged?.()
        } catch {
            alert('❌ Không gán được ca, thử lại.')
        }
        setSaving(false)
    }

    const grouped = DEPT_ORDER
        .map(dept => ({ dept, users: employees.filter(u => u.department === dept) }))
        .filter(g => g.users.length > 0)

    return (
        <div>
            <div className="px-4 py-2.5 flex items-center justify-between flex-wrap gap-1
        border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                    Bấm vào 1 ô để duyệt / từ chối / gán ca cho nhân viên
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                    <thead>
                    <tr>
                        <th className="text-left px-3 py-2 bg-slate-50 dark:bg-slate-800
              text-slate-500 dark:text-slate-400 min-w-32 sticky left-0">
                            &nbsp;
                        </th>
                        {days.map(d => (
                            <th key={d.format('YYYY-MM-DD')}
                                className="text-center px-2 py-2 bg-sky-50 dark:bg-sky-500/10
                  text-slate-700 dark:text-slate-200 min-w-20
                  border border-slate-200 dark:border-slate-700">
                                <div className="font-bold">{DAY_LABELS[d.day() === 0 ? 6 : d.day() - 1]}</div>
                                <div className="text-slate-400 dark:text-slate-500 font-normal">{d.format('D/M')}</div>
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {grouped.map(({ dept, users }) => (
                        <Fragment key={dept}>
                            <tr className="bg-slate-100 dark:bg-slate-800">
                                <td colSpan={8}
                                    className="px-3 py-1.5 font-bold text-slate-700 dark:text-slate-200
                    border border-slate-200 dark:border-slate-700">
                                    {DEPT_LABEL[dept]}
                                </td>
                            </tr>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td className="px-3 py-2 border border-slate-200 dark:border-slate-700
                    font-medium text-slate-700 dark:text-slate-200 sticky left-0
                    bg-white dark:bg-slate-900">
                                        {u.name}
                                    </td>
                                    {days.map(d => {
                                        const dateStr = d.format('YYYY-MM-DD')
                                        const entries = cellFor(u.id, dateStr)
                                        const entry = entries[0]
                                        const code = entry?.shift
                                        const style = code ? shiftClass(code) : OFF_COLOR
                                        const statusStyle = entry?.status === 'PENDING'
                                            ? PENDING_RING
                                            : entry?.status === 'REJECTED' ? REJECTED_STYLE : ''
                                        return (
                                            <td key={dateStr}
                                                className="border border-slate-200 dark:border-slate-700 p-0.5 text-center">
                                                <button
                                                    onClick={() => openModal(u, dateStr)}
                                                    title="Bấm để duyệt / từ chối / gán ca"
                                                    className={`w-full py-2 rounded-lg border font-bold
                                    transition hover:opacity-80 ${style} ${statusStyle}`}>
                                                    {code || 'OFF'}
                                                    {entries.length > 1 && (
                                                        <span className="text-xs">+{entries.length - 1}</span>
                                                    )}
                                                </button>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </Fragment>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Chú thích */}
            <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-slate-100 dark:border-slate-700">
                {codes.map(c => (
                    <span key={c}
                          className={`text-xs px-2 py-1 rounded-lg border font-bold ${shiftClass(c)}`}>
                        {c}
                    </span>
                ))}
                <span className={`text-xs px-2 py-1 rounded-lg border font-bold ${OFF_COLOR}`}>
                    OFF
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">
                    ⏳ viền cam = đang chờ duyệt &nbsp;|&nbsp; mờ gạch ngang = đã từ chối
                </span>
            </div>

            {/* Modal: duyệt / từ chối / gán ca — tất cả trong 1 chỗ */}
            {modal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm
          flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full
            max-w-sm shadow-xl animate-fade-in-up">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
                            🛠️ {modal.userName}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                            {dayjs(modal.date).format('dddd, DD/MM/YYYY')}
                        </p>

                        {modal.entries.length > 0 && (
                            <div className="space-y-2 mb-4">
                                {modal.entries.map(e => (
                                    <div key={e.id}
                                         className="flex items-center justify-between gap-2
                      p-2 rounded-xl border border-slate-100 dark:border-slate-700
                      bg-slate-50 dark:bg-slate-900">
                                        <div>
                                            <span className={`inline-block text-xs font-bold px-2 py-0.5
                        rounded-md border mr-2 ${shiftClass(e.shift)}`}>
                                                {e.shift}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {STATUS_LABEL[e.status]}
                                            </span>
                                        </div>
                                        {e.status === 'PENDING' && (
                                            <div className="flex gap-1 shrink-0">
                                                <button onClick={() => handleApprove(e.id)}
                                                        disabled={saving}
                                                        className="px-2 py-1 text-xs bg-sky-500
                            hover:bg-sky-600 text-white rounded-lg font-medium
                            disabled:opacity-50 transition">
                                                    ✓ Duyệt
                                                </button>
                                                <button onClick={() => handleReject(e.id)}
                                                        disabled={saving}
                                                        className="px-2 py-1 text-xs bg-slate-400
                            hover:bg-slate-500 text-white rounded-lg font-medium
                            disabled:opacity-50 transition">
                                                    ✗ Từ chối
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button onClick={refreshModal}
                                        className="text-xs text-sky-500 dark:text-sky-400 hover:underline">
                                    ↻ Tải lại danh sách
                                </button>
                            </div>
                        )}

                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                            {modal.entries.length > 0
                                ? 'Hoặc admin tự gán ca khác (ghi đè):'
                                : 'Chưa có ca — bấm để gán cho nhân viên:'}
                        </p>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {['OFF', ...codes].map(c => (
                                <button key={c}
                                        onClick={() => handleAssign(c)}
                                        disabled={saving}
                                        className={`py-2 rounded-xl border font-bold text-sm
                    transition disabled:opacity-50 ${c === 'OFF' ? OFF_COLOR : shiftClass(c)}`}>
                                    {c}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                            Ca được gán sẽ tự động ở trạng thái đã duyệt và
                            nhân viên sẽ nhận thông báo ngay.
                        </p>
                        <button onClick={() => setModal(null)}
                                className="w-full py-2 bg-slate-100 dark:bg-slate-700
                text-slate-700 dark:text-slate-200 text-sm
                font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
