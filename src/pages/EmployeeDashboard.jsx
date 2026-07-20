import { useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import WeeklyScheduleGrid from '../components/WeeklyScheduleGrid.jsx'
import EmployeeDutyView from '../components/EmployeeDutyView.jsx'
import EmployeeDutySpecialTab from '../components/EmployeeDutySpecialTab.jsx'
import EmployeeReportView from '../components/EmployeeReportView.jsx'
import UploadReport from '../components/UploadReport.jsx'
import { parseJwt } from '../utils/jwt.js'

export default function EmployeeDashboard() {
    const [tab, setTab] = useState('register')
    const [reportKey, setReportKey] = useState(0)

    const token = localStorage.getItem('token')
    const payload = parseJwt(token)

    // Chỉ SALES (Trực VS, Lau sản phẩm, Kiểm hàng, Trực online, Tắt điện)
    // và WAREHOUSE (chỉ Thay thảm) có công việc trực đặc biệt.
    // Marketing/Cashier/Technician chỉ xem ca làm + gửi báo cáo.
    const hasSpecialDuty = ['SALES', 'WAREHOUSE'].includes(payload.department)

    // Tab "Đăng ký ca" luôn hiện; bản thân WeeklyScheduleGrid tự kiểm tra
    // admin đã "Mở đăng ký" chưa — mở thì cho chọn ca tuần sau, đóng thì
    // hiện thông báo khoá, không cần tách 2 UI riêng.
    const TABS = [
        { key: 'register', label: '📋 Đăng ký ca' },
        { key: 'schedule', label: '📅 Lịch làm' },
        ...(hasSpecialDuty ? [{ key: 'duty', label: '🗓️ Lịch trực' }] : []),
        { key: 'report',   label: '📸 Báo cáo'  },
    ]

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
            <Navbar
                name={payload.name || 'Nhân viên'}
                role="EMPLOYEE"
                department={payload.department}
            />
            <div className="max-w-3xl mx-auto px-3 py-4 animate-fade-in-up">

                {/* Tabs */}
                <div className={`grid gap-2 mb-4 ${
                    TABS.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                                className={`py-2.5 rounded-xl text-xs font-medium
                  transition-all duration-200 ${
                                    tab === t.key
                                        ? 'bg-slate-900 dark:bg-sky-500 text-white shadow-md shadow-slate-900/10'
                                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-slate-800 dark:hover:text-slate-100'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab: Đăng ký ca tuần sau (khoá tự động nếu admin chưa mở) */}
                {tab === 'register' && (
                    <WeeklyScheduleGrid />
                )}

                {/* Tab: Lịch làm (Ca làm việc + Kiểm hàng/Trực online nếu có) */}
                {tab === 'schedule' && (
                    <EmployeeDutyView department={payload.department} />
                )}

                {/* Tab: Lịch trực đặc biệt — chỉ hiện với bộ phận có việc trực */}
                {tab === 'duty' && hasSpecialDuty && (
                    <EmployeeDutySpecialTab department={payload.department} />
                )}

                {/* Tab: Báo cáo */}
                {tab === 'report' && (
                    <div className="space-y-4">
                        <UploadReport
                            department={payload.department}
                            onSuccess={() => setReportKey(k => k + 1)}
                        />
                        <EmployeeReportView key={reportKey} />
                    </div>
                )}
            </div>
        </div>
    )
}