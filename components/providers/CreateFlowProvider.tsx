'use client'

/**
 * VoxReel — Create Flow Provider (frontend-only)
 *
 * A lightweight React Context + reducer that holds the shared *draft project*
 * for the `/app/create/*` flow. Replaces the previous isolated per-screen mock
 * state so every routed step reads/writes the same typed draft.
 *
 * Scope guardrails (intentionally NOT implemented here):
 *  - No Supabase, auth, real audio upload, transcription, LLM, stock-video, or
 *    rendering calls. Statuses are mock lifecycle markers only.
 *  - Persistence is localStorage-only (client), best-effort, SSR-safe.
 */

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useMemo,
  type ReactNode,
} from 'react'
import type {
  CreateFlowState,
  Scene,
  TranscriptLine,
  Caption,
  AudioMetadata,
  ExportMetadata,
  VisualSource,
} from '@/lib/types'
import { getEmotionColor } from '@/lib/emotions'
import {
  mockProjects,
  mockScenes,
  mockTranscript,
  mockCaptions,
} from '@/lib/mock-data'
import { isRealProjectId } from '@/lib/navigation/create-flow-url'
import { updateProjectSettingsAction } from '@/app/app/create/actions'

/** localStorage key is project-aware so drafts never mix between projects. */
const STORAGE_KEY_BASE = 'voxreel:create-flow-draft'
function storageKeyFor(projectId: string | null | undefined): string {
  return projectId ? `${STORAGE_KEY_BASE}:${projectId}` : STORAGE_KEY_BASE
}

/* ──────────────────────────────────────────────────────────────────────────
 * Initial / mock-derived state
 * ────────────────────────────────────────────────────────────────────────── */

/** Build a fresh draft from the featured mock project ("Midnight Betrayal"). */
function buildMockDraft(): CreateFlowState {
  const featured = mockProjects[0]
  return {
    currentProjectId: featured.id,
    projectTitle: featured.title,
    language: 'English',
    storyStyle: 'noir',
    visualSource: 'stock',
    captionStyle: 'bold-center',
    audio: {
      fileName: 'midnight-betrayal.mp3',
      duration: featured.duration,
      size: '3.4 MB',
      mimeType: 'audio/mpeg',
      status: 'ready',
    },
    transcript: mockTranscript.map((l) => ({ ...l })),
    scenes: mockScenes.map((s) => ({ ...s })),
    captions: mockCaptions.map((c) => ({ ...c })),
    selectedSceneId: mockScenes[0]?.id ?? null,
    renderStatus: 'idle',
    export: {
      fileName: 'midnight-betrayal.mp4',
      resolution: '1080 × 1920',
      quality: '1080p',
      format: 'MP4',
      duration: featured.duration,
      size: '24.8 MB',
      createdAt: null,
    },
    updatedAt: new Date(0).toISOString(),
  }
}

/** Recompute `index`/`total` after add/delete/reorder so scenes stay coherent. */
function reindexScenes(scenes: Scene[]): Scene[] {
  const total = scenes.length
  return scenes.map((scene, i) => ({ ...scene, index: i + 1, total }))
}

/* ──────────────────────────────────────────────────────────────────────────
 * Actions
 * ────────────────────────────────────────────────────────────────────────── */

type Action =
  | { type: 'HYDRATE'; state: CreateFlowState }
  | { type: 'SET_AUDIO_METADATA'; audio: Partial<AudioMetadata> }
  | { type: 'SET_LANGUAGE'; language: string }
  | { type: 'SET_STORY_STYLE'; storyStyle: string }
  | { type: 'SET_VISUAL_SOURCE'; visualSource: VisualSource }
  | { type: 'SET_CAPTION_STYLE'; captionStyle: string }
  | { type: 'SET_TRANSCRIPT'; transcript: TranscriptLine[] }
  | { type: 'UPDATE_TRANSCRIPT_LINE'; id: number; text: string }
  | { type: 'SET_SCENES'; scenes: Scene[] }
  | { type: 'UPDATE_SCENE'; id: number; patch: Partial<Scene> }
  | { type: 'ADD_SCENE'; scene?: Partial<Scene> }
  | { type: 'DELETE_SCENE'; id: number }
  | { type: 'REORDER_SCENES'; from: number; to: number }
  | { type: 'LOCK_SCENE'; id: number; locked: boolean }
  | { type: 'SET_SELECTED_SCENE_ID'; id: number | null }
  | { type: 'REPLACE_SCENE_CLIP'; id: number; clip: string; clipMatch?: number }
  | { type: 'UPDATE_SCENE_MOTION'; id: number; motion: string }
  | { type: 'UPDATE_SCENE_TRANSITION'; id: number; transition: string }
  | { type: 'UPDATE_CAPTION_TEXT'; id: number; text: string }
  | { type: 'SET_RENDER_STATUS'; status: CreateFlowState['renderStatus'] }
  | { type: 'SET_EXPORT_METADATA'; export: Partial<ExportMetadata> }
  | { type: 'UPDATE_PROJECT_TITLE'; title: string }
  | { type: 'RESET' }
  | { type: 'HYDRATE_FROM_MOCK' }

