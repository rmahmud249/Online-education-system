export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      board_questions: {
        Row: {
          board: string
          content: string | null
          created_at: string
          created_by: string | null
          file_path: string | null
          id: string
          question_type: Database["public"]["Enums"]["question_type"]
          solution: string | null
          subject_id: string
          title: string
          year: number
        }
        Insert: {
          board: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          id?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          solution?: string | null
          subject_id: string
          title: string
          year: number
        }
        Update: {
          board?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          id?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          solution?: string | null
          subject_id?: string
          title?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "board_questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          material_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          material_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          material_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "study_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          created_at: string
          id: string
          name_bn: string
          name_en: string | null
          number: number
          subject_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name_bn: string
          name_en?: string | null
          number?: number
          subject_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name_bn?: string
          name_en?: string | null
          number?: number
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          id: string
          level: Database["public"]["Enums"]["edu_level"]
          name_bn: string
          name_en: string
          position: number
        }
        Insert: {
          id?: string
          level: Database["public"]["Enums"]["edu_level"]
          name_bn: string
          name_en: string
          position?: number
        }
        Update: {
          id?: string
          level?: Database["public"]["Enums"]["edu_level"]
          name_bn?: string
          name_en?: string
          position?: number
        }
        Relationships: []
      }
      consultation_bookings: {
        Row: {
          created_at: string
          id: string
          slot_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          slot_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          slot_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: true
            referencedRelation: "consultation_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_slots: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          location: string
          starts_at: string
          subject_id: string
          teacher_id: string
          teacher_name: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          location: string
          starts_at: string
          subject_id: string
          teacher_id: string
          teacher_name: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          location?: string
          starts_at?: string
          subject_id?: string
          teacher_id?: string
          teacher_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_slots_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_slots_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          exam_id: string
          expires_at: string
          id: string
          started_at: string
          status: Database["public"]["Enums"]["attempt_status"]
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          exam_id: string
          expires_at: string
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          exam_id?: string
          expires_at?: string
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          exam_id: string
          marks: number
          position: number
          question_id: string
        }
        Insert: {
          exam_id: string
          marks?: number
          position?: number
          question_id: string
        }
        Update: {
          exam_id?: string
          marks?: number
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_reminder_deliveries: {
        Row: {
          exam_id: string
          starts_at: string
          user_id: string
        }
        Insert: {
          exam_id: string
          starts_at: string
          user_id: string
        }
        Update: {
          exam_id?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_reminder_deliveries_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_reminder_deliveries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_reminder_subjects: {
        Row: {
          subject_id: string
          user_id: string
        }
        Insert: {
          subject_id: string
          user_id: string
        }
        Update: {
          subject_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_reminder_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_reminder_subjects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          auto_publish_results: boolean
          chapter_id: string | null
          class_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number
          ends_at: string | null
          id: string
          is_published: boolean
          negative_marking: number
          scope: Database["public"]["Enums"]["exam_scope"]
          starts_at: string | null
          subject_id: string | null
          title: string
          total_marks: number
          type: Database["public"]["Enums"]["exam_type"]
        }
        Insert: {
          auto_publish_results?: boolean
          chapter_id?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          ends_at?: string | null
          id?: string
          is_published?: boolean
          negative_marking?: number
          scope?: Database["public"]["Enums"]["exam_scope"]
          starts_at?: string | null
          subject_id?: string | null
          title: string
          total_marks?: number
          type?: Database["public"]["Enums"]["exam_type"]
        }
        Update: {
          auto_publish_results?: boolean
          chapter_id?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          ends_at?: string | null
          id?: string
          is_published?: boolean
          negative_marking?: number
          scope?: Database["public"]["Enums"]["exam_scope"]
          starts_at?: string | null
          subject_id?: string | null
          title?: string
          total_marks?: number
          type?: Database["public"]["Enums"]["exam_type"]
        }
        Relationships: [
          {
            foreignKeyName: "exams_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          id: string
          name_bn: string
          name_en: string
          position: number
          slug: string
        }
        Insert: {
          id?: string
          name_bn: string
          name_en: string
          position?: number
          slug: string
        }
        Update: {
          id?: string
          name_bn?: string
          name_en?: string
          position?: number
          slug?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_plans: {
        Row: {
          attempt_ids: string[]
          created_at: string
          plan: string
          user_id: string
        }
        Insert: {
          attempt_ids: string[]
          created_at?: string
          plan: string
          user_id: string
        }
        Update: {
          attempt_ids?: string[]
          created_at?: string
          plan?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          group_id: string | null
          id: string
          institution: string | null
          level: Database["public"]["Enums"]["edu_level"] | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          group_id?: string | null
          id: string
          institution?: string | null
          level?: Database["public"]["Enums"]["edu_level"] | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          group_id?: string | null
          id?: string
          institution?: string | null
          level?: Database["public"]["Enums"]["edu_level"] | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      question_options: {
        Row: {
          id: string
          is_correct: boolean
          option_text: string
          position: number
          question_id: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          option_text: string
          position?: number
          question_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          option_text?: string
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          board: string | null
          body: string
          chapter_id: string | null
          created_at: string
          created_by: string | null
          explanation: string | null
          id: string
          marks: number
          subject_id: string
          type: Database["public"]["Enums"]["question_type"]
          year: number | null
        }
        Insert: {
          board?: string | null
          body: string
          chapter_id?: string | null
          created_at?: string
          created_by?: string | null
          explanation?: string | null
          id?: string
          marks?: number
          subject_id: string
          type?: Database["public"]["Enums"]["question_type"]
          year?: number | null
        }
        Update: {
          board?: string | null
          body?: string
          chapter_id?: string | null
          created_at?: string
          created_by?: string | null
          explanation?: string | null
          id?: string
          marks?: number
          subject_id?: string
          type?: Database["public"]["Enums"]["question_type"]
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      recent_views: {
        Row: {
          material_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          material_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          material_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recent_views_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "study_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recent_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          attempt_id: string
          cq_score: number
          created_at: string
          exam_id: string
          id: string
          is_published: boolean
          mcq_score: number
          published_at: string | null
          student_id: string
          total_marks: number
          total_score: number
        }
        Insert: {
          attempt_id: string
          cq_score?: number
          created_at?: string
          exam_id: string
          id?: string
          is_published?: boolean
          mcq_score?: number
          published_at?: string | null
          student_id: string
          total_marks?: number
          total_score?: number
        }
        Update: {
          attempt_id?: string
          cq_score?: number
          created_at?: string
          exam_id?: string
          id?: string
          is_published?: boolean
          mcq_score?: number
          published_at?: string | null
          student_id?: string
          total_marks?: number
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: true
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_explanations: {
        Row: {
          answer: string
          chapter_label: string | null
          created_at: string
          id: string
          question: string
          user_id: string
        }
        Insert: {
          answer: string
          chapter_label?: string | null
          created_at?: string
          id?: string
          question: string
          user_id: string
        }
        Update: {
          answer?: string
          chapter_label?: string | null
          created_at?: string
          id?: string
          question?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_explanations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      staff_permissions: {
        Row: {
          can_create_exams: boolean
          can_publish_results: boolean
          user_id: string
        }
        Insert: {
          can_create_exams?: boolean
          can_publish_results?: boolean
          user_id: string
        }
        Update: {
          can_create_exams?: boolean
          can_publish_results?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_answers: {
        Row: {
          answer_text: string | null
          attempt_id: string
          awarded_marks: number | null
          evaluated_by: string | null
          feedback: string | null
          id: string
          question_id: string
          selected_option_id: string | null
          updated_at: string
        }
        Insert: {
          answer_text?: string | null
          attempt_id: string
          awarded_marks?: number | null
          evaluated_by?: string | null
          feedback?: string | null
          id?: string
          question_id: string
          selected_option_id?: string | null
          updated_at?: string
        }
        Update: {
          answer_text?: string | null
          attempt_id?: string
          awarded_marks?: number | null
          evaluated_by?: string | null
          feedback?: string | null
          id?: string
          question_id?: string
          selected_option_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "question_options"
            referencedColumns: ["id"]
          },
        ]
      }
      student_practice_preferences: {
        Row: {
          reminders_enabled: boolean
          user_id: string
          weekly_goal: number
        }
        Insert: {
          reminders_enabled?: boolean
          user_id: string
          weekly_goal?: number
        }
        Update: {
          reminders_enabled?: boolean
          user_id?: string
          weekly_goal?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_practice_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_materials: {
        Row: {
          allow_download: boolean
          board: string | null
          chapter_id: string | null
          class_id: string | null
          content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          file_path: string | null
          group_id: string | null
          id: string
          is_published: boolean
          subject_id: string | null
          title: string
          type: Database["public"]["Enums"]["material_type"]
          views: number
          year: number | null
        }
        Insert: {
          allow_download?: boolean
          board?: string | null
          chapter_id?: string | null
          class_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string | null
          group_id?: string | null
          id?: string
          is_published?: boolean
          subject_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["material_type"]
          views?: number
          year?: number | null
        }
        Update: {
          allow_download?: boolean
          board?: string | null
          chapter_id?: string | null
          class_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string | null
          group_id?: string | null
          id?: string
          is_published?: boolean
          subject_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["material_type"]
          views?: number
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          class_id: string
          code: string | null
          created_at: string
          group_id: string | null
          id: string
          name_bn: string
          name_en: string
          position: number
        }
        Insert: {
          class_id: string
          code?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          name_bn: string
          name_en: string
          position?: number
        }
        Update: {
          class_id?: string
          code?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          name_bn?: string
          name_en?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_subjects: {
        Row: {
          subject_id: string
          teacher_id: string
        }
        Insert: {
          subject_id: string
          teacher_id: string
        }
        Update: {
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_exists: { Args: never; Returns: boolean }
      admin_stats: { Args: never; Returns: Json }
      can_grade_exam: {
        Args: { _exam_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_exam: {
        Args: { _exam_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_subject: {
        Args: { _subject_id: string; _user_id: string }
        Returns: boolean
      }
      cancel_consultation: { Args: { p_booking: string }; Returns: undefined }
      claim_first_admin: { Args: never; Returns: boolean }
      consultation_availability: {
        Args: never
        Returns: {
          reserved: boolean
          slot_id: string
        }[]
      }
      get_attempt: { Args: { p_attempt: string }; Returns: Json }
      get_attempt_review: { Args: { p_attempt: string }; Returns: Json }
      grade_answer: {
        Args: { p_answer: string; p_feedback: string; p_marks: number }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_material_view: {
        Args: { p_material: string }
        Returns: undefined
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      leaderboard: {
        Args: { p_exam?: string }
        Returns: {
          exams: number
          full_name: string
          student_id: string
          total: number
        }[]
      }
      practice_result_evidence: {
        Args: { p_attempts: string[] }
        Returns: Json
      }
      publish_exam_results: { Args: { p_exam: string }; Returns: number }
      recompute_result: { Args: { p_attempt: string }; Returns: undefined }
      reserve_consultation: { Args: { p_slot: string }; Returns: string }
      save_answer: {
        Args: {
          p_attempt: string
          p_option: string
          p_question: string
          p_text: string
        }
        Returns: undefined
      }
      send_exam_reminders: { Args: never; Returns: number }
      start_exam: { Args: { p_exam: string }; Returns: string }
      submit_attempt: { Args: { p_attempt: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
      attempt_status: "in_progress" | "submitted" | "evaluated"
      edu_level: "ssc" | "hsc"
      exam_scope: "chapter" | "subject" | "model_test" | "board"
      exam_type: "mcq" | "cq" | "combined"
      material_type:
        | "note"
        | "pdf"
        | "book"
        | "guide"
        | "test_paper"
        | "suggestion"
        | "solution"
      question_type: "mcq" | "cq"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "student"],
      attempt_status: ["in_progress", "submitted", "evaluated"],
      edu_level: ["ssc", "hsc"],
      exam_scope: ["chapter", "subject", "model_test", "board"],
      exam_type: ["mcq", "cq", "combined"],
      material_type: [
        "note",
        "pdf",
        "book",
        "guide",
        "test_paper",
        "suggestion",
        "solution",
      ],
      question_type: ["mcq", "cq"],
    },
  },
} as const
