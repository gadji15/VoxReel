/**
 * VoxReel — Supabase Database types
 *
 * Hand-written to match `supabase/migrations/001_initial_schema.sql`. This is a
 * practical starting point, not a perfect 1:1 of the DB. When the Supabase CLI
 * is linked you can regenerate this file with:
 *
 *   supabase gen types typescript --project-id <PROJECT_REF> > lib/supabase/database.types.ts
 *
 * Conventions:
 *  - uuid / timestamptz columns are typed as `string`.
 *  - jsonb columns use the `Json` type.
 *  - `Insert` makes columns optional when they have a DB default or are nullable.
 *  - `Update` makes every column optional.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          username: string | null
          avatar_url: string | null
          plan: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          username?: string | null
          avatar_url?: string | null
          plan?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          username?: string | null
          avatar_url?: string | null
          plan?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          status: string
          language: string
          story_style: string | null
          visual_source: string
          caption_style: string | null
          duration_seconds: number
          total_scenes: number
          thumbnail_path: string | null
          export_id: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          description?: string | null
          status?: string
          language?: string
          story_style?: string | null
          visual_source?: string
          caption_style?: string | null
          duration_seconds?: number
          total_scenes?: number
          thumbnail_path?: string | null
          export_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          status?: string
          language?: string
          story_style?: string | null
          visual_source?: string
          caption_style?: string | null
          duration_seconds?: number
          total_scenes?: number
          thumbnail_path?: string | null
          export_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audio_files: {
        Row: {
          id: string
          project_id: string
          user_id: string
          file_name: string | null
          storage_bucket: string
          storage_path: string | null
          mime_type: string | null
          size_bytes: number | null
          duration_seconds: number | null
          status: string
          waveform_data: Json | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          file_name?: string | null
          storage_bucket?: string
          storage_path?: string | null
          mime_type?: string | null
          size_bytes?: number | null
          duration_seconds?: number | null
          status?: string
          waveform_data?: Json | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          file_name?: string | null
          storage_bucket?: string
          storage_path?: string | null
          mime_type?: string | null
          size_bytes?: number | null
          duration_seconds?: number | null
          status?: string
          waveform_data?: Json | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      transcript_segments: {
        Row: {
          id: string
          project_id: string
          user_id: string
          segment_index: number
          start_time_seconds: number
          end_time_seconds: number
          text: string
          original_text: string | null
          confidence: number | null
          speaker: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          segment_index: number
          start_time_seconds?: number
          end_time_seconds?: number
          text?: string
          original_text?: string | null
          confidence?: number | null
          speaker?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          segment_index?: number
          start_time_seconds?: number
          end_time_seconds?: number
          text?: string
          original_text?: string | null
          confidence?: number | null
          speaker?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      scenes: {
        Row: {
          id: string
          project_id: string
          user_id: string
          scene_index: number
          start_time_seconds: number
          end_time_seconds: number
          title: string | null
          text: string
          emotion: string | null
          emotion_color: string | null
          intensity: number
          visual_intent: string | null
          search_query: string | null
          motion_preset: string | null
          transition_preset: string | null
          locked: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          scene_index: number
          start_time_seconds?: number
          end_time_seconds?: number
          title?: string | null
          text?: string
          emotion?: string | null
          emotion_color?: string | null
          intensity?: number
          visual_intent?: string | null
          search_query?: string | null
          motion_preset?: string | null
          transition_preset?: string | null
          locked?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          scene_index?: number
          start_time_seconds?: number
          end_time_seconds?: number
          title?: string | null
          text?: string
          emotion?: string | null
          emotion_color?: string | null
          intensity?: number
          visual_intent?: string | null
          search_query?: string | null
          motion_preset?: string | null
          transition_preset?: string | null
          locked?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      captions: {
        Row: {
          id: string
          project_id: string
          scene_id: string | null
          user_id: string
          caption_index: number
          start_time_seconds: number
          end_time_seconds: number
          text: string
          style: string | null
          position: string | null
          highlight_words: Json | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          scene_id?: string | null
          user_id: string
          caption_index: number
          start_time_seconds?: number
          end_time_seconds?: number
          text?: string
          style?: string | null
          position?: string | null
          highlight_words?: Json | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          scene_id?: string | null
          user_id?: string
          caption_index?: number
          start_time_seconds?: number
          end_time_seconds?: number
          text?: string
          style?: string | null
          position?: string | null
          highlight_words?: Json | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      clip_candidates: {
        Row: {
          id: string
          project_id: string
          scene_id: string
          user_id: string
          provider: string | null
          provider_clip_id: string | null
          title: string | null
          description: string | null
          thumbnail_url: string | null
          preview_url: string | null
          download_url: string | null
          duration_seconds: number | null
          width: number | null
          height: number | null
          orientation: string | null
          match_score: number | null
          reason: string | null
          license: string | null
          author_name: string | null
          author_url: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          scene_id: string
          user_id: string
          provider?: string | null
          provider_clip_id?: string | null
          title?: string | null
          description?: string | null
          thumbnail_url?: string | null
          preview_url?: string | null
          download_url?: string | null
          duration_seconds?: number | null
          width?: number | null
          height?: number | null
          orientation?: string | null
          match_score?: number | null
          reason?: string | null
          license?: string | null
          author_name?: string | null
          author_url?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          scene_id?: string
          user_id?: string
          provider?: string | null
          provider_clip_id?: string | null
          title?: string | null
          description?: string | null
          thumbnail_url?: string | null
          preview_url?: string | null
          download_url?: string | null
          duration_seconds?: number | null
          width?: number | null
          height?: number | null
          orientation?: string | null
          match_score?: number | null
          reason?: string | null
          license?: string | null
          author_name?: string | null
          author_url?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      selected_clips: {
        Row: {
          id: string
          project_id: string
          scene_id: string
          user_id: string
          clip_candidate_id: string | null
          provider: string | null
          source_url: string | null
          storage_bucket: string | null
          storage_path: string | null
          start_trim_seconds: number
          end_trim_seconds: number | null
          crop_mode: string | null
          motion_preset: string | null
          transition_preset: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          scene_id: string
          user_id: string
          clip_candidate_id?: string | null
          provider?: string | null
          source_url?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          start_trim_seconds?: number
          end_trim_seconds?: number | null
          crop_mode?: string | null
          motion_preset?: string | null
          transition_preset?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          scene_id?: string
          user_id?: string
          clip_candidate_id?: string | null
          provider?: string | null
          source_url?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          start_trim_seconds?: number
          end_trim_seconds?: number | null
          crop_mode?: string | null
          motion_preset?: string | null
          transition_preset?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      render_jobs: {
        Row: {
          id: string
          project_id: string
          user_id: string
          status: string
          progress: number
          current_step: string | null
          render_preset: string | null
          resolution_width: number
          resolution_height: number
          fps: number
          started_at: string | null
          completed_at: string | null
          failed_at: string | null
          error_message: string | null
          error_code: string | null
          metadata: Json
          created_at: string
          updated_at: string
          attempts: number
          max_attempts: number
          locked_at: string | null
          locked_by: string | null
          next_retry_at: string | null
          worker_started_at: string | null
          last_heartbeat_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          status?: string
          progress?: number
          current_step?: string | null
          render_preset?: string | null
          resolution_width?: number
          resolution_height?: number
          fps?: number
          started_at?: string | null
          completed_at?: string | null
          failed_at?: string | null
          error_message?: string | null
          error_code?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          attempts?: number
          max_attempts?: number
          locked_at?: string | null
          locked_by?: string | null
          next_retry_at?: string | null
          worker_started_at?: string | null
          last_heartbeat_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          status?: string
          progress?: number
          current_step?: string | null
          render_preset?: string | null
          resolution_width?: number
          resolution_height?: number
          fps?: number
          started_at?: string | null
          completed_at?: string | null
          failed_at?: string | null
          error_message?: string | null
          error_code?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          attempts?: number
          max_attempts?: number
          locked_at?: string | null
          locked_by?: string | null
          next_retry_at?: string | null
          worker_started_at?: string | null
          last_heartbeat_at?: string | null
        }
        Relationships: []
      }
      exports: {
        Row: {
          id: string
          project_id: string
          user_id: string
          render_job_id: string | null
          file_name: string | null
          storage_bucket: string
          storage_path: string | null
          format: string
          mime_type: string
          duration_seconds: number | null
          size_bytes: number | null
          resolution_width: number
          resolution_height: number
          fps: number
          download_count: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          render_job_id?: string | null
          file_name?: string | null
          storage_bucket?: string
          storage_path?: string | null
          format?: string
          mime_type?: string
          duration_seconds?: number | null
          size_bytes?: number | null
          resolution_width?: number
          resolution_height?: number
          fps?: number
          download_count?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          render_job_id?: string | null
          file_name?: string | null
          storage_bucket?: string
          storage_path?: string | null
          format?: string
          mime_type?: string
          duration_seconds?: number | null
          size_bytes?: number | null
          resolution_width?: number
          resolution_height?: number
          fps?: number
          download_count?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_events: {
        Row: {
          id: string
          project_id: string
          user_id: string
          event_type: string
          message: string | null
          payload: Json
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          event_type: string
          message?: string | null
          payload?: Json
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          event_type?: string
          message?: string | null
          payload?: Json
          created_at?: string
        }
        Relationships: []
      }
      job_events: {
        Row: {
          id: string
          job_id: string
          project_id: string
          user_id: string
          event_type: string
          step: string | null
          progress: number | null
          message: string | null
          payload: Json
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          project_id: string
          user_id: string
          event_type: string
          step?: string | null
          progress?: number | null
          message?: string | null
          payload?: Json
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          project_id?: string
          user_id?: string
          event_type?: string
          step?: string | null
          progress?: number | null
          message?: string | null
          payload?: Json
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      /** Atomically claim the oldest eligible queued render job (migration 002). */
      claim_next_render_job: {
        Args: { worker_id: string }
        Returns: {
          id: string
          project_id: string
          user_id: string
          status: string
          progress: number
          current_step: string | null
          render_preset: string | null
          resolution_width: number
          resolution_height: number
          fps: number
          started_at: string | null
          completed_at: string | null
          failed_at: string | null
          error_message: string | null
          error_code: string | null
          metadata: Json
          created_at: string
          updated_at: string
          attempts: number
          max_attempts: number
          locked_at: string | null
          locked_by: string | null
          next_retry_at: string | null
          worker_started_at: string | null
          last_heartbeat_at: string | null
        }[]
      }
      /** Requeue or fail stale `processing` jobs (migration 002). */
      requeue_stale_render_jobs: {
        Args: { stale_after_seconds: number }
        Returns: number
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
