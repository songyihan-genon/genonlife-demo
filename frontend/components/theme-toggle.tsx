'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  collapsed?: boolean
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ collapsed, className, showLabel }: ThemeToggleProps) {
  const { theme, systemTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size={collapsed ? 'icon' : 'sm'}
        className={cn('justify-center', className)}
        disabled
      >
        <Moon className="h-4 w-4" />
      </Button>
    )
  }

  const resolvedTheme = theme === 'system' ? systemTheme : theme
  const isDark = resolvedTheme === 'dark'

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <Button
      variant="ghost"
      size={collapsed ? 'icon' : 'sm'}
      className={cn(
        'flex items-center',
        showLabel ? 'justify-start w-full px-2' : 'justify-center rounded-full bg-muted hover:bg-accent',
        !collapsed && !showLabel && 'px-2',
        className,
      )}
      onClick={handleToggle}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {showLabel && <span className="ml-2">{isDark ? '라이트 모드' : '다크 모드'}</span>}
    </Button>
  )
}
