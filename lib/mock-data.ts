/**
 * VoxReel — mock data
 *
 * Placeholder content used to build and demo the UI while the app is
 * frontend-only. This data is NOT fetched from any backend yet. Keep the tone
 * dark, premium, cinematic, and globally oriented (US/global English).
 *
 * Consistency rules (enforced by hand for now):
 *  - A project's `scenes` count matches the length of its storyboard.
 *  - The featured "Midnight Betrayal" storyboard below has 8 scenes and a
 *    runtime of 1:18, which the storyboard/preview screens reference.
 *  - Durations target the 60–90s sweet spot for short-form vertical reels.
 */

import type {
  Project,
  Scene,
  Style,
  TranscriptLine,
  MotionPreset,
  TransitionPreset,
  Caption,
} from './types'
import { getEmotionColor } from './emotions'

export const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Midnight Betrayal',
    duration: '1:18',
    scenes: 8,
    status: 'complete',
    thumbnail: null,
    createdAt: '2 hours ago',
    platform: 'tiktok',
    views: '142K',
  },
  {
    id: '2',
    title: 'The Last Call',
    duration: '1:04',
    scenes: 6,
    status: 'rendering',
    thumbnail: null,
    createdAt: '5 hours ago',
    platform: 'instagram',
    views: null,
  },
  {
    id: '3',
    title: 'Coastal Reckoning',
    duration: '1:24',
    scenes: 9,
    status: 'draft',
    thumbnail: null,
    createdAt: 'Yesterday',
    platform: 'youtube',
    views: null,
  },
  {
    id: '4',
    title: 'Red Room',
    duration: '1:02',
    scenes: 5,
    status: 'complete',
    thumbnail: null,
    createdAt: '3 days ago',
    platform: 'tiktok',
    views: '89K',
  },
]

/**
 * Featured storyboard for "Midnight Betrayal" — 8 scenes, 1:18 total.
 * `total` on every scene equals `mockScenes.length`.
 */
export const mockScenes: Scene[] = [
  {
    id: 1,
    index: 1,
    total: 8,
    timeStart: '0:00',
    timeEnd: '0:09',
    emotion: 'Dread',
    emotionColor: getEmotionColor('Dread'),
    intensity: 91,
    text: 'The message came at 3am. She already knew before she opened it.',
    visualIntent: 'Dark bedroom, phone screen glow, shadows crawling the wall.',
    clip: 'Abandoned hotel corridor, flickering light',
    clipMatch: 95,
    motion: 'Slow Push-In',
    transition: 'Cross Dissolve',
  },
  {
    id: 2,
    index: 2,
    total: 8,
    timeStart: '0:09',
    timeEnd: '0:18',
    emotion: 'Shock',
    emotionColor: getEmotionColor('Shock'),
    intensity: 88,
    text: 'Three words. That was all it took to end seven years.',
    visualIntent: 'Extreme close-up: shaking hands, cracked phone screen.',
    clip: 'Hands dropping coffee mug, slow motion',
    clipMatch: 87,
    motion: 'Zoom Out Fast',
    transition: 'Hard Cut',
  },
  {
    id: 3,
    index: 3,
    total: 8,
    timeStart: '0:18',
    timeEnd: '0:27',
    emotion: 'Numbness',
    emotionColor: getEmotionColor('Numbness'),
    intensity: 64,
    text: 'She sat on the bathroom floor until the tile went cold.',
    visualIntent: 'Empty hallway, dim bathroom light, rain on window.',
    clip: 'Rain-streaked window, interior shot',
    clipMatch: 91,
    motion: 'Static Hold',
    transition: 'Fade to Black',
  },
  {
    id: 4,
    index: 4,
    total: 8,
    timeStart: '0:27',
    timeEnd: '0:38',
    emotion: 'Betrayal',
    emotionColor: getEmotionColor('Betrayal'),
    intensity: 82,
    text: "She found the phone he swore didn't exist.",
    visualIntent: 'Dark car interior, phone glow, night tension.',
    clip: 'Car interior, dashboard light, night driving',
    clipMatch: 92,
    motion: 'Slow Push-In',
    transition: 'Hard Cut',
  },
  {
    id: 5,
    index: 5,
    total: 8,
    timeStart: '0:38',
    timeEnd: '0:47',
    emotion: 'Rage',
    emotionColor: getEmotionColor('Rage'),
    intensity: 97,
    text: 'Every lie. Every alibi. Every tender moment. Staged.',
    visualIntent: 'Handheld chaos, red tint, shattered glass.',
    clip: 'Broken mirror close-up, red filter',
    clipMatch: 89,
    motion: 'Shake + Zoom',
    transition: 'Glitch Cut',
  },
  {
    id: 6,
    index: 6,
    total: 8,
    timeStart: '0:47',
    timeEnd: '0:56',
    emotion: 'Grief',
    emotionColor: getEmotionColor('Grief'),
    intensity: 70,
    text: 'For one breath, she mourned the life she thought they had.',
    visualIntent: 'Rain on glass, blurred city lights, single tear.',
    clip: 'Slow rain on a dark window, neon bokeh',
    clipMatch: 90,
    motion: 'Gentle Drift',
    transition: 'Cross Dissolve',
  },
  {
    id: 7,
    index: 7,
    total: 8,
    timeStart: '0:56',
    timeEnd: '1:07',
    emotion: 'Resolve',
    emotionColor: getEmotionColor('Resolve'),
    intensity: 76,
    text: 'She packed one bag. She never looked back.',
    visualIntent: 'Silhouette in doorway, golden hour, freedom.',
    clip: 'Woman silhouette against sunset, wide shot',
    clipMatch: 94,
    motion: 'Pull Back Wide',
    transition: 'Match Cut',
  },
  {
    id: 8,
    index: 8,
    total: 8,
    timeStart: '1:07',
    timeEnd: '1:18',
    emotion: 'Liberation',
    emotionColor: getEmotionColor('Liberation'),
    intensity: 83,
    text: 'The city opened up ahead of her. So did everything after.',
    visualIntent: 'Open highway at dawn, headlights, endless horizon.',
    clip: 'Empty highway at sunrise, aerial drift',
    clipMatch: 93,
    motion: 'Pull Back Wide',
    transition: 'Fade Out',
  },
]

