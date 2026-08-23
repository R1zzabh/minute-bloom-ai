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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
