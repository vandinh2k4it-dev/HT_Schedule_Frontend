import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import EmployeeDashboard from './pages/EmployeeDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import { parseJwt } from './utils/jwt.js'

function getPayload() {
  const token = localStorage.getItem('token')
  if (!token) return null
  const payload = parseJwt(token)
  return Object.keys(payload).length ? payload : null
}

function PrivateRoute({ children, role }) {
  const payload = getPayload()
  if (!payload) return <Navigate to="/login"/>
  if (role && payload.role !== role) return <Navigate to="/login"/>
  return children
}

export default function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage/>}/>
          <Route path="/dashboard" element={
            <PrivateRoute role="EMPLOYEE">
              <EmployeeDashboard/>
            </PrivateRoute>
          }/>
          <Route path="/admin" element={
            <PrivateRoute role="ADMIN">
              <AdminDashboard/>
            </PrivateRoute>
          }/>
          <Route path="*" element={<Navigate to="/login"/>}/>
        </Routes>
      </BrowserRouter>
  )
}