import { useEffect, useState } from 'react'
import {
    getDutyExemptions, addDutyExemption, deleteDutyExemption,
    getDutyExclusionPairs, addDutyExclusionPair, deleteDutyExclusionPair,
} from '../api/scheduleApi'

// Nhãn tiếng Việt cho từng loại trực — đồng bộ với DutyTable.jsx
const DUTY_TYPE_LABELS = {
    CLEANING: '🧹 Trực vệ sinh',
    PRODUCT_CLEANING: '✨ Lau sản phẩm',
    CARPET: '🪣 Thay thảm',
    INVENTORY_CHECK: '🔍 Kiểm hàng',
    ONLINE_DUTY: '💻 Trực online',
    POWER_OFF: '⚡ Tắt điện',
}

export default function AdminDutyRules({ users }) {
    const [exemptions, setExemptions] = useState([])
    const [pairs, setPairs] = useState([])
    const [loading, setLoading] = useState(false)

    // Form: thêm miễn trừ
    const [exUserId, setExUserId] = useState('')
    const [exDutyType, setExDutyType] = useState('')

    // Form: thêm cặp không trùng ca
    const [pairAId, setPairAId] = useState('')
    const [pairBId, setPairBId] = useState('')

    const employees = (users || []).filter(u => u.role === 'EMPLOYEE')

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [exRes, pairRes] = await Promise.all([
                getDutyExemptions(), getDutyExclusionPairs()
            ])
            setExemptions(exRes.data)
            setPairs(pairRes.data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchAll() }, [])

    const handleAddExemption = async () => {
        if (!exUserId) return
        await addDutyExemption({
            userId: exUserId,
            dutyType: exDutyType || null,
        })
        setExUserId(''); setExDutyType('')
        fetchAll()
    }

    const handleDeleteExemption = async id => {
        await deleteDutyExemption(id)
        fetchAll()
    }

    const handleAddPair = async () => {
        if (!pairAId || !pairBId || pairAId === pairBId) return
        await addDutyExclusionPair({ userAId: pairAId, userBId: pairBId })
        setPairAId(''); setPairBId('')
        fetchAll()
    }

    const handleDeletePair = async id => {
        await deleteDutyExclusionPair(id)
        fetchAll()
    }

    return (
        <div className="space-y-4">
            <p className="text-xs text-slate-400 dark:text-slate-500 -mt-1">
                Các điều kiện dưới đây chỉ áp dụng khi bấm <b>"Tự động xếp lịch trực"</b> —
                không ảnh hưởng tới việc gán tay từng ô trong bảng Lịch trực.
            </p>

            {/* ===== Miễn trừ trực ===== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
                    🚫 Miễn trừ trực
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                    Chọn nhân viên không muốn tự động xếp vào 1 loại trực cụ thể
                    (hoặc để trống "Loại trực" để miễn TẤT CẢ loại trực).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                    <select value={exUserId} onChange={e => setExUserId(e.target.value)}
                            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-sky-500">
                        <option value="">— Chọn nhân viên —</option>
                        {employees.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                    <select value={exDutyType} onChange={e => setExDutyType(e.target.value)}
                            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-sky-500">
                        <option value="">Tất cả loại trực</option>
                        {Object.entries(DUTY_TYPE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <button onClick={handleAddExemption} disabled={!exUserId}
                            className="px-4 py-2 bg-slate-900 dark:bg-sky-500 active:bg-slate-800 dark:active:bg-sky-400
                text-white text-sm font-medium rounded-lg disabled:opacity-40">
                        + Thêm
                    </button>
                </div>

                <div className="space-y-1.5">
                    {exemptions.length === 0 && !loading && (
                        <p className="text-xs text-slate-300 dark:text-slate-600 italic">Chưa có luật miễn trừ nào.</p>
                    )}
                    {exemptions.map(e => (
                        <div key={e.id} className="flex items-center justify-between
              bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">
                            <span className="text-sm text-slate-700 dark:text-slate-200">
                                <b>{e.user?.name}</b> — miễn{' '}
                                {e.dutyType ? DUTY_TYPE_LABELS[e.dutyType] : 'tất cả loại trực'}
                            </span>
                            <button onClick={() => handleDeleteExemption(e.id)}
                                    className="text-xs px-2 py-1 rounded-md bg-rose-50 dark:bg-rose-500/10
                  text-rose-600 dark:text-rose-300 active:bg-rose-100 dark:active:bg-rose-500/20">
                                Xoá
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* ===== Cặp không được trùng ca trực ===== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
                    🔀 Cặp không được trùng ca trực
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                    2 nhân viên trong 1 cặp sẽ không bao giờ bị xếp trực cùng lúc trong cùng 1 ngày.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                    <select value={pairAId} onChange={e => setPairAId(e.target.value)}
                            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-sky-500">
                        <option value="">— Nhân viên A —</option>
                        {employees.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                    <select value={pairBId} onChange={e => setPairBId(e.target.value)}
                            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-sky-500">
                        <option value="">— Nhân viên B —</option>
                        {employees.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                    <button onClick={handleAddPair}
                            disabled={!pairAId || !pairBId || pairAId === pairBId}
                            className="px-4 py-2 bg-slate-900 dark:bg-sky-500 active:bg-slate-800 dark:active:bg-sky-400
                text-white text-sm font-medium rounded-lg disabled:opacity-40">
                        + Thêm
                    </button>
                </div>

                <div className="space-y-1.5">
                    {pairs.length === 0 && !loading && (
                        <p className="text-xs text-slate-300 dark:text-slate-600 italic">Chưa có cặp nào.</p>
                    )}
                    {pairs.map(p => (
                        <div key={p.id} className="flex items-center justify-between
              bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">
                            <span className="text-sm text-slate-700 dark:text-slate-200">
                                <b>{p.userA?.name}</b> ↔ <b>{p.userB?.name}</b>
                            </span>
                            <button onClick={() => handleDeletePair(p.id)}
                                    className="text-xs px-2 py-1 rounded-md bg-rose-50 dark:bg-rose-500/10
                  text-rose-600 dark:text-rose-300 active:bg-rose-100 dark:active:bg-rose-500/20">
                                Xoá
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
