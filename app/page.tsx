'use client'

import { useState } from 'react'
import { MobileBottomNav } from '@/components/voxreel/MobileBottomNav'
import { DesktopSidebar } from '@/components/voxreel/DesktopSidebar'
import { LandingPage } from '@/components/screens/LandingPage'
import { HomeDashboard } from '@/components/screens/HomeDashboard'
import { ProjectsScreen } from '@/components/screens/ProjectsScreen'
import { AudioUploadScreen, StyleSelectionScreen } from '@/components/screens/CreateFlow'
import {
  AnalysisProgressScreen,
  TranscriptReviewScreen,
} from '@/components/screens/AnalysisScreens'
import {
  StoryboardScreen,
  SceneDetailEditor,
} from '@/components/screens/StoryboardScreens'
import {
  PreviewScreen,
  RenderProgressScreen,
  ExportSuccessScreen,
  SettingsScreen,
} from '@/components/screens/FinalScreens'

type View =
  | 'landing'
  | 'home'
  | 'projects'
  | 'create-upload'
  | 'create-style'
  | 'analysis'
  | 'transcript'
  | 'storyboard'
  | 'scene-editor'
  | 'preview'
  | 'rendering'
  | 'export-success'
  | 'settings'

const tabToView: Record<string, View> = {
  home: 'home',
  projects: 'projects',
  create: 'create-upload',
  library: 'projects',
  settings: 'settings',
}

const viewToTab: Record<View, string> = {
  landing: '',
  home: 'home',
  projects: 'projects',
  'create-upload': 'create',
  'create-style': 'create',
  analysis: 'create',
  transcript: 'create',
  storyboard: 'create',
  'scene-editor': 'create',
  preview: 'create',
  rendering: 'create',
  'export-success': 'create',
  settings: 'settings',
}

export default function VoxReelApp() {
  const [view, setView] = useState<View>('landing')
  const [activeSceneId, setActiveSceneId] = useState<number>(4)

  const activeTab = viewToTab[view]
  const isInApp = view !== 'landing'

  const handleTabChange = (tab: string) => {
    const target = tabToView[tab]
    if (target) setView(target)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Landing */}
      {view === 'landing' && (
        <LandingPage onGetStarted={() => setView('home')} />
      )}

      {/* App shell */}
      {isInApp && (
        <div className="flex min-h-screen">
          <DesktopSidebar activeTab={activeTab} onTabChange={handleTabChange} />

          <main
            className="flex-1 min-w-0 px-4 pt-6 lg:pt-8 lg:px-8 lg:ml-60"
            role="main"
            aria-label="Main content"
          >
            <div className="max-w-2xl mx-auto">

              {view === 'home' && (
                <HomeDashboard
                  onCreateReel={() => setView('create-upload')}
                  onOpenProject={() => setView('storyboard')}
                />
              )}

              {view === 'projects' && (
                <ProjectsScreen
                  onCreateReel={() => setView('create-upload')}
                  onOpenProject={() => setView('storyboard')}
                />
              )}

              {view === 'create-upload' && (
                <AudioUploadScreen
                  onNext={() => setView('create-style')}
                  onBack={() => setView('home')}
                />
              )}

              {view === 'create-style' && (
                <StyleSelectionScreen
                  onNext={() => setView('analysis')}
                  onBack={() => setView('create-upload')}
                />
              )}

              {view === 'analysis' && (
                <AnalysisProgressScreen
                  onComplete={() => setView('transcript')}
                />
              )}

              {view === 'transcript' && (
                <TranscriptReviewScreen
                  onNext={() => setView('storyboard')}
                  onBack={() => setView('analysis')}
                />
              )}

              {view === 'storyboard' && (
                <StoryboardScreen
                  onSceneSelect={(id) => {
                    setActiveSceneId(id)
                    setView('scene-editor')
                  }}
                  onNext={() => setView('preview')}
                  onBack={() => setView('transcript')}
                />
              )}

              {view === 'scene-editor' && (
                <SceneDetailEditor
                  sceneId={activeSceneId}
                  onBack={() => setView('storyboard')}
                  onNext={() => setView('storyboard')}
                />
              )}

              {view === 'preview' && (
                <PreviewScreen
                  onRender={() => setView('rendering')}
                  onBack={() => setView('storyboard')}
                />
              )}

              {view === 'rendering' && (
                <RenderProgressScreen
                  onComplete={() => setView('export-success')}
                  onBack={() => setView('preview')}
                />
              )}

              {view === 'export-success' && (
                <ExportSuccessScreen
                  onNewReel={() => setView('create-upload')}
                  onHome={() => setView('home')}
                />
              )}

              {view === 'settings' && (
                <SettingsScreen onBack={() => setView('home')} />
              )}

            </div>
          </main>

          <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
      )}
    </div>
  )
}
