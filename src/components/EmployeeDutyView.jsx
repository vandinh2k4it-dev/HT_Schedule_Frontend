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

            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60">
                        <th className="text-left px-3 py-2 text-slate-400 dark:text-slate-500 min-w-28">Công việc</th>
                        {days.map(d => (
                            <th key={d.format('YYYY-MM-DD')}
                                className="text-center px-1 py-2 text-slate-400 dark:text-slate-500 min-w-12">
                                {DAY_LABELS[d.day()]}<br/>
                                <span className="text-slate-300 dark:text-slate-600 font-normal text-xs">
                                    {d.format('D/M')}
                                </span>
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {/* Dòng ca làm việc thật (A/B/F) — luôn hiện cho mọi bộ phận */}
                    <tr className="border-b border-slate-50 dark:border-slate-700">
                        <td className="px-3 py-2 font-medium text-xs min-w-28 rounded-l
              bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200">
                            🕐 Ca làm việc
                        </td>
                        {days.map(d => {
                            const ds = d.format('YYYY-MM-DD')
                            const s = getShift(ds)
                            return (
                                <td key={ds} className="text-center px-1 py-2 border-r border-slate-100 dark:border-slate-700">
                                    {s
                                        ? <span className={`inline-block px-2 py-1 rounded-md border
                        font-bold text-xs ${shiftClass(s.shift)}`}>
                                            {s.shift}
                                        </span>
                                        : <span className={`inline-block px-2 py-1 rounded-md border text-xs ${OFF_COLOR}`}>
                                            OFF
                                        </span>
                                    }
                                </td>
                            )
                        })}
                    </tr>

                    {/* Kiểm hàng / trực online — chỉ hiện đúng bộ phận */}
                    {rows.map(row => (
                        <tr key={`${row.type}-${row.shift}`} className="border-b border-slate-50 dark:border-slate-700/60 last:border-0">
                            <td className="px-3 py-2 font-medium text-xs min-w-28 rounded-l
                bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300">
                                {row.label}
                            </td>
                            {days.map(d => {
                                const ds = d.format('YYYY-MM-DD')
                                const entries = get(ds, row.type, row.shift)
                                return (
                                    <td key={ds} className="text-center px-1 py-2 border-r border-slate-100 dark:border-slate-700">
                                        {entries.length > 0
                                            ? <span className="inline-block px-2 py-1 bg-sky-500
                                                text-white rounded-md font-bold text-xs">
                                                ✓
                                            </span>
                                            : <span className="text-slate-200 dark:text-slate-700">—</span>
                                        }
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
