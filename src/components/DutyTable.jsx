import dayjs from 'dayjs'

const DAY_LABELS = ['CN','T2','T3','T4','T5','T6','T7']

const DUTY_ROWS = [
    { type: 'CLEANING',         shift: 'MORNING',   label: '🧹 Trực VS Sáng (9:00)',       color: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300' },
    { type: 'CLEANING',         shift: 'AFTERNOON', label: '🧹 Trực VS Chiều (16:00)',     color: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300' },
    { type: 'PRODUCT_CLEANING', shift: 'MORNING',   label: '✨ Lau SP Sáng (10:00)',       color: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300' },
    { type: 'CARPET',           shift: 'AFTERNOON', label: '🪣 Thay thảm (14:00) T3/T5/T7', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' },
    { type: 'INVENTORY_CHECK',  shift: 'MORNING',   label: '🔍 Kiểm hàng Sáng (8:30)',    color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
    { type: 'INVENTORY_CHECK',  shift: 'AFTERNOON', label: '🔍 Kiểm hàng Chiều (13:30)',  color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
    { type: 'ONLINE_DUTY',      shift: 'MORNING',   label: '💻 Trực Online Sáng',         color: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300' },
    { type: 'ONLINE_DUTY',      shift: 'AFTERNOON', label: '💻 Trực Online Chiều',        color: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300' },
    { type: 'POWER_OFF',        shift: 'AFTERNOON', label: '⚡ Tắt điện (21:00)',          color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
]

export default function DutyTable({ duties = [], weekStart, isAdmin, onEditDuty }) {
    const start = dayjs(weekStart)
    const days = Array.from({ length: 7 }, (_, i) => start.add(i, 'day'))

    const get = (date, type, shift) =>
        duties.filter(d =>
            d.date === date && d.dutyType === type && d.dutyShift === shift)

    return (
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm
      shadow-slate-900/5 border border-slate-100 dark:border-slate-700
      overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700
        bg-slate-50 dark:bg-slate-800">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    🗓️ Lịch trực —{' '}
                    {start.format('DD/MM')}–{start.add(6,'day').format('DD/MM')}
                </h3>
                {isAdmin && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Bấm vào ô để chỉnh sửa người phụ trách
                    </p>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60">
                        <th className="text-left px-3 py-2 text-slate-400 dark:text-slate-500
                font-medium w-40 min-w-40">Nhiệm vụ</th>
                        {days.map(d => (
                            <th key={d.format('YYYY-MM-DD')}
                                className="text-center px-1 py-2 text-slate-400 dark:text-slate-500
                    font-medium min-w-12">
                                {DAY_LABELS[d.day()]}<br/>
                                <span className="text-slate-300 dark:text-slate-600 font-normal">
                                    {d.format('D/M')}
                                </span>
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {DUTY_ROWS.map((row, idx) => (
                        <tr key={idx}
                            className={idx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/50 dark:bg-slate-800/30'}>
                            <td className="px-3 py-2">
                                <span className={`text-xs px-2 py-1 rounded-lg
                    font-medium ${row.color}`}>
                                    {row.label}
                                </span>
                            </td>
                            {days.map(d => {
                                const dateStr = d.format('YYYY-MM-DD')
                                const cells = get(dateStr, row.type, row.shift)
                                return (
                                    <td key={dateStr} className="px-1 py-1.5 text-center">
                                        {cells.length > 0
                                            ? cells.map(duty => (
                                                <div key={duty.id}
                                                     onClick={() => isAdmin && onEditDuty?.(duty)}
                                                     className={`text-xs px-1.5 py-1 rounded-lg
                              font-medium mb-0.5 ${row.color}
                              ${isAdmin
                                                         ? 'cursor-pointer hover:opacity-75 hover:ring-1 hover:ring-current'
                                                         : ''}`}>
                                                    {duty.user?.name?.split(' ').pop() || '?'}
                                                </div>
                                            ))
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
