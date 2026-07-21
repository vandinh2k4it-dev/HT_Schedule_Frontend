import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { getMyDuties, getMySchedules } from '../api/scheduleApi'
import { shiftClass, OFF_COLOR } from '../constants/colors.js'

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

// Kiểm hàng + Trực online: chỉ SALES.
// Warehouse/Marketing/Cashier/Technician không tham gia 2 việc này.
const DUTY_ROWS = [
    { type: 'INVENTORY_CHECK', shift: 'MORNING',   label: '🔍 Kiểm hàng Sáng (8:30)',   depts: ['SALES'] },
    { type: 'INVENTORY_CHECK', shift: 'AFTERNOON', label: '🔍 Kiểm hàng Chiều (13:30)', depts: ['SALES'] },
    { type: 'ONLINE_DUTY',     shift: 'MORNING',   label: '💻 Trực Online Sáng',       depts: ['SALES'] },
    { type: 'ONLINE_DUTY',     shift: 'AFTERNOON', label: '💻 Trực Online Chiều',      depts: ['SALES'] },
]

export default function EmployeeDutyView({ department = null }) {
    const [weekOffset, setWeekOffset] = useState(0)
    const [duties, setDuties] = useState([])
    const [shifts, setShifts] = useState([])

    const start = dayjs().startOf('week').add(weekOffset, 'week')
    const days = Array.from({ length: 7 }, (_, i) => start.add(i, 'day'))

    // Chỉ hiện những dòng công việc áp dụng cho bộ phận của nhân viên này
    const rows = DUTY_ROWS.filter(r => !r.depts || r.depts.includes(department))

    useEffect(() => {
        const fetchData = async () => {
            const [dRes, sRes] = await Promise.allSettled([
                getMyDuties(start.format('YYYY-MM-DD')),
                getMySchedules(),
            ])
            if (dRes.status === 'fulfilled') setDuties(dRes.value.data || [])
            else console.error('getMyDuties failed:', dRes.reason)

            if (sRes.status === 'fulfilled') setShifts(sRes.value.data || [])
            else console.error('getMySchedules failed:', sRes.reason)
        }
        void fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [weekOffset])

    const get = (date, type, shift) =>
        duties.filter(d =>
            d.date === date && d.dutyType === type && d.dutyShift === shift
        )

    const getShift = date =>
        shifts.find(s => s.date === date && s.status === 'APPROVED')

    return (
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm
      shadow-slate-900/5 border border-slate-100 dark:border-slate-700
      overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700
        bg-slate-50 dark:bg-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        📅 Lịch làm — {start.format('DD/MM')}–{start.add(6, 'day').format('DD/MM')}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Ca làm việc do admin xếp trong tuần
                    </p>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => setWeekOffset(o => o - 1)}
                            className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700
              border border-slate-200 dark:border-slate-600 text-slate-500
              dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600
              transition text-sm">‹</button>
                    <button onClick={() => setWeekOffset(0)}
                            className="px-3 h-8 rounded-lg bg-white dark:bg-slate-700
              border border-slate-200 dark:border-slate-600 text-slate-500
              dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600
              transition text-xs font-medium">
                        Tuần này
                    </button>
                    <button onClick={() => setWeekOffset(o => o + 1)}
                            className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700
              border border-slate-200 dark:border-slate-600 text-slate-500
              dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600
              transition text-sm">›</button>
                </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {days.map(d => {
                    const ds = d.format('YYYY-MM-DD')
                    const s = getShift(ds)
                    const isToday = d.isSame(dayjs(), 'day')
                    const dutyEntries = rows
                        .map(row => ({ row, entries: get(ds, row.type, row.shift) }))
                        .filter(x => x.entries.length > 0)

                    return (
                        <div key={ds} className={`flex items-center gap-3 px-4 py-2.5 ${
                            isToday ? 'bg-sky-50/60 dark:bg-sky-500/5' : ''}`}>
                            {/* Ngày */}
                            <div className="w-11 shrink-0 text-center">
                                <p className={`text-xs font-medium ${
                                    isToday ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                    {DAY_LABELS[d.day()]}
                                </p>
                                <p className={`text-sm font-bold ${
                                    isToday ? 'text-sky-600 dark:text-sky-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {d.format('D/M')}
                                </p>
                            </div>

                            {/* Ca làm việc */}
                            {s
                                ? <span className={`shrink-0 px-2.5 py-1 rounded-lg border
                    font-bold text-xs ${shiftClass(s.shift)}`}>
                                    {s.shift}
                                </span>
                                : <span className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs ${OFF_COLOR}`}>
                                    OFF
                                </span>
                            }

                            {/* Công việc trực đặc biệt trong ngày (nếu có) */}
                            <div className="flex-1 min-w-0 flex flex-wrap gap-1">
                                {dutyEntries.length > 0
                                    ? dutyEntries.map(({ row }) => (
                                        <span key={row.type + row.shift}
                                              className="text-xs px-2 py-0.5 rounded-md
                        bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 font-medium">
                                            {row.label.replace(/^\S+\s/, '')}
                                        </span>
                                    ))
                                    : rows.length > 0 && (
                                    <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                                )
                                }
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
