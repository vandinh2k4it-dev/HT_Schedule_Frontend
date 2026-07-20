import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/scheduleApi'
import logo from '../assets/logo.png'

export default function LoginPage() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })
    const [msg, setMsg] = useState(null)
    const [loading, setLoading] = useState(false)

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = async () => {
        if (!form.email || !form.password) {
            setMsg({ ok: false, text: 'Vui lòng điền đầy đủ!' })
            return
        }
        setLoading(true)
        setMsg(null)
        try {
            const res = await login(form)
            localStorage.setItem('token', res.data.token)
            navigate(res.data.role === 'ADMIN' ? '/admin' : '/dashboard')
        } catch (err) {
            setMsg({ ok: false, text: err.response?.data || 'Email hoặc mật khẩu sai!' })
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50 to-slate-200
      dark:from-slate-950 dark:via-slate-900 dark:to-slate-950
      flex items-center justify-center p-4 transition-colors">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl
        rounded-3xl shadow-2xl shadow-slate-900/10 w-full max-w-sm p-8
        border border-white/60 dark:border-slate-700 animate-fade-in-up">

                <div className="text-center mb-8">
                    <img src={logo} alt="HTCamera Schedule"
                         className="w-20 h-20 mx-auto rounded-2xl shadow-lg
              shadow-sky-900/20 mb-4 object-cover"/>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        HTCamera Schedule
                    </h1>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                        Quản lý ca làm việc
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">
                            Email
                        </label>
                        <input type="email" placeholder="email@htcamera.com"
                               value={form.email} onChange={e => set('email', e.target.value)}
                               className="w-full px-4 py-3 bg-white dark:bg-slate-900
                border border-slate-200 dark:border-slate-700 rounded-xl
                text-sm text-slate-800 dark:text-slate-100
                focus:outline-none focus:ring-2 focus:ring-sky-500 transition"/>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">
                            Mật khẩu
                        </label>
                        <input type="password" placeholder="••••••••"
                               value={form.password}
                               onChange={e => set('password', e.target.value)}
                               onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                               className="w-full px-4 py-3 bg-white dark:bg-slate-900
                border border-slate-200 dark:border-slate-700 rounded-xl
                text-sm text-slate-800 dark:text-slate-100
                focus:outline-none focus:ring-2 focus:ring-sky-500 transition"/>
                    </div>

                    {msg && (
                        <div className={`p-3 rounded-xl text-sm ${
                            msg.ok
                                ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30'
                                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'}`}>
                            {msg.text}
                        </div>
                    )}

                    <button onClick={handleSubmit} disabled={loading}
                            className="w-full py-3 bg-slate-900 dark:bg-sky-500
              hover:bg-slate-800 dark:hover:bg-sky-400
              text-white font-semibold rounded-xl transition
              disabled:opacity-50 text-sm shadow-lg shadow-slate-900/10">
                        {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                    </button>

                    <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                        Chưa có tài khoản? Liên hệ admin để được tạo tài khoản.
                    </p>
                </div>
            </div>
        </div>
    )
}