function touch(state: CreateFlowState): CreateFlowState {
  return { ...state, updatedAt: new Date().toISOString() }
}

function patchScene(state: CreateFlowState, id: number, patch: Partial<Scene>): CreateFlowState {
  return touch({
    ...state,
    scenes: state.scenes.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  })
}

function reducer(state: CreateFlowState, action: Action): CreateFlowState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state

    case 'SET_AUDIO_METADATA':
      return touch({ ...state, audio: { ...state.audio, ...action.audio } })

    case 'SET_LANGUAGE':
      return touch({ ...state, language: action.language })

    case 'SET_STORY_STYLE':
      return touch({ ...state, storyStyle: action.storyStyle })

    case 'SET_VISUAL_SOURCE':
      return touch({ ...state, visualSource: action.visualSource })

    case 'SET_CAPTION_STYLE':
      return touch({ ...state, captionStyle: action.captionStyle })

    case 'SET_TRANSCRIPT':
      return touch({ ...state, transcript: action.transcript })

    case 'UPDATE_TRANSCRIPT_LINE':
      return touch({
        ...state,
        transcript: state.transcript.map((l) =>
          l.id === action.id ? { ...l, text: action.text } : l
        ),
      })

    case 'SET_SCENES':
      return touch({ ...state, scenes: reindexScenes(action.scenes) })

    case 'UPDATE_SCENE':
      return patchScene(state, action.id, action.patch)

    case 'ADD_SCENE': {
      const nextId =
        state.scenes.reduce((max, s) => Math.max(max, s.id), 0) + 1
      const base: Scene = {
        id: nextId,
        index: state.scenes.length + 1,
        total: state.scenes.length + 1,
        timeStart: '0:00',
        timeEnd: '0:00',
        emotion: 'Numbness',
        emotionColor: getEmotionColor('Numbness'),
        intensity: 50,
        text: 'New scene',
        visualIntent: '',
        clip: '',
        clipMatch: 0,
        motion: 'Static Hold',
        transition: 'Hard Cut',
        locked: false,
        ...action.scene,
      }
      return touch({ ...state, scenes: reindexScenes([...state.scenes, base]) })
    }

    case 'DELETE_SCENE': {
      const scenes = reindexScenes(state.scenes.filter((s) => s.id !== action.id))
      const selectedSceneId =
        state.selectedSceneId === action.id
          ? scenes[0]?.id ?? null
          : state.selectedSceneId
      return touch({ ...state, scenes, selectedSceneId })
    }

    case 'REORDER_SCENES': {
      const { from, to } = action
      if (
        from < 0 ||
        to < 0 ||
        from >= state.scenes.length ||
        to >= state.scenes.length
      ) {
        return state
      }
      const next = [...state.scenes]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return touch({ ...state, scenes: reindexScenes(next) })
    }

    case 'LOCK_SCENE':
      return patchScene(state, action.id, { locked: action.locked })

    case 'SET_SELECTED_SCENE_ID':
      return touch({ ...state, selectedSceneId: action.id })

    case 'REPLACE_SCENE_CLIP':
      return patchScene(state, action.id, {
        clip: action.clip,
        ...(action.clipMatch !== undefined ? { clipMatch: action.clipMatch } : {}),
      })

    case 'UPDATE_SCENE_MOTION':
      return patchScene(state, action.id, { motion: action.motion })

    case 'UPDATE_SCENE_TRANSITION':
      return patchScene(state, action.id, { transition: action.transition })

    case 'UPDATE_CAPTION_TEXT':
      return touch({
        ...state,
        captions: state.captions.map((c) =>
          c.id === action.id ? { ...c, text: action.text } : c
        ),
      })

    case 'SET_RENDER_STATUS':
      return touch({ ...state, renderStatus: action.status })

    case 'SET_EXPORT_METADATA':
      return touch({ ...state, export: { ...state.export, ...action.export } })

    case 'UPDATE_PROJECT_TITLE':
      return touch({ ...state, projectTitle: action.title })

    case 'RESET':
      return touch(buildMockDraft())

    case 'HYDRATE_FROM_MOCK':
      return touch(buildMockDraft())

    default:
      return state
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Context
 * ────────────────────────────────────────────────────────────────────────── */

