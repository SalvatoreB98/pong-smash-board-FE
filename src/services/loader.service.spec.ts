import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { LoaderService } from './loader.service';
import { MSG_TYPE } from '../app/utils/enum';
import { TranslationService } from './translation.service';
import { Utils } from '../app/utils/Utils';

class TranslationServiceStub {
  translate(key: string): string {
    return `translated:${key}`;
  }
}

describe('LoaderService', () => {
  let service: LoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoaderService,
        { provide: TranslationService, useClass: TranslationServiceStub },
      ],
    });
    service = TestBed.inject(LoaderService);
  });

  it('should toggle global loader state', () => {
    let lastValue = false;
    service.isLoading$.subscribe(value => (lastValue = value));

    service.startLoader();
    expect(lastValue).toBeTrue();

    service.stopLoader();
    expect(lastValue).toBeFalse();
  });

  it('should add and remove spinner to button element', () => {
    const button = document.createElement('button');

    service.addSpinnerToButton(button);
    expect(button.querySelector('.loader-spinner')).not.toBeNull();
    expect(button.style.opacity).toBe('0.7');

    service.removeSpinnerFromButton(button);
    expect(button.querySelector('.loader-spinner')).toBeNull();
    expect(button.style.opacity).toBe('1');
  });

  it('should emit toast messages translated and clear after duration', fakeAsync(() => {
    const toastMessages: Array<{ message: string; type: MSG_TYPE } | null> = [];
    service.toast$.subscribe(value => toastMessages.push(value));

    spyOn(Utils, 'isIos').and.returnValue(false);
    const highlightTarget = document.createElement('button');
    highlightTarget.id = 'add-players-button';
    document.body.appendChild(highlightTarget);

    service.showToast('not_enough_players', MSG_TYPE.WARNING, 1000);
    expect(toastMessages[toastMessages.length - 1]).toEqual({
      message: 'translated:not_enough_players',
      type: MSG_TYPE.WARNING,
    });

    tick(1000);
    expect(toastMessages[toastMessages.length - 1]).toBeNull();

    tick(1000);
    expect(highlightTarget.classList.contains('highlight')).toBeTrue();

    document.body.removeChild(highlightTarget);
  }));
});
