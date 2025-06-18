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
      admin_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          profile_picture: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          profile_picture?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          profile_picture?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_cache: {
        Row: {
          date_range: string | null
          expires_at: string | null
          id: string
          last_updated: string | null
          metric_data: Json
          metric_name: string
        }
        Insert: {
          date_range?: string | null
          expires_at?: string | null
          id?: string
          last_updated?: string | null
          metric_data: Json
          metric_name: string
        }
        Update: {
          date_range?: string | null
          expires_at?: string | null
          id?: string
          last_updated?: string | null
          metric_data?: Json
          metric_name?: string
        }
        Relationships: []
      }
      approval_logs: {
        Row: {
          action: string
          approved_by: string | null
          approved_user_id: string | null
          created_at: string | null
          id: string
          reason: string | null
          user_type: string
        }
        Insert: {
          action: string
          approved_by?: string | null
          approved_user_id?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          user_type: string
        }
        Update: {
          action?: string
          approved_by?: string | null
          approved_user_id?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          user_type?: string
        }
        Relationships: []
      }
      exam_results: {
        Row: {
          exam_id: string | null
          id: string
          marks_obtained: number
          percentage: number | null
          student_id: string | null
          submitted_at: string | null
        }
        Insert: {
          exam_id?: string | null
          id?: string
          marks_obtained: number
          percentage?: number | null
          student_id?: string | null
          submitted_at?: string | null
        }
        Update: {
          exam_id?: string | null
          id?: string
          marks_obtained?: number
          percentage?: number | null
          student_id?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          class_level: number
          created_at: string | null
          created_by: string | null
          exam_type: Database["public"]["Enums"]["exam_type"]
          id: string
          max_marks: number
          subject_id: string | null
          title: string
          topic_id: string | null
          updated_at: string | null
        }
        Insert: {
          class_level: number
          created_at?: string | null
          created_by?: string | null
          exam_type: Database["public"]["Enums"]["exam_type"]
          id?: string
          max_marks?: number
          subject_id?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string | null
        }
        Update: {
          class_level?: number
          created_at?: string | null
          created_by?: string | null
          exam_type?: Database["public"]["Enums"]["exam_type"]
          id?: string
          max_marks?: number
          subject_id?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_payments: {
        Row: {
          amount_paid: number
          created_at: string | null
          fee_structure_id: string | null
          id: string
          payment_date: string | null
          payment_method: string | null
          payment_status: string | null
          receipt_url: string | null
          student_id: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          fee_structure_id?: string | null
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          receipt_url?: string | null
          student_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          fee_structure_id?: string | null
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          receipt_url?: string | null
          student_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          amount: number
          class_name: string
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string
          id: string
          semester: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          class_name: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date: string
          id?: string
          semester: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          class_name?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: string
          semester?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      parent_students: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          parent_id: string | null
          relationship: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          parent_id?: string | null
          relationship?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          parent_id?: string | null
          relationship?: string | null
          student_id?: string | null
        }
        Relationships: []
      }
      performance_predictions: {
        Row: {
          actual_grade: number | null
          confidence_score: number | null
          created_at: string | null
          id: string
          predicted_grade: number | null
          prediction_date: string | null
          risk_level: string | null
          student_id: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          actual_grade?: number | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          predicted_grade?: number | null
          prediction_date?: string | null
          risk_level?: string | null
          student_id?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          actual_grade?: number | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          predicted_grade?: number | null
          prediction_date?: string | null
          risk_level?: string | null
          student_id?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      push_notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          message: string
          read_status: boolean | null
          sent_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          message: string
          read_status?: boolean | null
          sent_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          message?: string
          read_status?: boolean | null
          sent_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          action: string
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      student_insights: {
        Row: {
          ai_recommendations: string | null
          focus_topics: string[] | null
          id: string
          last_analyzed: string | null
          performance_trend: string | null
          strength_level: number | null
          strong_areas: string[] | null
          student_id: string | null
          subject_id: string | null
          weak_areas: string[] | null
        }
        Insert: {
          ai_recommendations?: string | null
          focus_topics?: string[] | null
          id?: string
          last_analyzed?: string | null
          performance_trend?: string | null
          strength_level?: number | null
          strong_areas?: string[] | null
          student_id?: string | null
          subject_id?: string | null
          weak_areas?: string[] | null
        }
        Update: {
          ai_recommendations?: string | null
          focus_topics?: string[] | null
          id?: string
          last_analyzed?: string | null
          performance_trend?: string | null
          strength_level?: number | null
          strong_areas?: string[] | null
          student_id?: string | null
          subject_id?: string | null
          weak_areas?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "student_insights_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_insights_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          class_level: number | null
          created_at: string | null
          email: string
          full_name: string
          guardian_mobile: string | null
          guardian_name: string | null
          id: string
          profile_picture: string | null
          status: Database["public"]["Enums"]["approval_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          class_level?: number | null
          created_at?: string | null
          email: string
          full_name: string
          guardian_mobile?: string | null
          guardian_name?: string | null
          id?: string
          profile_picture?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          class_level?: number | null
          created_at?: string | null
          email?: string
          full_name?: string
          guardian_mobile?: string | null
          guardian_name?: string | null
          id?: string
          profile_picture?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          class_level: number
          created_at: string | null
          id: string
          name: Database["public"]["Enums"]["subject_type"]
          updated_at: string | null
        }
        Insert: {
          class_level: number
          created_at?: string | null
          id?: string
          name: Database["public"]["Enums"]["subject_type"]
          updated_at?: string | null
        }
        Update: {
          class_level?: number
          created_at?: string | null
          id?: string
          name?: Database["public"]["Enums"]["subject_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      teacher_profiles: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          created_at: string | null
          email: string
          experience_years: number | null
          full_name: string
          id: string
          profile_picture: string | null
          status: Database["public"]["Enums"]["approval_status"] | null
          subject_expertise: Database["public"]["Enums"]["subject_type"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string | null
          email: string
          experience_years?: number | null
          full_name: string
          id?: string
          profile_picture?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          subject_expertise: Database["public"]["Enums"]["subject_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string | null
          email?: string
          experience_years?: number | null
          full_name?: string
          id?: string
          profile_picture?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          subject_expertise?: Database["public"]["Enums"]["subject_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      topics: {
        Row: {
          chapter_number: number | null
          created_at: string | null
          id: string
          name: string
          subject_id: string | null
          updated_at: string | null
        }
        Insert: {
          chapter_number?: number | null
          created_at?: string | null
          id?: string
          name: string
          subject_id?: string | null
          updated_at?: string | null
        }
        Update: {
          chapter_number?: number | null
          created_at?: string | null
          id?: string
          name?: string
          subject_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      approval_status: "PENDING" | "APPROVED" | "REJECTED"
      exam_type: "JEE" | "NEET" | "CET" | "Boards"
      subject_type:
        | "Physics"
        | "Chemistry"
        | "Mathematics"
        | "Biology"
        | "English"
        | "Other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      approval_status: ["PENDING", "APPROVED", "REJECTED"],
      exam_type: ["JEE", "NEET", "CET", "Boards"],
      subject_type: [
        "Physics",
        "Chemistry",
        "Mathematics",
        "Biology",
        "English",
        "Other",
      ],
    },
  },
} as const
