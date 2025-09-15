import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoiceScoreComponent } from './voice-score.component';

describe('VoiceScoreComponent', () => {
  let component: VoiceScoreComponent;
  let fixture: ComponentFixture<VoiceScoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoiceScoreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoiceScoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
