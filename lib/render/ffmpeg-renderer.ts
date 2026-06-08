import 'server-only'

/**
 * VoxReel — FFmpeg renderer (SERVER-ONLY)
 *
 * Composes a 1080×1920 MP4 from already-downloaded local assets using FFmpeg via
 * `child_process` (no browser imports, no secrets). Each scene is encoded to an
 * identical-codec segment, segments are concatenated, then the original audio is
 * muxed in. Text overlays are best-effort (only when a usable font is found).
 *
 * FFmpeg binary resolution (first hit wins):
 *   1. `process.env.FFMPEG_PATH`
 *   2. the optional `ffmpeg-static` package, if installed
 *   3. `ffmpeg` on the system PATH
 *
 * So the project builds without bundling a large binary; the operator just needs
 * FFmpeg available at runtime (see docs/14). Errors are clean, never fatal to the
 * app.
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { copyFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const FFMPEG_TIMEOUT_MS = 5 * 60 * 1000

/** Per-scene render spec with a LOCAL clip path (already downloaded). */
export interface RenderSceneSpec {
  index: number
  durationSeconds: number
  text: string
  /** Hex color (e.g. `#D64545`) used as a fallback background. */
  emotionColor: string
  localClipPath: string | null
}

export interface RenderToFileInput {
  workDir: string
  outputPath: string
  width: number
  height: number
  fps: number
  scenes: RenderSceneSpec[]
  audioLocalPath: string | null
}

/** Resolve a runnable ffmpeg binary path. */
export function resolveFfmpegBinary(): string {
  const envPath = process.env.FFMPEG_PATH?.trim()
  if (envPath && existsSync(envPath)) return envPath

  try {
    const req = createRequire(import.meta.url)
    // Indirect specifier so bundlers don't try to resolve this OPTIONAL package
    // at build time (it may not be installed).
    const moduleName = ['ffmpeg', 'static'].join('-')
    const staticPath = req(moduleName) as unknown
    if (typeof staticPath === 'string' && staticPath && existsSync(staticPath)) {
      return staticPath
    }
  } catch {
    /* ffmpeg-static not installed — fall through to PATH */
  }
  return 'ffmpeg'
}

/** Find a usable TTF font for drawtext overlays, or null to skip text. */
function findFontFile(): string | null {
  const candidates = [
    process.env.RENDER_FONT_PATH,
    'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/segoeui.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/Library/Fonts/Arial.ttf',
  ].filter(Boolean) as string[]
  return candidates.find((p) => existsSync(p)) ?? null
}

/** Keep only characters that are safe inside an ffmpeg drawtext value. */
function sanitizeOverlay(text: string): string {
  return text
    .replace(/[\r\n]+/g, ' ')
    .replace(/[^A-Za-z0-9 .!?-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48)
}

/** Escape a font path for use inside a filtergraph (colons + backslashes). */
function escapeFontPath(p: string): string {
  return p.replace(/\\/g, '/').replace(/:/g, '\\:')
}

function buildDrawText(text: string, fontFile: string | null, height: number): string | null {
  if (!fontFile) return null
  const safe = sanitizeOverlay(text)
  if (!safe) return null
  const font = escapeFontPath(fontFile)
  return [
    `drawtext=fontfile='${font}'`,
    `text='${safe}'`,
    'fontcolor=white',
    'fontsize=52',
    'box=1',
    'boxcolor=black@0.5',
    'boxborderw=24',
    'x=(w-text_w)/2',
    `y=${Math.round(height * 0.78)}`,
  ].join(':')
}

function runFfmpeg(bin: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { windowsHide: true })
    let stderr = ''
    proc.stderr.on('data', (d) => {
      stderr += d.toString()
      if (stderr.length > 20_000) stderr = stderr.slice(-20_000)
    })
    const timer = setTimeout(() => {
      proc.kill('SIGKILL')
      reject(new Error('Render timed out.'))
    }, FFMPEG_TIMEOUT_MS)
    proc.on('error', (err) => {
      clearTimeout(timer)
      reject(
        new Error(
          `Could not start FFmpeg (${err.message}). Install FFmpeg or set FFMPEG_PATH.`
        )
      )
    })
    proc.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) resolve()
      else reject(new Error(`FFmpeg failed (exit ${code}). ${stderr.slice(-400)}`))
    })
  })
}

/** Render the timeline to `outputPath`. Throws a clean Error on failure. */
export async function renderTimelineToFile(input: RenderToFileInput): Promise<void> {
  const { workDir, outputPath, width, height, fps, scenes, audioLocalPath } = input
  const bin = resolveFfmpegBinary()
  const fontFile = findFontFile()

  if (scenes.length === 0) throw new Error('Nothing to render: no scenes.')

  // 1) Encode each scene to an identical-codec segment.
  const segmentPaths: string[] = []
  for (const scene of scenes) {
    const segPath = path.join(workDir, `seg_${scene.index}.mp4`)
    const dur = Math.max(1, scene.durationSeconds).toFixed(2)
    const drawText = buildDrawText(scene.text, fontFile, height)

    let args: string[]
    if (scene.localClipPath) {
      const vf = [
        `scale=${width}:${height}:force_original_aspect_ratio=increase`,
        `crop=${width}:${height}`,
        'setsar=1',
        ...(drawText ? [drawText] : []),
      ].join(',')
      args = [
        '-y',
        '-stream_loop', '-1',
        '-i', scene.localClipPath,
        '-t', dur,
        '-vf', vf,
        '-an',
        '-r', String(fps),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'veryfast',
        segPath,
      ]
    } else {
      const hex = (scene.emotionColor || '#111318').replace('#', '')
      args = [
        '-y',
        '-f', 'lavfi',
        '-i', `color=c=0x${hex}:s=${width}x${height}:d=${dur}:r=${fps}`,
        ...(drawText ? ['-vf', drawText] : []),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'veryfast',
        segPath,
      ]
    }
    await runFfmpeg(bin, args)
    segmentPaths.push(segPath)
  }

  // 2) Concatenate segments (identical codecs → stream copy).
  const listPath = path.join(workDir, 'concat.txt')
  const listBody = segmentPaths
    .map((p) => `file '${p.replace(/\\/g, '/')}'`)
    .join('\n')
  await writeFile(listPath, listBody, 'utf8')

  const concatPath = path.join(workDir, 'concat.mp4')
  await runFfmpeg(bin, [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', listPath,
    '-c', 'copy',
    concatPath,
  ])

  // 3) Mux original audio if available; else the concat IS the output.
  if (audioLocalPath) {
    await runFfmpeg(bin, [
      '-y',
      '-i', concatPath,
      '-i', audioLocalPath,
      '-map', '0:v:0',
      '-map', '1:a:0',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      outputPath,
    ])
  } else {
    await copyFile(concatPath, outputPath)
  }
}
