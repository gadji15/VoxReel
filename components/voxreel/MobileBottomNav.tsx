'use client'

import { Home, FolderOpen, Plus, BookOpen, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'create', label: 'Create', icon: Plus, isCreate: true },
  { id: 'library', label: 'Library', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      aria-label="Main navigation"
      style={{ backgroundColor: '#0C0D11', borderTop: '1px solid #252A33' }}
    >
      <div className="flex items-center justify-around px-2 pb-safe pt-2 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          if (item.isCreate) {
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="flex flex-col items-center gap-0.5 -mt-6"
                aria-label="Create new reel"
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-14 h-14 rounded-full transition-all duration-200',
                    'shadow-lg',
                    isActive
                      ? 'scale-105'
                      : 'hover:scale-105 active:scale-95'
                  )}
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, #D64545, #B03030)'
                      : 'linear-gradient(135deg, #D64545, #B03030)',
                    boxShadow: '0 0 20px rgba(214,69,69,0.5)',
                  }}
                >
                  <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-medium text-secondary-text mt-1">Create</span>
              </button>
            )
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center gap-1 min-w-[48px] py-1 transition-all duration-150"
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-colors duration-150',
                  isActive ? 'text-red-accent' : 'text-secondary-text'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors duration-150',
                  isActive ? 'text-foreground' : 'text-secondary-text'
                )}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
