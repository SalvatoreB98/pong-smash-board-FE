
export interface UpdateProfileResponse {
  message: string;
  nickname: string;
  imageUrl: string | null;
  state: 'profile_not_completed' | 'profile_completed' | 'without_competition';
}