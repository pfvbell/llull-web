export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      concept_maps: {
        Row: {
          id: string
          title: string
          content: {
            description?: string
            nodes: any[]
            edges: any[]
            complexity: number
            versions: any[]
          }
          created_at: string
          updated_at: string
          user_id: string
          last_reviewed_at: string | null
          next_review_at: string | null
          review_count: number
        }
        Insert: {
          id?: string
          title: string
          content: {
            description?: string
            nodes: any[]
            edges: any[]
            complexity: number
            versions: any[]
          }
          created_at?: string
          updated_at?: string
          user_id?: string
          last_reviewed_at?: string | null
          next_review_at?: string | null
          review_count?: number
        }
        Update: {
          id?: string
          title?: string
          content?: {
            description?: string
            nodes?: any[]
            edges?: any[]
            complexity?: number
            versions?: any[]
          }
          created_at?: string
          updated_at?: string
          user_id?: string
          last_reviewed_at?: string | null
          next_review_at?: string | null
          review_count?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

console.log('Supabase types loaded') 