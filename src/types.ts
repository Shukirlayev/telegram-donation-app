export interface UserProfile {
  userId: number;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  telegramPhotoUrl?: string;
  displayName?: string;
}

export interface Goal {
  id: string;
  userId: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  createdAt: string;
  deadline?: string;
  isArchived?: boolean;
  isCompleted?: boolean;
}

export interface Transaction {
  id: string;
  userId: number;
  goalId: string;
  amount: number;
  note: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
}