export interface CreateFlowContextValue {
  state: CreateFlowState
  /** The real Supabase project id when hydrated from one, else `null` (mock). */
  projectId: string | null
  // selectors
  getScene: (id: number | null | undefined) => Scene | undefined
  selectedScene: Scene | undefined
  // hydration
  hydrateDraft: (draft: CreateFlowState) => void
  // actions
  setAudioMetadata: (audio: Partial<AudioMetadata>) => void
  setLanguage: (language: string) => void
  setStoryStyle: (storyStyle: string) => void
  setVisualSource: (visualSource: VisualSource) => void
  setCaptionStyle: (captionStyle: string) => void
  setTranscript: (transcript: TranscriptLine[]) => void
  updateTranscriptLine: (id: number, text: string) => void
  setScenes: (scenes: Scene[]) => void
  updateScene: (id: number, patch: Partial<Scene>) => void
  addScene: (scene?: Partial<Scene>) => void
  deleteScene: (id: number) => void
  reorderScenes: (from: number, to: number) => void
  lockScene: (id: number) => void
  unlockScene: (id: number) => void
  setSelectedSceneId: (id: number | null) => void
  replaceSceneClip: (id: number, clip: string, clipMatch?: number) => void
  updateSceneMotion: (id: number, motion: string) => void
  updateSceneTransition: (id: number, transition: string) => void
  updateCaptionText: (id: number, text: string) => void
  setRenderStatus: (status: CreateFlowState['renderStatus']) => void
  setExportMetadata: (meta: Partial<ExportMetadata>) => void
  updateProjectTitle: (title: string) => void
  resetCreateFlow: () => void
  hydrateFromMockProject: () => void
}

const CreateFlowContext = createContext<CreateFlowContextValue | null>(null)

/* ──────────────────────────────────────────────────────────────────────────
 * Safe localStorage helpers (best-effort, SSR-safe)
 * ────────────────────────────────────────────────────────────────────────── */

function loadDraft(key: string): CreateFlowState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Minimal shape guard — if anything looks off, ignore the stored draft.
    if (!parsed || !Array.isArray(parsed.scenes)) return null
    return parsed as CreateFlowState
  } catch {
    return null
  }
}

function saveDraft(key: string, state: CreateFlowState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(state))
  } catch {
    /* storage full / disabled — ignore, app keeps working */
  }
}

