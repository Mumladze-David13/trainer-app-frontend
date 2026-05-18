import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import {
  ExerciseApiService,
  ClientApiService,
  SeasonApiService,
  WorkoutApiService,
  SettingsApiService,
  UserApiService
} from './api.service';

const API = environment.apiUrl;

describe('ExerciseApiService', () => {
  let service: ExerciseApiService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ExerciseApiService]
    });
    service = TestBed.inject(ExerciseApiService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  describe('getAll', () => {
    it('should send GET request to /exercises and return all exercises', () => {
      const mockExercises = [
        { id: '1', name: 'Squats', description: 'Leg exercise', trainerId: 't1', createdAt: '2026-01-01' },
        { id: '2', name: 'Bench Press', trainerId: 't1', createdAt: '2026-01-02' }
      ];

      service.getAll().subscribe(data => {
        expect(data).toEqual(mockExercises);
      });

      const req = controller.expectOne(`${API}/exercises`);
      expect(req.request.method).toBe('GET');
      req.flush(mockExercises);
    });
  });

  describe('create', () => {
    it('should send POST request to /exercises with data and return created exercise', () => {
      const inputData = { name: 'Deadlift', description: 'Back exercise' };
      const mockResponse = { id: '3', ...inputData, trainerId: 't1', createdAt: '2026-01-03' };

      service.create(inputData).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = controller.expectOne(`${API}/exercises`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(inputData);
      req.flush(mockResponse);
    });
  });

  describe('update', () => {
    it('should send PUT request to /exercises/:id with data and return updated exercise', () => {
      const exerciseId = '1';
      const updateData = { name: 'Squats Updated', description: 'New description' };
      const mockResponse = { id: exerciseId, ...updateData, trainerId: 't1', createdAt: '2026-01-01' };

      service.update(exerciseId, updateData).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = controller.expectOne(`${API}/exercises/${exerciseId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockResponse);
    });
  });

  describe('delete', () => {
    it('should send DELETE request to /exercises/:id and return success message', () => {
      const exerciseId = '1';
      const mockResponse = { message: 'Exercise deleted successfully' };

      service.delete(exerciseId).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = controller.expectOne(`${API}/exercises/${exerciseId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });
});

describe('ClientApiService', () => {
  let service: ClientApiService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClientApiService]
    });
    service = TestBed.inject(ClientApiService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  describe('getMyClients', () => {
    it('should send GET request to /clients and return client list', () => {
      const mockClients = [
        { id: 'c1', email: 'client1@example.com', firstName: 'John', lastName: 'Doe' },
        { id: 'c2', email: 'client2@example.com', firstName: 'Jane', lastName: 'Smith' }
      ];

      service.getMyClients().subscribe(data => {
        expect(data).toEqual(mockClients);
      });

      const req = controller.expectOne(`${API}/clients`);
      expect(req.request.method).toBe('GET');
      req.flush(mockClients);
    });
  });

  describe('addClient', () => {
    it('should send POST request to /clients with clientId', () => {
      const clientId = 'c3';
      const mockResponse = { success: true };

      service.addClient(clientId).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = controller.expectOne(`${API}/clients`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ clientId });
      req.flush(mockResponse);
    });
  });

  describe('removeClient', () => {
    it('should send DELETE request to /clients/:clientId', () => {
      const clientId = 'c1';
      const mockResponse = { message: 'Client removed' };

      service.removeClient(clientId).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = controller.expectOne(`${API}/clients/${clientId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('getClientDetail', () => {
    it('should send GET request to /clients/:clientId and return client with seasons', () => {
      const clientId = 'c1';
      const mockResponse = {
        client: { id: 'c1', email: 'client@example.com', firstName: 'John', lastName: 'Doe', role: 'CLIENT' as const, createdAt: '2026-01-01' },
        seasons: [],
        sessionsPerSeason: 12
      };

      service.getClientDetail(clientId).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = controller.expectOne(`${API}/clients/${clientId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});

describe('SeasonApiService', () => {
  let service: SeasonApiService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SeasonApiService]
    });
    service = TestBed.inject(SeasonApiService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  describe('getSeasons', () => {
    it('should send GET request to /clients/:clientId/seasons and return seasons', () => {
      const clientId = 'c1';
      const mockSeasons = [
        { id: 's1', name: 'Season 1', startDate: '2026-01-01', isActive: true, trainerClientId: 'tc1', workouts: [] },
        { id: 's2', name: 'Season 2', startDate: '2026-02-01', endDate: '2026-03-01', isActive: false, trainerClientId: 'tc1', workouts: [] }
      ];

      service.getSeasons(clientId).subscribe(data => {
        expect(data).toEqual(mockSeasons);
      });

      const req = controller.expectOne(`${API}/clients/${clientId}/seasons`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSeasons);
    });
  });

  describe('createSeason', () => {
    it('should send POST request to /clients/:clientId/seasons with data and return created season', () => {
      const clientId = 'c1';
      const inputData = { startDate: '2026-05-01', endDate: '2026-06-01' };
      const mockResponse = { id: 's3', name: 'Season 3', ...inputData, isActive: true, trainerClientId: 'tc1', workouts: [] };

      service.createSeason(clientId, inputData).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = controller.expectOne(`${API}/clients/${clientId}/seasons`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(inputData);
      req.flush(mockResponse);
    });
  });

  describe('updateSeason', () => {
    it('should send PUT request to /clients/:clientId/seasons/:seasonId with data and return updated season', () => {
      const clientId = 'c1';
      const seasonId = 's1';
      const updateData = { endDate: '2026-07-01' };
      const mockResponse = { id: seasonId, name: 'Season 1', startDate: '2026-01-01', endDate: '2026-07-01', isActive: true, trainerClientId: 'tc1', workouts: [] };

      service.updateSeason(clientId, seasonId, updateData).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = controller.expectOne(`${API}/clients/${clientId}/seasons/${seasonId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockResponse);
    });
  });
});

describe('WorkoutApiService', () => {
  let service: WorkoutApiService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WorkoutApiService]
    });
    service = TestBed.inject(WorkoutApiService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  describe('getWorkout', () => {
    it('should send GET request to /workouts/:id and return workout', () => {
      const workoutId = 'w1';
      const mockWorkout = {
        id: workoutId,
        seasonId: 's1',
        date: '2026-05-18',
        notes: 'Leg day',
        isCompleted: false,
        workoutExercises: []
      };

      service.getWorkout(workoutId).subscribe(data => {
        expect(data).toEqual(mockWorkout);
      });

      const req = controller.expectOne(`${API}/workouts/${workoutId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockWorkout);
    });
  });

  describe('createWorkout', () => {
    it('should send POST request to /workouts with data and return created workout', () => {
      const inputData = {
        seasonId: 's1',
        notes: 'Upper body',
        exercises: [
          { exerciseId: 'e1', sets: 3, reps: 10, weight: 100, order: 1 }
        ]
      };
      const mockResponse = {
        id: 'w2',
        seasonId: 's1',
        date: '2026-05-18',
        notes: 'Upper body',
        isCompleted: false,
        workoutExercises: []
      };

      service.createWorkout(inputData).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = controller.expectOne(`${API}/workouts`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(inputData);
      req.flush(mockResponse);
    });
  });

  describe('updateWorkout', () => {
    it('should send PUT request to /workouts/:id with data and return updated workout', () => {
      const workoutId = 'w1';
      const updateData = { notes: 'Updated notes' };
      const mockResponse = {
        id: workoutId,
        seasonId: 's1',
        date: '2026-05-18',
        notes: 'Updated notes',
        isCompleted: false,
        workoutExercises: []
      };

      service.updateWorkout(workoutId, updateData).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = controller.expectOne(`${API}/workouts/${workoutId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockResponse);
    });
  });

  describe('deleteWorkout', () => {
    it('should send DELETE request to /workouts/:id', () => {
      const workoutId = 'w1';
      const mockResponse = { message: 'Workout deleted' };

      service.deleteWorkout(workoutId).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = controller.expectOne(`${API}/workouts/${workoutId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('saveProgress', () => {
    it('should send PATCH request to /workouts/:id/progress with doneExerciseIds', () => {
      const workoutId = 'w1';
      const doneExerciseIds = ['we1', 'we2'];
      const mockResponse = {
        id: workoutId,
        seasonId: 's1',
        date: '2026-05-18',
        isCompleted: false,
        workoutExercises: []
      };

      service.saveProgress(workoutId, doneExerciseIds).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = controller.expectOne(`${API}/workouts/${workoutId}/progress`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ doneExerciseIds });
      req.flush(mockResponse);
    });
  });

  describe('completeWorkout', () => {
    it('should send POST request to /workouts/:id/complete with doneExerciseIds', () => {
      const workoutId = 'w1';
      const doneExerciseIds = ['we1', 'we2', 'we3'];
      const mockResponse = {
        id: workoutId,
        seasonId: 's1',
        date: '2026-05-18',
        isCompleted: true,
        workoutExercises: []
      };

      service.completeWorkout(workoutId, doneExerciseIds).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = controller.expectOne(`${API}/workouts/${workoutId}/complete`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ doneExerciseIds });
      req.flush(mockResponse);
    });
  });

  describe('getClientSeasons', () => {
    it('should send GET request to /workouts/client/:trainerId/seasons and return seasons', () => {
      const trainerId = 't1';
      const mockSeasons = [
        { id: 's1', name: 'Season 1', startDate: '2026-01-01', isActive: true, trainerClientId: 'tc1', workouts: [] }
      ];

      service.getClientSeasons(trainerId).subscribe(data => {
        expect(data).toEqual(mockSeasons);
      });

      const req = controller.expectOne(`${API}/workouts/client/${trainerId}/seasons`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSeasons);
    });
  });
});

describe('SettingsApiService', () => {
  let service: SettingsApiService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SettingsApiService]
    });
    service = TestBed.inject(SettingsApiService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  describe('getTrainerSettings', () => {
    it('should send GET request to /settings/trainer and return trainer settings', () => {
      const mockSettings = {
        id: 'ts1',
        trainerId: 't1',
        sessionsPerSeason: 12
      };

      service.getTrainerSettings().subscribe(data => {
        expect(data).toEqual(mockSettings);
      });

      const req = controller.expectOne(`${API}/settings/trainer`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSettings);
    });
  });

  describe('updateTrainerSettings', () => {
    it('should send PUT request to /settings/trainer with sessionsPerSeason', () => {
      const sessionsPerSeason = 16;
      const mockResponse = {
        id: 'ts1',
        trainerId: 't1',
        sessionsPerSeason: 16
      };

      service.updateTrainerSettings(sessionsPerSeason).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = controller.expectOne(`${API}/settings/trainer`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ sessionsPerSeason });
      req.flush(mockResponse);
    });
  });

  describe('getClientSettings', () => {
    it('should send GET request to /settings/client and return client settings', () => {
      const mockSettings = {
        clientId: 'c1',
        trainerId: 't1'
      };

      service.getClientSettings().subscribe(data => {
        expect(data).toEqual(mockSettings);
      });

      const req = controller.expectOne(`${API}/settings/client`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSettings);
    });
  });

  describe('setClientTrainer', () => {
    it('should send PUT request to /settings/client/trainer with trainerId', () => {
      const trainerId = 't2';
      const mockResponse = { success: true };

      service.setClientTrainer(trainerId).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = controller.expectOne(`${API}/settings/client/trainer`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ trainerId });
      req.flush(mockResponse);
    });
  });
});

describe('UserApiService', () => {
  let service: UserApiService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserApiService]
    });
    service = TestBed.inject(UserApiService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  describe('getMe', () => {
    it('should send GET request to /users/me and return current user', () => {
      const mockUser = {
        id: 'u1',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'TRAINER' as const,
        createdAt: '2026-01-01'
      };

      service.getMe().subscribe(data => {
        expect(data).toEqual(mockUser);
      });

      const req = controller.expectOne(`${API}/users/me`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });
  });

  describe('getTrainers', () => {
    it('should send GET request to /users/trainers and return list of trainers', () => {
      const mockTrainers = [
        { id: 't1', email: 'trainer1@example.com', firstName: 'John', lastName: 'Trainer', role: 'TRAINER' as const, createdAt: '2026-01-01' },
        { id: 't2', email: 'trainer2@example.com', firstName: 'Jane', lastName: 'Coach', role: 'TRAINER' as const, createdAt: '2026-01-02' }
      ];

      service.getTrainers().subscribe(data => {
        expect(data).toEqual(mockTrainers);
      });

      const req = controller.expectOne(`${API}/users/trainers`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTrainers);
    });
  });
});