export interface UserProfile {
  userId: number;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  telegramPhotoUrl?: string;
  displayName?: string;
}

export interface Donation {
  id: string;
  userId: number;
  amount: number;
  description: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
}
