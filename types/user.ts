export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  bio?: string;
  location?: string;
  updated_at?: string;
}