export const mockStyles: Style[] = [
  { id: 'noir', name: 'Noir Cinéma', desc: 'High contrast shadows, cold blue tones, slow burns', tag: 'Drama' },
  { id: 'golden', name: 'Golden Hour', desc: 'Warm cinematic tones, lens flares, emotional depth', tag: 'Romance' },
  { id: 'rage', name: 'Red Rage', desc: 'Saturated reds, handheld chaos, aggressive cuts', tag: 'Thriller' },
  { id: 'ghost', name: 'Ghost Signal', desc: 'Glitch artifacts, digital noise, surveillance feel', tag: 'Horror' },
  { id: 'drift', name: 'Coastal Drift', desc: 'Desaturated blues, ocean ambience, melancholy pace', tag: 'Drama' },
  { id: 'neon', name: 'Neon Void', desc: 'Cyberpunk palette, violet and magenta, rain-slicked streets', tag: 'Sci-Fi' },
]

export const mockTranscript: TranscriptLine[] = [
  { id: 1, start: '0:00', text: 'The message came at 3am.' },
  { id: 2, start: '0:04', text: 'She already knew before she opened it.' },
  { id: 3, start: '0:09', text: 'Three words.' },
  { id: 4, start: '0:12', text: 'That was all it took to end seven years.' },
  { id: 5, start: '0:18', text: 'She sat on the bathroom floor until the tile went cold.' },
  { id: 6, start: '0:27', text: "She found the phone he swore didn't exist." },
  { id: 7, start: '0:38', text: 'Every lie. Every alibi. Every tender moment. Staged.' },
  { id: 8, start: '0:47', text: 'For one breath, she mourned the life she thought they had.' },
  { id: 9, start: '0:56', text: 'She packed one bag. She never looked back.' },
  { id: 10, start: '1:07', text: 'The city opened up ahead of her. So did everything after.' },
]

export const mockMotionPresets: MotionPreset[] = [
  { id: 'push', name: 'Slow Push-In', icon: '→', desc: 'Creeping forward momentum' },
  { id: 'pullback', name: 'Pull Back Wide', icon: '←', desc: 'Reveal the full scene' },
  { id: 'zoomfast', name: 'Zoom Out Fast', icon: '⊞', desc: 'Sudden impact reveal' },
  { id: 'shake', name: 'Shake + Zoom', icon: '⚡', desc: 'Handheld chaos energy' },
  { id: 'static', name: 'Static Hold', icon: '⊡', desc: 'Cold, unblinking tension' },
  { id: 'drift', name: 'Gentle Drift', icon: '~', desc: 'Melancholy float' },
]

export const mockTransitionPresets: TransitionPreset[] = [
  { id: 'cut', name: 'Hard Cut', desc: 'Abrupt, aggressive' },
  { id: 'dissolve', name: 'Cross Dissolve', desc: 'Soft emotional blend' },
  { id: 'fade', name: 'Fade to Black', desc: 'Heavy ending weight' },
  { id: 'glitch', name: 'Glitch Cut', desc: 'Digital disorientation' },
  { id: 'whip', name: 'Whip Pan', desc: 'Kinetic energy shift' },
  { id: 'match', name: 'Match Cut', desc: 'Thematic visual bridge' },
]

export const mockCaptions: Caption[] = [
  { id: 1, text: 'The message came at 3am.', start: '0:00', style: 'bold-center' },
  { id: 2, text: 'She already knew.', start: '0:04', style: 'italic-bottom' },
  { id: 3, text: 'THREE WORDS.', start: '0:09', style: 'impact-top' },
  { id: 4, text: 'Seven years. Gone.', start: '0:12', style: 'bold-center' },
]
