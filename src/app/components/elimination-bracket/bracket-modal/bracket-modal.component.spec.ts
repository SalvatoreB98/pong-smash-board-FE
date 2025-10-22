import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BracketModalComponent } from './bracket-modal.component';

describe('BracketModalComponent', () => {
  let component: BracketModalComponent;
  let fixture: ComponentFixture<BracketModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BracketModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BracketModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
