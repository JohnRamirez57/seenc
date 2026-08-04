export interface savedEntry{
  title: string,
  tmdb_id: number
}

export interface userTable {
  created_at: Date;
  email: string;
  id: number;
  username: string;
  password_hash: string;
}