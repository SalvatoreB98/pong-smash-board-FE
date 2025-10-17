import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatchesComponent } from './matches.component';
import { ModalService } from '../../../services/modal.service';
import { Utils } from '../../utils/Utils';
import { ElementRef } from '@angular/core';

class ModalServiceStub {
  MODALS = { SHOW_MATCH: 'SHOW_MATCH' } as const;
  openModal = jasmine.createSpy('openModal');
}

describe('MatchesComponent', () => {
  let component: MatchesComponent;
  let fixture: ComponentFixture<MatchesComponent>;
  let modalService: ModalServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchesComponent],
      providers: [{ provide: ModalService, useClass: ModalServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchesComponent);
    component = fixture.componentInstance;
    modalService = TestBed.inject(ModalService) as unknown as ModalServiceStub;
    component.matchesSlider = new ElementRef(document.createElement('div'));
  });

  it('should limit matches returned and reverse when requested', () => {
    component.matches = Array.from({ length: 30 }, (_, i) => ({ id: String(i), value: i }));
    component.maxMatchesToShow = 5;

    const normalOrder = component.getMatchesToRender();
    expect(normalOrder.length).toBe(5);
    expect(normalOrder[0].id).toBe('0');

    const reversed = component.getMatchesToRender(true);
    expect(reversed[0].id).toBe('29');
  });

  it('should return empty array when no matches provided', () => {
    component.matches = undefined as any;
    expect(component.getMatchesToRender()).toEqual([]);
  });

  it('should ignore click when slider was just dragged', () => {
    spyOn(Utils, 'isMobile').and.returnValue(false);
    component.slider = { justDragged: true } as any;
    component.matches = [{ id: '1', player1: 'A' }];
    spyOn(component.matchEmitter, 'emit');

    component.onMatchClick('1');
    expect(component.matchEmitter.emit).not.toHaveBeenCalled();
    expect(modalService.openModal).not.toHaveBeenCalled();
  });

  it('should emit match selection and open modal', () => {
    spyOn(Utils, 'isMobile').and.returnValue(false);
    component.slider = { justDragged: false } as any;
    const match = { id: '2', player1: 'A' } as any;
    component.matches = [match];
    const emitSpy = spyOn(component.matchEmitter, 'emit');

    component.onMatchClick('2');
    expect(component.clickedMatch).toEqual(match);
    expect(emitSpy).toHaveBeenCalledWith(match);
    expect(modalService.openModal).toHaveBeenCalledWith(modalService.MODALS.SHOW_MATCH);
  });

  it('should fallback to default image on error', () => {
    const img = document.createElement('img');
    const event = new Event('error');
    Object.defineProperty(event, 'target', { value: img });

    component.onImageError(event);
    expect(img.src).toContain('/default-player.jpg');
  });

  it('should track items by index', () => {
    expect(component.trackByIndex(3, { id: 3 })).toBe(3);
  });
});
