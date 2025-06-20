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
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      approval_logs: {
        Row: {
          action: string
          approved_by: string
          approved_by_name: string | null
          approved_user_id: string
          created_at: string | null
          id: string
          reason: string | null
          user_name: string | null
          user_type: string
        }
        Insert: {
          action: string
          approved_by: string
          approved_by_name?: string | null
          approved_user_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
          user_name?: string | null
          user_type: string
        }
        Update: {
          action?: string
          approved_by?: string
          approved_by_name?: string | null
          approved_user_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          user_name?: string | null
          user_type?: string
        }
        Relationships: []
      }
      exam_results: {
        Row: {
          exam_id: string
          grade: string | null
          id: string
          marks_obtained: number
          percentage: number | null
          remarks: string | null
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          exam_id: string
          grade?: string | null
          id?: string
          marks_obtained: number
          percentage?: number | null
          remarks?: string | null
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          exam_id?: string
          grade?: string | null
          id?: string
          marks_obtained?: number
          percentage?: number | null
          remarks?: string | null
          student_id?: string
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
        ]
      }
      exams: {
        Row: {
          class_level: number
          created_at: string | null
          created_by_teacher_id: string
          duration_minutes: number | null
          exam_date: string
          exam_type: Database["public"]["Enums"]["exam_type"]
          id: string
          max_marks: number | null
          subject: Database["public"]["Enums"]["subject_type"]
          subject_id: string | null
          title: string
          total_marks: number
          updated_at: string | null
        }
        Insert: {
          class_level: number
          created_at?: string | null
          created_by_teacher_id: string
          duration_minutes?: number | null
          exam_date: string
          exam_type: Database["public"]["Enums"]["exam_type"]
          id?: string
          max_marks?: number | null
          subject: Database["public"]["Enums"]["subject_type"]
          subject_id?: string | null
          title: string
          total_marks?: number
          updated_at?: string | null
        }
        Update: {
          class_level?: number
          created_at?: string | null
          created_by_teacher_id?: string
          duration_minutes?: number | null
          exam_date?: string
          exam_type?: Database["public"]["Enums"]["exam_type"]
          id?: string
          max_marks?: number | null
          subject?: Database["public"]["Enums"]["subject_type"]
          subject_id?: string | null
          title?: string
          total_marks?: number
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
        ]
      }
      fee_payments: {
        Row: {
          amount_paid: number
          created_at: string | null
          id: string
          payment_date: string | null
          payment_method: string | null
          receipt_number: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          structure_id: string
          student_id: string
          transaction_id: string | null
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          structure_id: string
          student_id: string
          transaction_id?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          structure_id?: string
          student_id?: string
          transaction_id?: string | null
        }
        Relationships: []
      }
      fee_structures: {
        Row: {
          academic_year: string
          amount: number
          class_level: number
          created_at: string | null
          description: string | null
          due_date: string
          fee_type: string
          id: string
          term: string
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          amount: number
          class_level: number
          created_at?: string | null
          description?: string | null
          due_date: string
          fee_type: string
          id?: string
          term: string
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          amount?: number
          class_level?: number
          created_at?: string | null
          description?: string | null
          due_date?: string
          fee_type?: string
          id?: string
          term?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      parent_links: {
        Row: {
          id: string
          is_primary: boolean | null
          linked_on: string | null
          parent_email: string
          parent_name: string | null
          relationship: string | null
          student_id: string
        }
        Insert: {
          id?: string
          is_primary?: boolean | null
          linked_on?: string | null
          parent_email: string
          parent_name?: string | null
          relationship?: string | null
          student_id: string
        }
        Update: {
          id?: string
          is_primary?: boolean | null
          linked_on?: string | null
          parent_email?: string
          parent_name?: string | null
          relationship?: string | null
          student_id?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          action: string
          created_at: string | null
          device_info: string | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          resource: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          device_info?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          resource?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          device_info?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          resource?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      student_insights: {
        Row: {
          ai_comment: string | null
          ai_recommendations: string | null
          created_at: string | null
          focus_topics: string[] | null
          id: string
          last_analyzed: string | null
          performance_level: Database["public"]["Enums"]["performance_level"]
          performance_trend: string | null
          recommendations: string | null
          strength_level: number | null
          strengths: string[] | null
          strong_areas: string[] | null
          student_id: string
          subject: Database["public"]["Enums"]["subject_type"]
          subject_id: string | null
          topic: string | null
          weak_areas: string[] | null
          weaknesses: string[] | null
        }
        Insert: {
          ai_comment?: string | null
          ai_recommendations?: string | null
          created_at?: string | null
          focus_topics?: string[] | null
          id?: string
          last_analyzed?: string | null
          performance_level: Database["public"]["Enums"]["performance_level"]
          performance_trend?: string | null
          recommendations?: string | null
          strength_level?: number | null
          strengths?: string[] | null
          strong_areas?: string[] | null
          student_id: string
          subject: Database["public"]["Enums"]["subject_type"]
          subject_id?: string | null
          topic?: string | null
          weak_areas?: string[] | null
          weaknesses?: string[] | null
        }
        Update: {
          ai_comment?: string | null
          ai_recommendations?: string | null
          created_at?: string | null
          focus_topics?: string[] | null
          id?: string
          last_analyzed?: string | null
          performance_level?: Database["public"]["Enums"]["performance_level"]
          performance_trend?: string | null
          recommendations?: string | null
          strength_level?: number | null
          strengths?: string[] | null
          strong_areas?: string[] | null
          student_id?: string
          subject?: Database["public"]["Enums"]["subject_type"]
          subject_id?: string | null
          topic?: string | null
          weak_areas?: string[] | null
          weaknesses?: string[] | null
        }
        Relationships: [
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
          status?: Database["public"]["Enums"]["approval_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
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
          status: Database["public"]["Enums"]["approval_status"] | null
          subject_expertise: Database["public"]["Enums"]["subject_type"] | null
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
          status?: Database["public"]["Enums"]["approval_status"] | null
          subject_expertise?: Database["public"]["Enums"]["subject_type"] | null
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
          status?: Database["public"]["Enums"]["approval_status"] | null
          subject_expertise?: Database["public"]["Enums"]["subject_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      timetables: {
        Row: {
          class_level: number
          created_at: string | null
          day_of_week: number | null
          end_time: string
          id: string
          room_number: string | null
          section: string | null
          start_time: string
          subject: Database["public"]["Enums"]["subject_type"]
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          class_level: number
          created_at?: string | null
          day_of_week?: number | null
          end_time: string
          id?: string
          room_number?: string | null
          section?: string | null
          start_time: string
          subject: Database["public"]["Enums"]["subject_type"]
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          class_level?: number
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string
          id?: string
          room_number?: string | null
          section?: string | null
          start_time?: string
          subject?: Database["public"]["Enums"]["subject_type"]
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          profile_picture: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["approval_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          profile_picture?: string | null
          role: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["approval_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          profile_picture?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["approval_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      all_users_view: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          class_level: number | null
          created_at: string | null
          id: string | null
          identifier: string | null
          role: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          user_type: string | null
        }
        Relationships: []
      }
      approval_history: {
        Row: {
          action: string | null
          approval_date: string | null
          approved_by_name: string | null
          approved_user_id: string | null
          id: string | null
          reason: string | null
          user_name: string | null
          user_type: string | null
        }
        Insert: {
          action?: string | null
          approval_date?: string | null
          approved_by_name?: string | null
          approved_user_id?: string | null
          id?: string | null
          reason?: string | null
          user_name?: string | null
          user_type?: string | null
        }
        Update: {
          action?: string | null
          approval_date?: string | null
          approved_by_name?: string | null
          approved_user_id?: string | null
          id?: string | null
          reason?: string | null
          user_name?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      approved_users: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          class_level: number | null
          created_at: string | null
          id: string | null
          identifier: string | null
          user_id: string | null
          user_type: string | null
        }
        Relationships: []
      }
      exam_results_with_percentage: {
        Row: {
          exam_id: string | null
          grade: string | null
          id: string | null
          marks_obtained: number | null
          percentage: number | null
          remarks: string | null
          student_id: string | null
          submitted_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_users: {
        Row: {
          class_level: number | null
          created_at: string | null
          id: string | null
          identifier: string | null
          user_id: string | null
          user_type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      handle_user_approval: {
        Args: {
          p_user_id: string
          p_user_type: string
          p_action: string
          p_approved_by: string
          p_reason?: string
        }
        Returns: Json
      }
    }
    Enums: {
      approval_status: "PENDING" | "APPROVED" | "REJECTED"
      exam_type:
        | "JEE"
        | "NEET"
        | "CET"
        | "Boards"
        | "Internal"
        | "Quarterly"
        | "Half Yearly"
        | "Annual"
      payment_status: "PENDING" | "PAID" | "OVERDUE" | "PARTIAL"
      performance_level:
        | "Excellent"
        | "Good"
        | "Average"
        | "Below Average"
        | "Poor"
      subject_type:
        | "Physics"
        | "Chemistry"
        | "Mathematics"
        | "Biology"
        | "English"
        | "Other"
      user_role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT"
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
      exam_type: [
        "JEE",
        "NEET",
        "CET",
        "Boards",
        "Internal",
        "Quarterly",
        "Half Yearly",
        "Annual",
      ],
      payment_status: ["PENDING", "PAID", "OVERDUE", "PARTIAL"],
      performance_level: [
        "Excellent",
        "Good",
        "Average",
        "Below Average",
        "Poor",
      ],
      subject_type: [
        "Physics",
        "Chemistry",
        "Mathematics",
        "Biology",
        "English",
        "Other",
      ],
      user_role: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
    },
  },
} as const
