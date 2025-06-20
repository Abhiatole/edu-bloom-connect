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
      exam_results: {
        Row: {
          exam_id: string
          grade: string | null
          id: string
          marks_obtained: number
          remarks: string | null
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          exam_id: string
          grade?: string | null
          id?: string
          marks_obtained: number
          remarks?: string | null
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          exam_id?: string
          grade?: string | null
          id?: string
          marks_obtained?: number
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
          subject: Database["public"]["Enums"]["subject_type"]
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
          subject: Database["public"]["Enums"]["subject_type"]
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
          subject?: Database["public"]["Enums"]["subject_type"]
          title?: string
          total_marks?: number
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "fee_payments_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
        ]
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
          created_at: string | null
          id: string
          last_analyzed: string | null
          performance_level: Database["public"]["Enums"]["performance_level"]
          recommendations: string | null
          strengths: string[] | null
          student_id: string
          subject: Database["public"]["Enums"]["subject_type"]
          topic: string | null
          weaknesses: string[] | null
        }
        Insert: {
          ai_comment?: string | null
          created_at?: string | null
          id?: string
          last_analyzed?: string | null
          performance_level: Database["public"]["Enums"]["performance_level"]
          recommendations?: string | null
          strengths?: string[] | null
          student_id: string
          subject: Database["public"]["Enums"]["subject_type"]
          topic?: string | null
          weaknesses?: string[] | null
        }
        Update: {
          ai_comment?: string | null
          created_at?: string | null
          id?: string
          last_analyzed?: string | null
          performance_level?: Database["public"]["Enums"]["performance_level"]
          recommendations?: string | null
          strengths?: string[] | null
          student_id?: string
          subject?: Database["public"]["Enums"]["subject_type"]
          topic?: string | null
          weaknesses?: string[] | null        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          address: string | null
          approval_date: string | null
          approved_by: string | null
          class_level: number
          created_at: string | null
          date_of_birth: string | null
          enrollment_no: string
          id: string
          parent_email: string | null
          parent_phone: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          section: string | null
          status: Database["public"]["Enums"]["approval_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          approval_date?: string | null
          approved_by?: string | null
          class_level: number
          created_at?: string | null
          date_of_birth?: string | null
          enrollment_no: string
          id?: string
          parent_email?: string | null
          parent_phone?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          section?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          approval_date?: string | null
          approved_by?: string | null
          class_level?: number
          created_at?: string | null
          date_of_birth?: string | null
          enrollment_no?: string
          id?: string
          parent_email?: string | null
          parent_phone?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          section?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          updated_at?: string | null
          user_id?: string
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
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["approval_status"] | null
          subject_expertise: Database["public"]["Enums"]["subject_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string | null
          email: string
          experience_years?: number | null
          full_name: string
          id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          subject_expertise: Database["public"]["Enums"]["subject_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string | null
          email?: string
          experience_years?: number | null
          full_name?: string
          id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          subject_expertise?: Database["public"]["Enums"]["subject_type"]
          updated_at?: string | null
          user_id?: string
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
    }
    Functions: {
      [_ in never]: never
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
        | "Computer Science"
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
        "Computer Science",
        "Other",
      ],      user_role: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
    },
  },
} as const
