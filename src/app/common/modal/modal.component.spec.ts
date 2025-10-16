import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';
import { ModalComponent } from './modal.component';
import { ModalService } from '../../../services/modal.service';

class ModalServiceStub {
  closeModal = jasmine.createSpy('closeModal');
}

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;
  let modalService: ModalServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalComponent],
      providers: [
        { provide: ModalService, useClass: ModalServiceStub }
      ]
    }).overrideComponent(ModalComponent, {
      set: { template: '' }
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    modalService = TestBed.inject(ModalService) as unknown as ModalServiceStub;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle fullscreen state', () => {
    component.fullscreen = false;

    component.toggleFullscreen();

    expect(component.fullscreen).toBeTrue();
  });

  it('should close modal and emit event', () => {
    const spy = jasmine.createSpy('close');
    component.closeModalEvent = new EventEmitter<void>();
    component.closeModalEvent.subscribe(spy);

    component.closeModal();

    expect(modalService.closeModal).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });

  it('should replace image source on error', () => {
    const image = document.createElement('img');
    const event = new Event('error');
    Object.defineProperty(event, 'target', { value: image });

    component.onImageError(event);

    expect(image.src).toContain('/default-player.jpg');
  });
});
