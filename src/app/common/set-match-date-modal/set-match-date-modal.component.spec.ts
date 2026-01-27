import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetMatchDateModalComponent } from './set-match-date-modal.component';
import { MatchService } from '../../../services/match.service';
import { LoaderService } from '../../../services/loader.service';
import { ModalService } from '../../../services/modal.service';
import { DataService } from '../../../services/data.service';
import { TranslationService } from '../../../services/translation.service';

class MatchServiceStub {
  setMatchDate = jasmine.createSpy('setMatchDate');
}

class LoaderServiceStub {
  startLittleLoader = jasmine.createSpy('startLittleLoader');
  stopLittleLoader = jasmine.createSpy('stopLittleLoader');
  showToast = jasmine.createSpy('showToast');
}

class ModalServiceStub {
  closeModal = jasmine.createSpy('closeModal');
}

class DataServiceStub {
  refresh = jasmine.createSpy('refresh');
}

class TranslationServiceStub {
  translate(value: string): string {
    return value;
  }
}

describe('SetMatchDateModalComponent', () => {
  let component: SetMatchDateModalComponent;
  let fixture: ComponentFixture<SetMatchDateModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetMatchDateModalComponent],
      providers: [
        { provide: MatchService, useClass: MatchServiceStub },
        { provide: LoaderService, useClass: LoaderServiceStub },
        { provide: ModalService, useClass: ModalServiceStub },
        { provide: DataService, useClass: DataServiceStub },
        { provide: TranslationService, useClass: TranslationServiceStub },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetMatchDateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
