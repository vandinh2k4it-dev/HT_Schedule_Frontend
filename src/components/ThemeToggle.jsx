import { useTheme } from '../context/ThemeContext.jsx'

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()
    const isDark = theme === 'dark'

    return (
        <button
            onClick={toggleTheme}
            aria-label="Đổi giao diện sáng/tối"
            className={`relative w-14 h-8 rounded-full transition-colors duration-300
        flex items-center px-1 shrink-0
        ${isDark ? 'bg-slate-700' : 'bg-sky-100'}`}>
            <span
                className={`absolute top-1 left-1 w-6 h-6 rounded-full shadow-md
          flex items-center justify-center text-xs transition-transform
          duration-300 ease-out
          ${isDark ? 'translate-x-6 bg-slate-900' : 'translate-x-0 bg-white'}`}>
                {isDark ? '🌙' : '☀️'}
            </span>
        </button>
    )
}
