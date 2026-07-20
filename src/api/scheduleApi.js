import api from './axios'

// Auth
export const login = data => api.post('/auth/login', data)
export const register = data => api.post('/auth/register', data)

// Window
export const getWindowStatus = () => api.get('/api/schedules/window/status')
export const getAdminWindowStatus = () => api.get('/api/admin/window/status')
export const openWindow = () => api.post('/api/admin/window/open')
export const closeWindow = () => api.post('/api/admin/window/close')

// Schedules
export const getMySchedules = () => api.get('/api/schedules/me')
export const registerShift = data => api.post('/api/schedules', data)
export const getPendingRequests = () => api.get('/api/admin/requests')
export const approveRequest = id => api.put(`/api/admin/approve/${id}`)
export const rejectRequest = (id, reason) =>
    api.put(`/api/admin/reject/${id}`, { reason })
export const getAllSchedules = weekStart =>
    api.get('/api/admin/all-schedules', { params: { weekStart } })

// Shift Types
// Dùng chung cho cả admin lẫn nhân viên — /api/admin/shift-types yêu cầu
// role ADMIN nên nhân viên gọi sẽ bị 403, không bao giờ thấy ca mới thêm.
export const getShiftTypes = () => api.get('/api/schedules/shift-types')
export const addShiftType = data => api.post('/api/admin/shift-types', data)
export const updateShiftType = (id, data) =>
    api.put(`/api/admin/shift-types/${id}`, data)
export const deleteShiftType = id =>
    api.delete(`/api/admin/shift-types/${id}`)

// Users
export const getAllUsers = () => api.get('/api/admin/users')
export const createUser = data => api.post('/api/admin/users', data)
export const changeUserRole = (id, role) =>
    api.put(`/api/admin/users/${id}/role`, { role })
export const changeUserDept = (id, department) =>
    api.put(`/api/admin/users/${id}/department`, { department })

// Duty
export const getMyDuties = weekStart =>
    api.get('/api/schedules/duty/week', { params: { weekStart } })
export const getAllDuties = weekStart =>
    api.get('/api/schedules/duty/all', { params: { weekStart } })
export const getDutyWeek = weekStart =>
    api.get('/api/admin/duty/week', { params: { weekStart } })
export const autoScheduleDuty = weekStart =>
    api.post('/api/admin/duty/auto-schedule', { weekStart })
export const updateDuty = (id, data) =>
    api.put(`/api/admin/duty/${id}`, data)

// Admin gán ca thủ công (khi ca nhân viên đăng ký không hợp lệ)
export const assignShift = (userId, date, shift) =>
    api.put('/api/admin/assign-shift', { userId: String(userId), date, shift })
export const clearShift = (userId, date) =>
    api.delete('/api/admin/assign-shift', { params: { userId, date } })

// Notifications
export const getNotifications = () =>
    api.get('/api/schedules/notifications')
export const markAllRead = () =>
    api.put('/api/schedules/notifications/read-all')

// Reports
export const uploadReport = formData =>
    api.post('/api/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
export const getAllReports = (from, to, type) =>
    api.get('/api/reports/all', { params: { from, to, type } })
export const getReportsByDate = (date, type) =>
    api.get('/api/reports/by-date', { params: { date, type } })
export const getMyReports = (from, to) =>
    api.get('/api/reports/my', { params: { from, to } })
export const deleteReport = id => api.delete(`/api/reports/${id}`)