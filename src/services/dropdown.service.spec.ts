import { DropdownService, DropdownAction } from './dropdown.service';

describe('DropdownService', () => {
  let service: DropdownService;

  beforeEach(() => {
    service = new DropdownService();
    DropdownService['isOpen'] = false;
  });

  it('should open dropdown with provided actions and anchor', () => {
    const actions: DropdownAction[] = [{ value: 'edit', label: 'Edit' }];
    const anchor = document.createElement('button');

    let latestState: any = null;
    service.state$.subscribe(state => (latestState = state));

    service.open(actions, anchor);
    expect(latestState).toEqual({ actions, anchor });
    expect(DropdownService['isOpen']).toBeTrue();
  });

  it('should close dropdown and reset state', () => {
    service.open([], document.createElement('div'));

    let latestState: any = undefined;
    service.state$.subscribe(state => (latestState = state));

    service.close();
    expect(latestState).toBeNull();
    expect(DropdownService['isOpen']).toBeFalse();
  });

  it('should emit action value and close dropdown', () => {
    let emitted: string | null = null;
    service.action$.subscribe(value => (emitted = value));
    service.open([], document.createElement('div'));

    service.emit('delete');
    expect(emitted as unknown as string).toBe('delete');
    expect(DropdownService['isOpen']).toBeFalse();
  });
});
