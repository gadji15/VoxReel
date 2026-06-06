'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  height?: 'half' | 'tall' | 'full'
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  height = 'half',
}: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const heightClass = {
    half: 'max-h-[55vh]',
    tall: 'max-h-[75vh]',
    full: 'max-h-[92vh]',
  }[height]

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-border',
          'flex flex-col transition-transform duration-300 ease-out',
          heightClass,
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ backgroundColor: '#111318' }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" aria-hidden="true" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-border transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-secondary-text" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </>
  )
}
