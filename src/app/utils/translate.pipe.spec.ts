import { TranslatePipe } from './translate.pipe';
import { TranslationService } from '../../services/translation.service';

describe('TranslatePipe', () => {
  let pipe: TranslatePipe;
  let translationService: jasmine.SpyObj<TranslationService>;

  beforeEach(() => {
    translationService = jasmine.createSpyObj<TranslationService>('TranslationService', ['translate']);
    translationService.translate.and.callFake((value: string) => `${value}-translated`);
    pipe = new TranslatePipe(translationService);
  });

  it('should call translation service when transforming value', () => {
    const result = pipe.transform('hello');

    expect(translationService.translate).toHaveBeenCalledWith('hello');
    expect(result).toBe('hello-translated');
  });
});
