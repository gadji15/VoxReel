'use client'

import { Home, FolderOpen, Plus, BookOpen, Settings, Zap, ChevronRight } from 'lucide-react'
import { Logo } from './Logo'
import { cn } from '@/lib/utils'

interface DesktopSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'create', label: 'New Reel', icon: Plus, accent: true },
  { id: 'library', label: 'Library', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function DesktopSidebar({ activeTab, onTabChange }: DesktopSidebarProps) {
  return (
    <aside
      className="hidden lg:flex flex-col w-60 min-h-screen border-r border-border fixed left-0 top-0 bottom-0 z-40"
      style={{ backgroundColor: '#0C0D11' }}
    >
      {/* Logo */}
      <div className="flex items-center px-5 py-5 border-b border-border">
        <Logo size="sm" showText />
      </div>

      {/* Plan badge */}
      <div className="mx-4 mt-4 mb-2">
        <div
          className="flex items-center justify-between px-3 py-2 rounded-lg"
          style={{ backgroundColor: 'rgba(214,179,106,0.08)', border: '1px solid rgba(214,179,106,0.2)' }}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" style={{ color: '#D6B36A' }} />
            <span className="text-xs font-semibold" style={{ color: '#D6B36A' }}>PRO Plan</span>
          </div>
          <span className="text-[10px] text-secondary-text">12 reels left</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1" aria-label="Sidebar navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          if (item.accent) {
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-2 transition-all duration-150 active:scale-98"
                style={{
                  background: 'linear-gradient(135deg, #D64545, #B03030)',
                  boxShadow: isActive ? '0 0 16px rgba(214,69,69,0.4)' : '0 0 10px rgba(214,69,69,0.2)',
                }}
                aria-label={item.label}
              >
                <Icon className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
                <span className="text-sm font-semibold text-white">{item.label}</span>
              </button>
            )
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group',
                isActive
                  ? 'bg-card text-foreground'
                  : 'text-secondary-text hover:bg-muted hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn('w-4.5 h-4.5', isActive && 'text-red-accent')} />
              <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-red-accent opacity-60" />}
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-foreground"
            style={{ background: 'linear-gradient(135deg, #D64545, #7C5CFF)' }}
            aria-hidden="true"
          >
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">Alex Moreno</p>
            <p className="text-[10px] text-secondary-text truncate">alex@voxreel.ai</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
