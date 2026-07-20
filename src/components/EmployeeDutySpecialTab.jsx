import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { getMyDuties } from '../api/scheduleApi'

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

// 5 công việc trực đặc biệt, mỗi việc chỉ áp dụng cho đúng bộ phận
// (khớp với logic xếp lịch tự động ở backend DutyAutoScheduleService).
// SALES: Trực VS + Lau sản phẩm + Tắt điện. WAREHOUSE: chỉ Thay thảm.
const DUTY_ROWS = [
    { type: 'CLEANING',         shift: 'MORNING',   label: '🧹 Trực VS Sáng (9:00)',    onlyDept: 'SALES' },
    { type: 'CLEANING',         shift: 'AFTERNOON', label: '🧹 Trực VS Chiều (16:00)',  onlyDept: 'SALES' },
    { type: 'PRODUCT_CLEANING', shift: 'MORNING',   label: '✨ Lau Sản Phẩm (10:00)',   onlyDept: 'SALES' },
    { type: 'CARPET',           shift: 'AFTERNOON', label: '🪣 Thay Thảm (T3/T5/T7)',   onlyDept: 'WAREHOUSE' },
    { type: 'POWER_OFF',        shift: 'AFTERNOON', label: '⚡ Tắt Điện (21:00)',        onlyDept: 'SALES' },
]

export default function EmployeeDutySpecialTab({ department = null }) {
    const [weekOffset, setWeekOffset] = useState(0)
    const [duties, setDuties] = useState([])

    const start = dayjs().startOf('week').add(weekOffset, 'week')
    const days = Array.from({ length: 7 }, (_, i) => start.add(i, 'day'))

    // Ẩn hẳn dòng không thuộc bộ phận của nhân viên
    const rows = DUTY_ROWS.filter(r => !r.onlyDept || r.onlyDept === department)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getMyDuties(start.format('YYYY-MM-DD'))
                setDuties(res.data || [])
            } catch (err) {
                console.error('EmployeeDutySpecialTab fetch failed:', err)
            }
        }
        void fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [weekOffset])

    const get = (date, type, shift) =>
        duties.filter(d =>
            d.date === date && d.dutyType === type && d.dutyShift === shift
        )

    return (
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm
      shadow-slate-900/5 border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700
        bg-slate-50 dark:bg-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        🗓️ Lịch Trực Đặc Biệt — {start.format('DD/MM')}–{start.add(6, 'day').format('DD/MM')}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Trực Vệ Sinh + Lau Sản Phẩm + Thay Thảm + Tắt Điện
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
                {rows.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                        Bộ phận của bạn không có công việc trực đặc biệt.
                    </div>
                ) : (
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
                    {rows.map(row => (
                        <tr key={`${row.type}-${row.shift}`} className="border-b border-slate-50 dark:border-slate-700/60 last:border-0">
                            <td className="px-3 py-2 font-medium text-xs min-w-28 rounded-l
                bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300">
                                {row.label}
                            </td>
                            {days.map(d => {
                                const ds = d.format('YYYY-MM-DD')
                                const entries = get(ds, row.type, row.shift)
                                return (
                                    <td key={ds} className="text-center px-1 py-2 border-r border-slate-100 dark:border-slate-700">
                                        {entries.length > 0
                                            ? <span className="inline-block px-2 py-1 bg-teal-500 text-white
                                                rounded-md font-bold text-xs">
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
                )}
            </div>
        </div>
    )
}
