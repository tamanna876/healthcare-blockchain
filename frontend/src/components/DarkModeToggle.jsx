import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function DarkModeToggle() {
  const { email } = useAuth()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Load dark mode preference from localStorage
    const savedTheme = localStorage.getItem(`theme_${email}`)
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [email])

  const toggleDarkMode = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)

    if (newIsDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem(`theme_${email}`, 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem(`theme_${email}`, 'light')
    }
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="fixed top-20 right-6 z-30 w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <span className="text-xl">☀️</span>
      ) : (
        <span className="text-xl">🌙</span>
      )}
    </button>
  )
}