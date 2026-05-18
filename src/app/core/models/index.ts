// src/app/core/models/user.model.ts
export type Role = 'TRAINER' | 'CLIENT' | 'TRAINER_CLIENT';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// src/app/core/models/exercise.model.ts
export interface Exercise {
  id: string;
  name: string;
  description?: string;
  trainerId: string;
  createdAt: string;
}

// src/app/core/models/workout.model.ts
export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  exercise: Exercise;
  sets: number;
  reps: number;
  weight?: number;
  order: number;
  isDone: boolean;
}

export interface WorkoutCompletion {
  id: string;
  workoutId: string;
  clientId: string;
  completedAt: string;
}

export interface Workout {
  id: string;
  seasonId: string;
  date: string;
  notes?: string;
  isCompleted: boolean;
  workoutExercises: WorkoutExercise[];
  completion?: WorkoutCompletion;
}

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  trainerClientId: string;
  workouts: Workout[];
}

export interface ClientWithSeasons {
  client: User;
  seasons: Season[];
  sessionsPerSeason: number;
}

export interface TrainerSettings {
  id: string;
  trainerId: string;
  sessionsPerSeason: number;
}
