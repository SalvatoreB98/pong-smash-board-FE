import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NextMatchesComponent } from './next-matches.component';
import { DataService } from '../../../services/data.service';
import { ModalService } from '../../../services/modal.service';

describe('NextMatchesComponent', () => {
  let component: NextMatchesComponent;
  let fixture: ComponentFixture<NextMatchesComponent>;

  beforeEach(async () => {
    const dataServiceStub = {
      fetchNextMatches: jasmine.createSpy('fetchNextMatches').and.returnValue(Promise.resolve([]))
    } as Partial<DataService>;

    const modalServiceStub = {
      MODALS: { SHOW_NEXT_MATCH: 'showNextMatchModal' },
      openModal: jasmine.createSpy('openModal'),
      isActiveModal: () => false,
    } as Partial<ModalService>;

    await TestBed.configureTestingModule({
      imports: [NextMatchesComponent],
      providers: [
        { provide: DataService, useValue: dataServiceStub },
        { provide: ModalService, useValue: modalServiceStub }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NextMatchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
