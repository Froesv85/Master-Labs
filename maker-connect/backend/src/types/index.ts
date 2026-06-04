// User types
export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  lgpd_consent: boolean;
}

export interface UserProfile {
  id: number;
  user_id: number;
  maker_level: 'apprentice' | 'journeyman' | 'master';
  expertise_areas: string[];
  bio_long?: string;
  github_url?: string;
  portfolio_url?: string;
  years_of_experience?: number;
  total_projects: number;
  total_contributions: number;
  reputation_score: number;
  updated_at: Date;
}

// Post types
export interface Post {
  id: number;
  user_id: number;
  project_id?: number;
  title: string;
  content: string;
  content_type: 'text' | 'image' | 'video' | 'project_update';
  media_urls?: string[];
  visibility: 'public' | 'followers' | 'private';
  status: 'draft' | 'published' | 'archived';
  engagement_score: number;
  created_at: Date;
  updated_at: Date;
}

// Project types
export interface Project {
  id: number;
  creator_id: number;
  name: string;
  description: string;
  category: 'robotics' | '3d-printing' | 'iot' | 'woodworking';
  parent_project_id?: number;
  status: 'draft' | 'active' | 'archived' | 'completed';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_hours?: number;
  repository_url?: string;
  documentation_url?: string;
  thumbnail_url?: string;
  view_count: number;
  fork_count: number;
  upvote_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectComponent {
  id: number;
  project_id: number;
  component_name: string;
  component_type: 'microcontroller' | 'sensor' | 'motor' | 'power' | 'wireless' | 'mechanical';
  part_number?: string;
  quantity: number;
  unit_cost?: number;
  supplier_url?: string;
  datasheet_url?: string;
  notes?: string;
}

export interface ProjectBOM {
  id: number;
  project_id: number;
  total_cost?: number;
  total_weight?: number;
  component_count: number;
  tool_requirements?: string[];
  assembly_time_hours?: number;
  estimated_difficulty: 'beginner' | 'intermediate' | 'advanced';
  created_at: Date;
  updated_at: Date;
}

// Robot types
export interface RobotModel {
  id: number;
  project_id: number;
  user_id: number;
  name: string;
  description?: string;
  category: 'autonomous' | 'competition' | 'industrial' | 'educational';
  specs?: Record<string, any>;
  bom_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface RobotInstance {
  id: number;
  robot_model_id: number;
  user_id: number;
  serial_number?: string;
  status: 'assembled' | 'testing' | 'competition' | 'archived';
  firmware_version?: string;
  build_date?: Date;
  build_notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Export types
export interface ProjectExport {
  id: number;
  project_id: number;
  export_type: 'complete' | 'bom-only' | 'manual';
  export_path: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  exported_by?: number;
  ai_enrichment_metadata?: Record<string, any>;
  file_size?: number;
  created_at: Date;
  completed_at?: Date;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Pagination
export interface PaginatedRequest {
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  total: number;
  items: T[];
  limit: number;
  offset: number;
  hasMore: boolean;
}
