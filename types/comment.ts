export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  user: { username: string; avatar_url: string | null };
}
