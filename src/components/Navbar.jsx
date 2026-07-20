import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markAllRead } from '../api/scheduleApi'
import ThemeToggle from './ThemeToggle.jsx'
import logo from '../assets/logo.png'

const DEPT_LABEL = {
    CASHIER: 'Cashier', SALES: 'Sales',
    WAREHOUSE: 'Warehouse', MARKETING: 'Marketing',
    TECHNICIAN: 'Technician'
}

export default function Navbar({ name, role, department }) {
    const navigate = useNavigate()
    const [notifs, setNotifs] = useState([])
    const [showNotif, setShowNotif] = useState(false)

    const fetchNotif = async () => {
        try {
            const res = await getNotifications()
            setNotifs(res.data || [])
        } catch (err) {
            console.error('fetchNotif failed:', err)
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void fetchNotif()
        const t = setInterval(fetchNotif, 15000)
        return () => clearInterval(t)
    }, [])

    const handleMarkRead = async () => {
        await markAllRead(); setNotifs([]); setShowNotif(false)
    }

    return (
        <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl
      border-b border-slate-200/70 dark:border-slate-800 px-4 py-3
      sticky top-0 z-50">
            <div className="max-w-4xl mx-auto flex items-center justify-between">

                <div className="flex items-center gap-2.5 min-w-0">
                    <img src={logo} alt="HTCamera Schedule"
                         className="w-9 h-9 rounded-xl object-cover shadow-sm
              ring-1 ring-slate-900/5 dark:ring-white/10 shrink-0"/>
                    <div className="hidden sm:block min-w-0">
                        <span className="font-bold text-slate-800 dark:text-slate-100
              text-sm block leading-tight truncate">
                            HTCamera Schedule
                        </span>
                        {department && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                {DEPT_LABEL[department]}
                            </span>
                        )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        role === 'ADMIN'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                            : 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'}`}>
                        {role}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <ThemeToggle />

                    <div className="relative">
                        <button onClick={() => setShowNotif(!showNotif)}
                                className="relative p-2 rounded-xl transition
                  hover:bg-slate-100 dark:hover:bg-slate-800">
                            <svg className="w-5 h-5 text-slate-600 dark:text-slate-300"
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118
                     14.158V11a6 6 0 10-12 0v3.159c0
                     .538-.214 1.055-.595 1.436L4 17h5m6
                     0v1a3 3 0 11-6 0v-1m6 0H9"/>
                            </svg>
                            {notifs.length > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4
                  bg-rose-500 text-white text-xs rounded-full
                  flex items-center justify-center">
                                    {notifs.length > 9 ? '9+' : notifs.length}
                                </span>
                            )}
                        </button>

                        {showNotif && (
                            <div className="absolute right-0 mt-2 w-72
                bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl
                border border-slate-200 dark:border-slate-700
                rounded-2xl shadow-xl shadow-slate-900/10 z-50
                overflow-hidden animate-fade-in-up">
                                <div className="px-4 py-3 border-b border-slate-100
                  dark:border-slate-700 flex justify-between items-center
                  bg-slate-50 dark:bg-slate-800">
                                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                                        🔔 Thông báo
                                    </span>
                                    {notifs.length > 0 && (
                                        <button onClick={handleMarkRead}
                                                className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                            Đọc tất cả
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifs.length === 0
                                        ? <p className="text-center text-slate-400
                        text-sm py-8">Không có thông báo</p>
                                        : notifs.map(n => (
                                            <div key={n.id} className="px-4 py-3
                        border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                                                <p className="text-sm text-slate-700 dark:text-slate-200">{n.message}</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                                    {new Date(n.createdAt)
                                                        .toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>

                    <span className="text-sm text-slate-700 dark:text-slate-200 hidden sm:block font-medium">
                        {name}
                    </span>
                    <button onClick={() => {
                        localStorage.removeItem('token')
                        navigate('/login')
                    }} className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800
            hover:bg-slate-200 dark:hover:bg-slate-700
            text-slate-700 dark:text-slate-200 rounded-xl transition font-medium">
                        Đăng xuất
                    </button>
                </div>
            </div>
        </nav>
    )
}
