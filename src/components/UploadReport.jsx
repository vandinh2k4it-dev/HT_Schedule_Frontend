import { useState, useRef } from 'react'
import { uploadReport } from '../api/scheduleApi'

const ALL_TYPES = [
    { value: 'CLEANING',      label: '🧹 Trực vệ sinh',     color: 'border-cyan-300 bg-cyan-50 text-cyan-700' },
    { value: 'RECEIVING',     label: '📦 Nhận hàng',        color: 'border-blue-300 bg-blue-50 text-blue-700' },
    { value: 'CHECKING',      label: '🔍 Kiểm hàng',        color: 'border-amber-300 bg-amber-50 text-amber-700' },
    { value: 'SHIPPING',      label: '🚚 Gửi hàng',         color: 'border-orange-300 bg-orange-50 text-orange-700' },
    { value: 'INCIDENT',      label: '⚠️ Sự cố',            color: 'border-red-300 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300' },
    { value: 'WAREHOUSE_EOD', label: '🏬 Kho cuối ngày',    color: 'border-violet-300 bg-violet-50 text-violet-700' },
]

// Loại báo cáo được phép theo từng bộ phận:
// - SALES: đầy đủ (trừ Kho cuối ngày — chỉ Warehouse mới có)
// - WAREHOUSE: Nhận/Gửi hàng + Sự cố + Kho cuối ngày (không Trực VS/Kiểm hàng)
// - MARKETING / TECHNICIAN / CASHIER: chỉ Nhận hàng, Gửi hàng, Sự cố
const DEPT_TYPES = {
    SALES:      ['CLEANING', 'RECEIVING', 'CHECKING', 'SHIPPING', 'INCIDENT'],
    WAREHOUSE:  ['RECEIVING', 'SHIPPING', 'INCIDENT', 'WAREHOUSE_EOD'],
    MARKETING:  ['RECEIVING', 'SHIPPING', 'INCIDENT'],
    TECHNICIAN: ['RECEIVING', 'SHIPPING', 'INCIDENT'],
    CASHIER:    ['RECEIVING', 'SHIPPING', 'INCIDENT'],
}

export default function UploadReport({ onSuccess, department = null }) {
    const allowedValues = DEPT_TYPES[department] || ALL_TYPES.map(t => t.value)
    const TYPES = ALL_TYPES.filter(t => allowedValues.includes(t.value))

    const [type, setType] = useState(TYPES[0]?.value || 'INCIDENT')
    const [note, setNote] = useState('')
    const [files, setFiles] = useState([])
    const [previews, setPreviews] = useState([])
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [msg, setMsg] = useState(null)
    const fileRef = useRef()
    const camRef = useRef()

    const addFiles = e => {
        const arr = Array.from(e.target.files)
        if (!arr.length) return
        setFiles(p => [...p, ...arr])
        setPreviews(p => [...p, ...arr.map(f => ({
            url: URL.createObjectURL(f),
            isVideo: f.type.startsWith('video'),
            name: f.name
        }))])
    }

    const removeFile = i => {
        setFiles(p => p.filter((_, j) => j !== i))
        setPreviews(p => p.filter((_, j) => j !== i))
    }

    const handleSubmit = async () => {
        if (!files.length) {
            setMsg({ ok: false, text: 'Vui lòng chọn ít nhất 1 file!' })
            return
        }
        setLoading(true)
        setProgress(0)
        let ok = 0
        for (let i = 0; i < files.length; i++) {
            try {
                const fd = new FormData()
                fd.append('file', files[i])
                fd.append('reportType', type)
                fd.append('note', note)
                fd.append('date', new Date().toISOString().split('T')[0])
                await uploadReport(fd)
                ok++
                setProgress(Math.round((i + 1) / files.length * 100))
            } catch (err) {
                console.error(`Upload file ${i + 1} failed:`, err)
            }
        }
        setLoading(false)
        setProgress(0)
        if (ok > 0) {
            setMsg({ ok: true, text: `✅ Upload ${ok}/${files.length} file thành công!` })
            setFiles([])
            setPreviews([])
            setNote('')
            onSuccess?.()
        } else {
            setMsg({ ok: false, text: '❌ Upload thất bại!' })
        }
        setTimeout(() => setMsg(null), 3000)
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 mb-4">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">
                📸 Gửi báo cáo
            </h2>

            {/* Loại báo cáo */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {TYPES.map(t => (
                    <button key={t.value} onClick={() => setType(t.value)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-medium
              border-2 transition text-left ${
                                type === t.value
                                    ? t.color
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Nút chọn file */}
            <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => fileRef.current.click()}
                        className="py-3 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:bg-sky-500/15
            text-sky-700 dark:text-sky-300 rounded-xl text-sm font-medium
            border-2 border-dashed border-indigo-200 transition">
                    🖼️ Chọn ảnh/video
                </button>
                <button onClick={() => camRef.current.click()}
                        className="py-3 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:bg-sky-500/15
            text-sky-700 dark:text-sky-300 rounded-xl text-sm font-medium
            border-2 border-dashed border-green-200 transition">
                    📷 Chụp ảnh
                </button>
                <input ref={fileRef} type="file"
                       accept="image/*,video/*" multiple
                       onChange={addFiles} className="hidden"/>
                <input ref={camRef} type="file"
                       accept="image/*" capture="environment"
                       onChange={addFiles} className="hidden"/>
            </div>

            {/* Preview */}
            {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {previews.map((p, i) => (
                        <div key={i} className="relative group rounded-xl
              overflow-hidden border border-slate-100 dark:border-slate-700 aspect-square">
                            {p.isVideo
                                ? <div className="w-full h-full bg-slate-900 flex
                    items-center justify-center">
                                    <span className="text-white text-2xl">🎥</span>
                                </div>
                                : <img src={p.url} alt=""
                                       className="w-full h-full object-cover"/>
                            }
                            <button onClick={() => removeFile(i)}
                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500
                  text-white rounded-full text-xs opacity-0
                  group-hover:opacity-100 transition
                  flex items-center justify-center">✕</button>
                        </div>
                    ))}
                    <button onClick={() => fileRef.current.click()}
                            className="aspect-square rounded-xl border-2 border-dashed
              border-slate-200 dark:border-slate-700 flex items-center justify-center
              text-slate-300 dark:text-slate-600 hover:border-indigo-300
              hover:text-indigo-400 transition text-2xl">+</button>
                </div>
            )}

            {/* Ghi chú */}
            <textarea value={note} onChange={e => setNote(e.target.value)}
                      placeholder="Ghi chú (tuỳ chọn)..." rows={2}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl
          text-sm focus:outline-none focus:ring-2 focus:ring-sky-500
          resize-none mb-3"/>

            {/* Progress */}
            {loading && progress > 0 && (
                <div className="mb-3">
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-900 dark:bg-sky-500 transition-all rounded-full"
                             style={{ width: `${progress}%` }}/>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                        {progress}%
                    </p>
                </div>
            )}

            {msg && (
                <div className={`p-2 rounded-xl text-sm text-center mb-3 ${
                    msg.ok ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300'}`}>
                    {msg.text}
                </div>
            )}

            <button onClick={handleSubmit}
                    disabled={loading || !files.length}
                    className="w-full py-3 bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 dark:hover:bg-sky-400
          text-white text-sm font-semibold rounded-xl transition
          disabled:opacity-50">
                {loading
                    ? `Đang upload ${progress}%...`
                    : `📤 Gửi báo cáo${files.length > 0 ? ` (${files.length} file)` : ''}`}
            </button>
        </div>
    )
}