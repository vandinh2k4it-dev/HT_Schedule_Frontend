import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { getWindowStatus, registerShift, getShiftTypes, getMySchedules }
    from '../api/scheduleApi'
import { shiftClass, shiftSolid, OFF_COLOR } from '../constants/colors.js'

const DAY_LABELS = ['CN','T2','T3','T4','T5','T6','T7']

const STATUS_STYLE = {
    APPROVED: 'bg-sky-500 text-white',
    REJECTED: 'bg-slate-400 text-white line-through',
    PENDING:  'bg-amber-400 text-white',
}
const STATUS_ICON = { APPROVED: '✓', REJECTED: '✗', PENDING: '⏳' }

export default function WeeklyScheduleGrid({ onSuccess }) {
    const [windowInfo, setWindowInfo] = useState(null)
    const [shiftTypes, setShiftTypes] = useState([])
    const [existingShifts, setExistingShifts] = useState([])
    // Mỗi ngày chỉ được chọn 1 ca: { '2026-07-20': 'A', '2026-07-21': 'B' }
    const [selected, setSelected] = useState({})
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState(null)

    const fetchAll = async () => {
        const [wRes, stRes, sRes] = await Promise.allSettled([
            getWindowStatus(), getShiftTypes(), getMySchedules(),
        ])
        if (wRes.status === 'fulfilled') setWindowInfo(wRes.value.data)
        else console.error('getWindowStatus failed:', wRes.reason)

        if (stRes.status === 'fulfilled') setShiftTypes(stRes.value.data || [])
        else console.error('getShiftTypes failed:', stRes.reason)

        if (sRes.status === 'fulfilled') setExistingShifts(sRes.value.data || [])
        else console.error('getMySchedules failed:', sRes.reason)
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { void fetchAll() }, [])

    const canRegister = windowInfo?.canRegister === true
    const targetStart = windowInfo?.targetWeekStart
        ? dayjs(windowInfo.targetWeekStart)
        : dayjs().startOf('week').add(1, 'week')

    const days = Array.from({ length: 7 }, (_, i) => targetStart.add(i, 'day'))

    const getExisting = (date, code) =>
        existingShifts.find(s => s.date === date && s.shift === code)

    // Ngày này đã có đăng ký từ trước (bất kỳ ca nào) chưa?
    const hasExistingForDay = date =>
        existingShifts.some(s => s.date === date)

    // Bấm 1 ô: chọn ca đó cho ngày đó (ghi đè ca khác nếu đã chọn trước đó
    // trong cùng ngày — vì 1 ngày chỉ được 1 ca). Bấm lại ô đang chọn để bỏ chọn.
    const handleSelect = (date, code) => {
        if (!canRegister || getExisting(date, code) || hasExistingForDay(date)) return
        setSelected(prev => {
            const next = { ...prev }
            if (next[date] === code) {
                delete next[date]
            } else {
                next[date] = code
            }
            return next
        })
    }

    const selectedList = Object.entries(selected) // [[date, code], ...]

    const handleSubmit = async () => {
        if (selectedList.length === 0) return
        setLoading(true)
        const results = await Promise.allSettled(
            selectedList.map(([date, code]) =>
                registerShift({ date, shift: code }))
        )
        const failed = results.filter(r => r.status === 'rejected')
        if (failed.length === 0) {
            setMsg({ ok: true, text: `✅ Đăng ký thành công ${selectedList.length} ca!` })
        } else {
            // Lấy đúng lý do lỗi backend trả về (vd: bị chặn do trùng ca với
            // người ghép cặp) thay vì chỉ đếm số lượng chung chung.
            const reasons = failed.map(r =>
                r.reason?.response?.data || 'Lỗi không xác định')
            const uniqueReasons = [...new Set(reasons)]
            setMsg({
                ok: false,
                text: `⚠️ ${selectedList.length - failed.length}/${selectedList.length} ca thành công. `
                    + uniqueReasons.join(' — ')
            })
        }
        setSelected({})
        await fetchAll()
        onSuccess?.()
        setLoading(false)
        setTimeout(() => setMsg(null), 7000)
    }

    const displayShifts = shiftTypes.filter(s => s.active).length > 0
        ? shiftTypes.filter(s => s.active)
        : [
            { code: 'A', name: 'Ca Sáng', startTime: '08:00' },
            { code: 'B', name: 'Ca Chiều', startTime: '13:00' },
            { code: 'F', name: 'Cả Ngày', startTime: '08:00' },
        ]

    if (!canRegister) {
        return (
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm
        shadow-slate-900/5 border border-slate-100 dark:border-slate-700 p-6
        text-center">
                <div className="text-3xl mb-2">🔒</div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Admin chưa mở đăng ký ca tuần sau
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Khi nào mở, tab này sẽ tự hiện lịch để bạn đăng ký
                </p>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm
      shadow-slate-900/5 border border-slate-100 dark:border-slate-700 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                        📋 Đăng ký ca tuần sau
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {targetStart.format('DD/MM')} —{' '}
                        {targetStart.add(6, 'day').format('DD/MM/YYYY')}
                    </p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-medium
          bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                    🟢 Đang mở
                </span>
            </div>

            <div className="bg-sky-50 dark:bg-sky-500/10 border border-sky-200
        dark:border-sky-500/30 rounded-xl p-3 mb-3 text-xs text-sky-700 dark:text-sky-300">
                💡 Tích chọn nhiều ngày cùng lúc rồi bấm "Đăng ký" 1 lần —
                mỗi ngày chỉ được chọn 1 ca.
            </div>

            <div className="space-y-1.5">
                {days.map(d => {
                    const dateStr = d.format('YYYY-MM-DD')
                    const dayTaken = hasExistingForDay(dateStr)
                    const isToday = d.isSame(dayjs(), 'day')
                    return (
                        <div key={dateStr}
                             className={`flex items-center gap-2 p-2 rounded-xl ${
                                 isToday ? 'bg-sky-50/60 dark:bg-sky-500/5' : ''}`}>
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
                            <div className="flex-1 flex gap-1.5">
                                {displayShifts.map(shift => {
                                    const existing = getExisting(dateStr, shift.code)
                                    const isSel = selected[dateStr] === shift.code
                                    const disabled = !!existing || dayTaken
                                    return (
                                        <button key={shift.code}
                                                onClick={() => handleSelect(dateStr, shift.code)}
                                                disabled={disabled}
                                                className={`flex-1 py-2 rounded-lg border text-xs font-bold
                        transition-all
                        ${existing
                                                    ? STATUS_STYLE[existing.status] + ' border-transparent'
                                                    : isSel
                                                        ? shiftSolid(shift.code) + ' border-transparent'
                                                        : disabled
                                                            ? `${OFF_COLOR} cursor-not-allowed opacity-50`
                                                            : `${shiftClass(shift.code)} active:opacity-70`
                                                }`}>
                                            {existing
                                                ? `${shift.code} ${STATUS_ICON[existing.status]}`
                                                : shift.code}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <span className="text-xs bg-sky-500 text-white px-2 py-0.5 rounded-full">Đã bấm = đang chọn</span>
                <span className="text-xs bg-sky-500 text-white px-2 py-0.5 rounded-full">✓ Đã duyệt</span>
                <span className="text-xs bg-amber-400 text-white px-2 py-0.5 rounded-full">⏳ Chờ duyệt</span>
                <span className="text-xs bg-slate-400 text-white px-2 py-0.5 rounded-full">✗ Từ chối</span>
            </div>

            {selectedList.length > 0 && (
                <div className="mt-3 p-3 bg-sky-50 dark:bg-sky-500/10 border border-sky-200
          dark:border-sky-500/30 rounded-xl">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {selectedList.map(([date, code]) => (
                            <span key={date}
                                  className="text-xs bg-white dark:bg-slate-800 border border-sky-200
                dark:border-sky-500/40 text-sky-700 dark:text-sky-300 px-2 py-1 rounded-lg font-medium">
                                {dayjs(date).format('ddd DD/MM')} — Ca {code}
                            </span>
                        ))}
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-sky-700 dark:text-sky-300 font-medium">
                            Đã chọn {selectedList.length} ngày
                        </span>
                        <button onClick={handleSubmit} disabled={loading}
                                className="px-4 py-1.5 bg-slate-900 dark:bg-sky-500
                hover:bg-slate-800 dark:hover:bg-sky-400
                text-white text-sm font-medium rounded-lg transition
                disabled:opacity-50">
                            {loading ? '...' : `Đăng ký ${selectedList.length} ca`}
                        </button>
                    </div>
                </div>
            )}

            {msg && (
                <div className={`mt-2 p-2.5 rounded-lg text-sm text-left leading-relaxed ${
                    msg.ok
                        ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300'
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300'}`}>
                    {msg.text}
                </div>
            )}
        </div>
    )
}