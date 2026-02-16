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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      disbursements: {
        Row: {
          account: string | null
          agency: string | null
          agency_id: string | null
          amount: number
          bank_name: string | null
          created_at: string
          disbursed_date: string | null
          disbursement_type: string
          expected_date: string | null
          id: string
          notes: string | null
          proposal_id: string
          request_date: string
          requested_by: string | null
          status: Database["public"]["Enums"]["disbursement_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          account?: string | null
          agency?: string | null
          agency_id?: string | null
          amount: number
          bank_name?: string | null
          created_at?: string
          disbursed_date?: string | null
          disbursement_type?: string
          expected_date?: string | null
          id?: string
          notes?: string | null
          proposal_id: string
          request_date?: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["disbursement_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          account?: string | null
          agency?: string | null
          agency_id?: string | null
          amount?: number
          bank_name?: string | null
          created_at?: string
          disbursed_date?: string | null
          disbursement_type?: string
          expected_date?: string | null
          id?: string
          notes?: string | null
          proposal_id?: string
          request_date?: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["disbursement_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disbursements_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disbursements_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      document_tasks: {
        Row: {
          agency_id: string | null
          assigned_to: string | null
          created_at: string | null
          description: string | null
          document_name: string | null
          due_date: string | null
          id: string
          priority: string | null
          proposal_id: string | null
          status: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          agency_id?: string | null
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          document_name?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          proposal_id?: string | null
          status?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          agency_id?: string | null
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          document_name?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          proposal_id?: string | null
          status?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_tasks_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_tasks_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agency_id: string | null
          avatar_url: string | null
          color: string | null
          cpf: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agency_id?: string | null
          avatar_url?: string | null
          color?: string | null
          cpf?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agency_id?: string | null
          avatar_url?: string | null
          color?: string | null
          cpf?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_documents: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          name: string
          proposal_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          proposal_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          proposal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_documents_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          activity_id: string | null
          activity_start_date: string | null
          agency_code: string | null
          agency_id: string | null
          agency_name: string | null
          agreement: string | null
          category: string | null
          central: string | null
          central_date: string | null
          client_size: string | null
          created_at: string | null
          created_by: string | null
          credit_program: string | null
          credit_purpose: string | null
          culture: string | null
          current_state: string | null
          entry_date: string | null
          guarantee_type: string | null
          id: string
          judicial_deadline: string | null
          last_analyst: string | null
          microcredit: string | null
          notes: string | null
          originator: string | null
          owner: string | null
          poa_prd_subject: string | null
          producer_address: string | null
          producer_cpf: string
          producer_name: string
          producer_phone: string | null
          project_designer:
          | Database["public"]["Enums"]["project_designer_enum"]
          | null
          pronaf_line: Database["public"]["Enums"]["pronaf_line"] | null
          proposal_number: string | null
          registration_start_date: string | null
          registration_task: string | null
          renegotiation_type: string | null
          request_type: string | null
          requested_value: number
          requesting_unit: string | null
          resource_application: string | null
          roc_type: string | null
          sicad: string | null
          special_treatment: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["proposal_status"] | null
          superintendency_code: string | null
          superintendency_name: string | null
          task: string | null
          technical_summary: string | null
          updated_at: string | null
        }
        Insert: {
          activity_id?: string | null
          activity_start_date?: string | null
          agency_code?: string | null
          agency_id?: string | null
          agency_name?: string | null
          agreement?: string | null
          category?: string | null
          central?: string | null
          central_date?: string | null
          client_size?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_program?: string | null
          credit_purpose?: string | null
          culture?: string | null
          current_state?: string | null
          entry_date?: string | null
          guarantee_type?: string | null
          id?: string
          judicial_deadline?: string | null
          last_analyst?: string | null
          microcredit?: string | null
          notes?: string | null
          originator?: string | null
          owner?: string | null
          poa_prd_subject?: string | null
          producer_address?: string | null
          producer_cpf: string
          producer_name: string
          producer_phone?: string | null
          project_designer?:
          | Database["public"]["Enums"]["project_designer_enum"]
          | null
          pronaf_line?: Database["public"]["Enums"]["pronaf_line"] | null
          proposal_number?: string | null
          registration_start_date?: string | null
          registration_task?: string | null
          renegotiation_type?: string | null
          request_type?: string | null
          requested_value?: number
          requesting_unit?: string | null
          resource_application?: string | null
          roc_type?: string | null
          sicad?: string | null
          special_treatment?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["proposal_status"] | null
          superintendency_code?: string | null
          superintendency_name?: string | null
          task?: string | null
          technical_summary?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_id?: string | null
          activity_start_date?: string | null
          agency_code?: string | null
          agency_id?: string | null
          agency_name?: string | null
          agreement?: string | null
          category?: string | null
          central?: string | null
          central_date?: string | null
          client_size?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_program?: string | null
          credit_purpose?: string | null
          culture?: string | null
          current_state?: string | null
          entry_date?: string | null
          guarantee_type?: string | null
          id?: string
          judicial_deadline?: string | null
          last_analyst?: string | null
          microcredit?: string | null
          notes?: string | null
          originator?: string | null
          owner?: string | null
          poa_prd_subject?: string | null
          producer_address?: string | null
          producer_cpf?: string
          producer_name?: string
          producer_phone?: string | null
          project_designer?:
          | Database["public"]["Enums"]["project_designer_enum"]
          | null
          pronaf_line?: Database["public"]["Enums"]["pronaf_line"] | null
          proposal_number?: string | null
          registration_start_date?: string | null
          registration_task?: string | null
          renegotiation_type?: string | null
          request_type?: string | null
          requested_value?: number
          requesting_unit?: string | null
          resource_application?: string | null
          roc_type?: string | null
          sicad?: string | null
          special_treatment?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["proposal_status"] | null
          superintendency_code?: string | null
          superintendency_name?: string | null
          task?: string | null
          technical_summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          agency_id: string | null
          color: string | null
          created_at: string | null
          id: string
          name: string
          role: string
          user_id: string | null
        }
        Insert: {
          agency_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          role: string
          user_id?: string | null
        }
        Update: {
          agency_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          can_approve_proposals: boolean | null
          can_create_proposals: boolean | null
          can_delete_proposals: boolean | null
          can_edit_proposals: boolean | null
          can_manage_agencies: boolean | null
          can_manage_disbursements: boolean | null
          can_manage_tasks: boolean | null
          can_manage_users: boolean | null
          can_manage_visits: boolean | null
          can_view_access_control: boolean | null
          can_view_agencies: boolean | null
          can_view_dashboard: boolean | null
          can_view_disbursements: boolean | null
          can_view_documentation: boolean | null
          can_view_kanban: boolean | null
          can_view_management: boolean | null
          can_view_proposals: boolean | null
          can_view_tasks: boolean | null
          can_view_visits: boolean | null
          created_at: string | null
          id: string
          read_only: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_approve_proposals?: boolean | null
          can_create_proposals?: boolean | null
          can_delete_proposals?: boolean | null
          can_edit_proposals?: boolean | null
          can_manage_agencies?: boolean | null
          can_manage_disbursements?: boolean | null
          can_manage_tasks?: boolean | null
          can_manage_users?: boolean | null
          can_manage_visits?: boolean | null
          can_view_access_control?: boolean | null
          can_view_agencies?: boolean | null
          can_view_dashboard?: boolean | null
          can_view_disbursements?: boolean | null
          can_view_documentation?: boolean | null
          can_view_kanban?: boolean | null
          can_view_management?: boolean | null
          can_view_proposals?: boolean | null
          can_view_tasks?: boolean | null
          can_view_visits?: boolean | null
          created_at?: string | null
          id?: string
          read_only?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_approve_proposals?: boolean | null
          can_create_proposals?: boolean | null
          can_delete_proposals?: boolean | null
          can_edit_proposals?: boolean | null
          can_manage_agencies?: boolean | null
          can_manage_disbursements?: boolean | null
          can_manage_tasks?: boolean | null
          can_manage_users?: boolean | null
          can_manage_visits?: boolean | null
          can_view_access_control?: boolean | null
          can_view_agencies?: boolean | null
          can_view_dashboard?: boolean | null
          can_view_disbursements?: boolean | null
          can_view_documentation?: boolean | null
          can_view_kanban?: boolean | null
          can_view_management?: boolean | null
          can_view_proposals?: boolean | null
          can_view_tasks?: boolean | null
          can_view_visits?: boolean | null
          created_at?: string | null
          id?: string
          read_only?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          agency_id: string | null
          created_at: string | null
          id: string
          producer_name: string | null
          proposal_id: string | null
          report: string | null
          status: string | null
          time: string | null
          visit_date: string
          visitor_name: string | null
        }
        Insert: {
          agency_id?: string | null
          created_at?: string | null
          id?: string
          producer_name?: string | null
          proposal_id?: string | null
          report?: string | null
          status?: string | null
          time?: string | null
          visit_date: string
          visitor_name?: string | null
        }
        Update: {
          agency_id?: string | null
          created_at?: string | null
          id?: string
          producer_name?: string | null
          proposal_id?: string | null
          report?: string | null
          status?: string | null
          time?: string | null
          visit_date?: string
          visitor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_proposal: { Args: { proposal_id: string }; Returns: undefined }
      get_auth_user_id: { Args: { email_input: string }; Returns: string }
      get_user_agency: { Args: never; Returns: string }
      is_admin: { Args: { check_user_id: string }; Returns: boolean }
      is_developer: { Args: { check_user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "gerente" | "tecnico" | "usuario" | "developer"
      disbursement_status: "pendente" | "aprovado" | "liberado" | "negado"
      project_designer_enum:
      | "ney_medeiros"
      | "jairo_santana"
      | "cledson"
      | "jailson"
      pronaf_line:
      | "custeio"
      | "investimento"
      | "mulher"
      | "jovem"
      | "eco"
      | "agroindustria"
      | "custeio_renovacao"
      | "pronaf_mais_alimento"
      | "cartao_bnb"
      | "pronaf_a_368"
      | "pronaf_a_669"
      | "pronaf_jovem"
      proposal_status:
      | "nova"
      | "em_analise"
      | "documentacao_pendente"
      | "aprovada"
      | "negada"
      | "visita_gerencial"
      | "avaliacao_risco"
      | "consideracoes_gerenciais"
      | "votacao_sinc"
      | "contrato_liberado"
      | "desembolso"
      | "desembolso_solicitado"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
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
      app_role: ["admin", "gerente", "tecnico", "usuario", "developer"],
      disbursement_status: ["pendente", "aprovado", "liberado", "negado"],
      project_designer_enum: [
        "ney_medeiros",
        "jairo_santana",
        "cledson",
        "jailson",
      ],
      pronaf_line: [
        "custeio",
        "investimento",
        "mulher",
        "jovem",
        "eco",
        "agroindustria",
        "custeio_renovacao",
        "pronaf_mais_alimento",
        "cartao_bnb",
        "pronaf_a_368",
        "pronaf_a_669",
        "pronaf_jovem",
      ],
      proposal_status: [
        "nova",
        "em_analise",
        "documentacao_pendente",
        "aprovada",
        "negada",
        "visita_gerencial",
        "avaliacao_risco",
        "consideracoes_gerenciais",
        "votacao_sinc",
        "contrato_liberado",
        "desembolso",
        "desembolso_solicitado",
      ],
    },
  },
} as const