function clearDraft(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** Read a persisted draft for a specific project id (used by the URL bridge). */
export function loadLocalDraftForProject(projectId: string): CreateFlowState | null {
  const draft = loadDraft(storageKeyFor(projectId))
  return draft && draft.currentProjectId === projectId ? draft : null
}

/* ──────────────────────────────────────────────────────────────────────────
 * Provider
 * ────────────────────────────────────────────────────────────────────────── */

export function CreateFlowProvider({
  children,
  initialDraft,
}: {
  children: ReactNode
  /** Optional server-provided draft. When present it seeds the initial state. */
  initialDraft?: CreateFlowState | null
}) {
  // Deterministic initial state on both server and client (avoids hydration
  // mismatch); the persisted draft is loaded after mount.
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => initialDraft ?? buildMockDraft()
  )

  // The real project id (only when hydrated from a Supabase project).
  const projectId = isRealProjectId(state.currentProjectId) ? state.currentProjectId : null

  // Load persisted draft once on mount (client only), scoped to the current
  // project's key so drafts never bleed across projects.
  useEffect(() => {
    const stored = loadDraft(storageKeyFor(state.currentProjectId))
    if (stored && stored.currentProjectId === state.currentProjectId) {
      dispatch({ type: 'HYDRATE', state: stored })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist on every change (best-effort), keyed by the current project.
  useEffect(() => {
    saveDraft(storageKeyFor(state.currentProjectId), state)
  }, [state])

  const value = useMemo<CreateFlowContextValue>(() => {
    const getScene = (id: number | null | undefined) =>
      id == null ? undefined : state.scenes.find((s) => s.id === id)

    // Fire-and-forget settings persistence (only for a real project).
    const realId = isRealProjectId(state.currentProjectId) ? state.currentProjectId : null
    const persistSettings = (input: Parameters<typeof updateProjectSettingsAction>[1]) => {
      if (realId) {
        void updateProjectSettingsAction(realId, input).catch(() => {
          /* best-effort; local state already updated */
        })
      }
    }

    return {
      state,
      projectId: realId,
      getScene,
      selectedScene: getScene(state.selectedSceneId),
      hydrateDraft: (draft) => dispatch({ type: 'HYDRATE', state: draft }),
      setAudioMetadata: (audio) => dispatch({ type: 'SET_AUDIO_METADATA', audio }),
      setLanguage: (language) => {
        dispatch({ type: 'SET_LANGUAGE', language })
        persistSettings({ language })
      },
      setStoryStyle: (storyStyle) => {
        dispatch({ type: 'SET_STORY_STYLE', storyStyle })
        persistSettings({ storyStyle })
      },
      setVisualSource: (visualSource) => {
        dispatch({ type: 'SET_VISUAL_SOURCE', visualSource })
        persistSettings({ visualSource })
      },
      setCaptionStyle: (captionStyle) => {
        dispatch({ type: 'SET_CAPTION_STYLE', captionStyle })
        persistSettings({ captionStyle })
      },
      setTranscript: (transcript) => dispatch({ type: 'SET_TRANSCRIPT', transcript }),
      updateTranscriptLine: (id, text) =>
        dispatch({ type: 'UPDATE_TRANSCRIPT_LINE', id, text }),
      setScenes: (scenes) => dispatch({ type: 'SET_SCENES', scenes }),
      updateScene: (id, patch) => dispatch({ type: 'UPDATE_SCENE', id, patch }),
      addScene: (scene) => dispatch({ type: 'ADD_SCENE', scene }),
      deleteScene: (id) => dispatch({ type: 'DELETE_SCENE', id }),
      reorderScenes: (from, to) => dispatch({ type: 'REORDER_SCENES', from, to }),
      lockScene: (id) => dispatch({ type: 'LOCK_SCENE', id, locked: true }),
      unlockScene: (id) => dispatch({ type: 'LOCK_SCENE', id, locked: false }),
      setSelectedSceneId: (id) => dispatch({ type: 'SET_SELECTED_SCENE_ID', id }),
      replaceSceneClip: (id, clip, clipMatch) =>
        dispatch({ type: 'REPLACE_SCENE_CLIP', id, clip, clipMatch }),
      updateSceneMotion: (id, motion) =>
        dispatch({ type: 'UPDATE_SCENE_MOTION', id, motion }),
      updateSceneTransition: (id, transition) =>
        dispatch({ type: 'UPDATE_SCENE_TRANSITION', id, transition }),
      updateCaptionText: (id, text) =>
        dispatch({ type: 'UPDATE_CAPTION_TEXT', id, text }),
      setRenderStatus: (status) => dispatch({ type: 'SET_RENDER_STATUS', status }),
      setExportMetadata: (meta) =>
        dispatch({ type: 'SET_EXPORT_METADATA', export: meta }),
      updateProjectTitle: (title) =>
        dispatch({ type: 'UPDATE_PROJECT_TITLE', title }),
      resetCreateFlow: () => {
        clearDraft(storageKeyFor(state.currentProjectId))
        dispatch({ type: 'RESET' })
      },
      hydrateFromMockProject: () => dispatch({ type: 'HYDRATE_FROM_MOCK' }),
    }
  }, [state])

  return (
    <CreateFlowContext.Provider value={value}>
      {children}
    </CreateFlowContext.Provider>
  )
}

/**
 * Access the create-flow draft. Must be used within a `<CreateFlowProvider>`
 * (i.e. inside the `/app/create/*` routes).
 */
export function useCreateFlow(): CreateFlowContextValue {
  const ctx = useContext(CreateFlowContext)
  if (!ctx) {
    throw new Error('useCreateFlow must be used within a CreateFlowProvider')
  }
  return ctx
}
