import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { getMyReports, deleteReport } from '../api/scheduleApi'

const REPORT_TYPES = {
    CLEANING:      { label: '🧹 Trực vệ sinh',  color: 'bg-cyan-50 text-cyan-700' },
    RECEIVING:     { label: '📦 Nhận hàng',     color: 'bg-blue-50 text-blue-700' },
    CHECKING:      { label: '🔍 Kiểm hàng',     color: 'bg-amber-50 text-amber-700' },
    SHIPPING:      { label: '🚚 Gửi hàng',      color: 'bg-orange-50 text-orange-700' },
    INCIDENT:      { label: '⚠️ Sự cố',         color: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300' },
    WAREHOUSE_EOD: { label: '🏬 Kho cuối ngày', color: 'bg-violet-50 text-violet-700' },
}

export default function EmployeeReportView() {
    const [reports, setReports] = useState([])
    const [typeFilter, setTypeFilter] = useState('')
    const [searchText, setSearchText] = useState('')
    const [dateFrom, setDateFrom] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'))
    const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'))
    const [loading, setLoading] = useState(false)

    const fetchReports = async () => {
        setLoading(true)
        try {
            const res = await getMyReports(dateFrom, dateTo)
            let data = res.data || []
            if (typeFilter) {
                data = data.filter(r => r.reportType === typeFilter)
            }
            if (searchText) {
                const q = searchText.toLowerCase()
                data = data.filter(r => r.note?.toLowerCase().includes(q))
            }
            setReports(data)
        } catch { /* ignore */ }
        setLoading(false)
    }

    useEffect(() => { fetchReports() }, [dateFrom, dateTo, typeFilter]) // eslint-disable-line

    const handleDelete = async id => {
        if (!confirm('Xoá báo cáo này?')) return
        await deleteReport(id)
        setReports(r => r.filter(x => x.id !== id))
    }

    return (
        <div className="space-y-3">
            {/* Danh mục loại báo cáo — hàng nút riêng bên ngoài */}
            <div className="flex gap-1.5 overflow-x-auto pb-1
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                <button onClick={() => setTypeFilter('')}
                        className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                            typeFilter === ''
                                ? 'bg-slate-900 dark:bg-sky-500 text-white shadow-md shadow-slate-900/10'
                                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-700'}`}>
                    📋 Tất cả
                </button>
                {Object.entries(REPORT_TYPES).map(([key, meta]) => (
                    <button key={key} onClick={() => setTypeFilter(key)}
                            className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                                typeFilter === key
                                    ? 'bg-slate-900 dark:bg-sky-500 text-white shadow-md shadow-slate-900/10'
                                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-700'}`}>
                        {meta.label}
                    </button>
                ))}
            </div>

            {/* Filter & Search */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
                    🔍 Lọc {typeFilter ? `— ${REPORT_TYPES[typeFilter]?.label}` : '— Tất cả loại'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Từ ngày</label>
                        <input type="date" value={dateFrom}
                               onChange={e => setDateFrom(e.target.value)}
                               className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg
                                focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Đến ngày</label>
                        <input type="date" value={dateTo}
                               onChange={e => setDateTo(e.target.value)}
                               className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg
                                focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Tìm kiếm ghi chú</label>
                        <input type="text" placeholder="Gõ từ khóa..."
                               value={searchText}
                               onChange={e => setSearchText(e.target.value)}
                               className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg
                                focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                    </div>
                </div>

                <button onClick={fetchReports} disabled={loading}
                        className="px-4 py-2 bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 dark:hover:bg-sky-400 text-white text-sm
                        font-medium rounded-lg disabled:opacity-50">
                    {loading ? '...' : '🔍 Tìm'}
                </button>
            </div>

            {/* Reports List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        📸 Báo cáo của bạn ({reports.length})
                    </p>
                </div>

                {reports.length === 0
                    ? <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                        Không có báo cáo nào
                    </div>
                    : <div className="divide-y divide-gray-100">
                        {reports.map(r => (
                            <div key={r.id} className="p-3 hover:bg-slate-50 dark:bg-slate-800 transition">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex-1">
                                        <p className={`inline-block text-xs font-medium px-2 py-0.5
                      rounded-md ${REPORT_TYPES[r.reportType]?.color || 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                                            {REPORT_TYPES[r.reportType]?.label || r.reportType}
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                            📅 {dayjs(r.date).format('DD/MM/YYYY')}
                                            {r.createdAt && ` • ⏰ ${dayjs(r.createdAt).format('HH:mm')}`}
                                        </p>
                                        {r.note && (
                                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">💬 {r.note}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <a href={r.imageUrl} target="_blank" rel="noreferrer"
                                           className="px-2 py-1 text-xs bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300
                                           rounded-lg hover:bg-indigo-200">
                                            Xem
                                        </a>
                                        <button onClick={() => handleDelete(r.id)}
                                                className="px-2 py-1 text-xs bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300
                                                rounded-lg hover:bg-rose-200 dark:hover:bg-rose-500/25">
                                            Xoá
                                        </button>
                                    </div>
                                </div>

                                {r.imageUrl && (
                                    <img src={r.imageUrl} alt="report"
                                         className="w-full max-h-40 object-cover rounded-lg mt-2"/>
                                )}
                            </div>
                        ))}
                    </div>
                }
            </div>
        </div>
    )
}