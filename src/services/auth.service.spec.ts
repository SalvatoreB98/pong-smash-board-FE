import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { SupabaseAuthService } from './supabase-auth.service';
import { UserService } from './user.service';
import { CompetitionService } from './competitions.service';

class SupabaseAuthServiceStub {
  getUserSession = jasmine.createSpy('getUserSession').and.returnValue(Promise.resolve({ data: { session: null } }));
  signOut = jasmine.createSpy('signOut').and.returnValue(Promise.resolve());
}

class UserServiceStub {
  clear = jasmine.createSpy('clear');
}

class CompetitionServiceStub {}

describe('AuthService', () => {
  let service: AuthService;
  let supabase: SupabaseAuthServiceStub;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseAuthService, useClass: SupabaseAuthServiceStub },
        { provide: UserService, useClass: UserServiceStub },
        { provide: CompetitionService, useClass: CompetitionServiceStub },
      ],
    });

    service = TestBed.inject(AuthService);
    supabase = TestBed.inject(SupabaseAuthService) as unknown as SupabaseAuthServiceStub;
  });

  it('should mark user as logged in when session exists', fakeAsync(() => {
    supabase.getUserSession.and.returnValue(Promise.resolve({ data: { session: { user: {} } } }));

    service.checkAuth();
    tick();

    let latest = false;
    service.isLoggedIn$.subscribe(value => (latest = value));
    tick();
    expect(latest).toBeTrue();
  }));

  it('should logout and clear user data', fakeAsync(() => {
    const userService = TestBed.inject(UserService) as unknown as UserServiceStub;

    service.isLoggedIn$.next(true);
    service.logout();
    tick();

    expect(supabase.signOut).toHaveBeenCalled();
    expect(userService.clear).toHaveBeenCalled();

    let latest = true;
    service.isLoggedIn$.subscribe(value => (latest = value));
    tick();
    expect(latest).toBeFalse();
  }));
});
