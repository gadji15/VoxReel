'use client'

import { Search, Filter, Plus, Grid3X3, List } from 'lucide-react'
import { useState } from 'react'
import { ProjectCard } from '@/components/voxreel/ProjectCard'
import { mockProjects } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface ProjectsScreenProps {
  onCreateReel: () => void
  onOpenProject: (id: string) => void
}

const filters = ['All', 'Published', 'Rendering', 'Draft']

export function ProjectsScreen({ onCreateReel, onOpenProject }: ProjectsScreenProps) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  const filtered = mockProjects.filter((p) => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Published') return p.status === 'complete'
    if (activeFilter === 'Rendering') return p.status === 'rendering'
    if (activeFilter === 'Draft') return p.status === 'draft'
    return true
  })

  return (
    <div className="flex flex-col gap-5 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        <button
          onClick={onCreateReel}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #D64545, #B03030)' }}
        >
          <Plus className="w-4 h-4" />
          New Reel
        </button>
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border"
        style={{ backgroundColor: '#111318' }}
      >
        <Search className="w-4 h-4 text-secondary-text shrink-0" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search projects..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-secondary-text outline-none"
          aria-label="Search projects"
        />
        <button aria-label="Filter">
          <Filter className="w-4 h-4 text-secondary-text" />
        </button>
      </div>

      {/* Filters + View toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide" role="group" aria-label="Filter by status">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all duration-150',
                activeFilter === f
                  ? 'text-foreground'
                  : 'text-secondary-text hover:text-foreground'
              )}
              style={activeFilter === f
                ? { backgroundColor: 'rgba(214,69,69,0.15)', border: '1px solid rgba(214,69,69,0.35)', color: '#D64545' }
                : { backgroundColor: '#111318', border: '1px solid #252A33' }
              }
              aria-pressed={activeFilter === f}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={cn('w-8 h-8 flex items-center justify-center rounded-lg transition-colors', viewMode === 'list' ? 'bg-card text-foreground' : 'text-secondary-text hover:text-foreground')}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn('w-8 h-8 flex items-center justify-center rounded-lg transition-colors', viewMode === 'grid' ? 'bg-card text-foreground' : 'text-secondary-text hover:text-foreground')}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-secondary-text">{filtered.length} projects</p>

      {/* Projects */}
      <div className={cn(
        'gap-4',
        viewMode === 'grid' ? 'grid grid-cols-2' : 'flex flex-col'
      )}>
        {filtered.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => onOpenProject(project.id)}
          />
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(214,69,69,0.1)', border: '1px solid rgba(214,69,69,0.2)' }}
            aria-hidden="true"
          >
            <Plus className="w-7 h-7 text-red-accent" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-foreground mb-1">No {activeFilter.toLowerCase()} projects</p>
            <p className="text-sm text-secondary-text">Start by recording your first story.</p>
          </div>
          <button
            onClick={onCreateReel}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #D64545, #B03030)' }}
          >
            Record Now
          </button>
        </div>
      )}
    </div>
  )
}
