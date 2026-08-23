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
      meetings: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          language: string
          original_file_name: string
          storage_path: string
          mime_type: string
          size_bytes: number
          duration_seconds: number | null
          status:
            | "uploading"
            | "uploaded"
            | "transcribing"
            | "summarizing"
            | "completed"
            | "failed"
          progress: number
          transcript_text: string | null
          transcript_segments: Json
          summary: Json | null
          processing_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          language?: string
          original_file_name: string
          storage_path: string
          mime_type: string
          size_bytes: number
          duration_seconds?: number | null
          status:
            | "uploading"
            | "uploaded"
            | "transcribing"
            | "summarizing"
            | "completed"
            | "failed"
          progress?: number
          transcript_text?: string | null
          transcript_segments?: Json
          summary?: Json | null
          processing_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          language?: string
          original_file_name?: string
          storage_path?: string
          mime_type?: string
          size_bytes?: number
          duration_seconds?: number | null
          status?:
            | "uploading"
            | "uploaded"
            | "transcribing"
            | "summarizing"
            | "completed"
            | "failed"
          progress?: number
          transcript_text?: string | null
          transcript_segments?: Json
          summary?: Json | null
          processing_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      action_items: {
        Row: {
          id: string
          meeting_id: string
          user_id: string
          task: string
          owner: string | null
          due_date: string | null
          priority: "low" | "medium" | "high"
          status: "open" | "in_progress" | "done"
          source_timestamp_seconds: number | null
          is_inferred: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          user_id: string
          task: string
          owner?: string | null
          due_date?: string | null
          priority: "low" | "medium" | "high"
          status: "open" | "in_progress" | "done"
          source_timestamp_seconds?: number | null
          is_inferred?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          user_id?: string
          task?: string
          owner?: string | null
          due_date?: string | null
          priority?: "low" | "medium" | "high"
          status?: "open" | "in_progress" | "done"
          source_timestamp_seconds?: number | null
          is_inferred?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      meeting_processing_jobs: {
        Row: {
          id: string
          meeting_id: string
          user_id: string
          status: "queued" | "processing" | "completed" | "failed"
          attempt_count: number
          max_attempts: number
          available_at: string
          lease_expires_at: string | null
          locked_by: string | null
          last_error: string | null
          requested_at: string
          started_at: string | null
          finished_at: string | null
          last_heartbeat_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          user_id: string
          status: "queued" | "processing" | "completed" | "failed"
          attempt_count?: number
          max_attempts?: number
          available_at?: string
          lease_expires_at?: string | null
          locked_by?: string | null
          last_error?: string | null
          requested_at?: string
          started_at?: string | null
          finished_at?: string | null
          last_heartbeat_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          user_id?: string
          status?: "queued" | "processing" | "completed" | "failed"
          attempt_count?: number
          max_attempts?: number
          available_at?: string
          lease_expires_at?: string | null
          locked_by?: string | null
          last_error?: string | null
          requested_at?: string
          started_at?: string | null
          finished_at?: string | null
          last_heartbeat_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      shared_rate_limits: {
        Row: {
          scope: string
          request_count: number
          window_started_at: string
          window_ends_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          scope: string
          request_count?: number
          window_started_at?: string
          window_ends_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          scope?: string
          request_count?: number
          window_started_at?: string
          window_ends_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      claim_meeting_processing_job: {
        Args: {
          p_worker_id: string
          p_lease_seconds?: number
        }
        Returns: {
          id: string
          meeting_id: string
          user_id: string
          attempt_count: number
          max_attempts: number
        }[]
      }
      consume_rate_limit_token: {
        Args: {
          p_scope: string
          p_max_requests: number
          p_window_seconds: number
          p_now?: string
        }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
