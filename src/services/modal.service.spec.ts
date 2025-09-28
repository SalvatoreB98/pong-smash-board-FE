import { ModalService } from './modal.service';

describe('ModalService', () => {
  let service: ModalService;
  let wrapper: HTMLElement;

  beforeEach(() => {
    service = new ModalService();
    wrapper = document.createElement('div');
    wrapper.className = 'wrapper';
    document.body.appendChild(wrapper);
  });

  afterEach(() => {
    document.body.removeChild(wrapper);
  });

  it('should open modal and apply effects', () => {
    let latest: string | null = null;
    service.activeModal$.subscribe(value => (latest = value));

    service.openModal('TEST');
    expect(latest as unknown as string).toBe('TEST');
    expect(document.querySelector('html')?.style.getPropertyValue('overflow')).toBe('hidden');
    expect(wrapper.style.filter).toBe('blur(0.625em)');
  });

  it('should close modal and remove effects', () => {
    service.openModal('TEST');
    service.closeModal();

    let latest: string | null = undefined as any;
    service.activeModal$.subscribe(value => (latest = value));

    expect(latest).toBeNull();
    expect(document.querySelector('html')?.style.getPropertyValue('overflow')).toBe('');
    expect(wrapper.style.filter).toBe('');
  });

  it('should check if modal is active', () => {
    service.openModal('ACTIVE');
    expect(service.isActiveModal('ACTIVE')).toBeTrue();
    expect(service.isActiveModal('OTHER')).toBeFalse();
  });
});
