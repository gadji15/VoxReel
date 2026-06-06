'use client'

import { Home, FolderOpen, Plus, BookOpen, Settings } from 'lucide-react'
import { Logo } from './Logo'
import { cn } from '@/lib/utils'

interface DesktopSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navItems = [
  { id: 'home',     label: 'Home',     icon: Home },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'create',   label: 'New Reel', icon: Plus, accent: true },
  { id: 'library',  label: 'Library',  icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function DesktopSidebar({ activeTab, onTabChange }: DesktopSidebarProps) {
  return (
    <aside
      className="hidden lg:flex flex-col w-56 min-h-screen border-r fixed left-0 top-0 bottom-0 z-40"
      style={{ backgroundColor: '#08090D', borderColor: '#1C2029' }}
    >
      {/* Logo */}
      <div className="px-5 py-6" style={{ borderBottom: '1px solid #1C2029' }}>
        <Logo size="sm" showText />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5" aria-label="Sidebar navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          if (item.accent) {
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl my-1 transition-all duration-150 active:scale-[0.98]"
                style={{
                  border: '1px solid rgba(196,60,60,0.35)',
                  backgroundColor: 'rgba(196,60,60,0.06)',
                  color: '#C43C3C',
                }}
                aria-label={item.label}
              >
                <Icon className="w-4 h-4" strokeWidth={2} style={{ color: '#C43C3C' }} />
                <span className="text-sm font-semibold" style={{ color: '#C43C3C' }}>{item.label}</span>
              </button>
            )
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
                isActive
                  ? 'bg-card text-foreground'
                  : 'hover:bg-muted'
              )}
              style={{ color: isActive ? '#F0EDE6' : '#7A8394' }}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className="w-4 h-4 shrink-0"
                style={{ color: isActive ? '#F0EDE6' : '#7A8394' }}
              />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-5" style={{ borderTop: '1px solid #1C2029' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #C43C3C, #6B4FE8)' }}
            aria-hidden="true"
          >
            A
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">Alex Moreno</p>
            <p className="text-[10px] truncate" style={{ color: '#7A8394' }}>Pro Plan · 12 reels left</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
