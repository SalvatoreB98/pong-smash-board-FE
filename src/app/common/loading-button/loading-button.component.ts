import { booleanAttribute, Component, DestroyRef, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../../services/loader.service';
import { Subscription } from 'rxjs';

type ButtonType = 'button' | 'submit' | 'reset';
type ButtonVariant = 'primary' | 'secondary' | 'link';

@Component({
  selector: 'app-loading-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-button.component.html',
  styleUrls: ['./loading-button.component.scss']
})
export class LoadingButtonComponent {
  @Input() type: ButtonType = 'button';
  @Input() variant: ButtonVariant = 'primary';
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input() icon?: string;

  @Input({ transform: booleanAttribute })
  set loading(value: boolean) {
    this.explicitLoading = value;
    this.updateLoadingState();
  }

  @Input({ transform: booleanAttribute })
  set linkToHttp(value: boolean) {
    if (this._linkToHttp === value) {
      return;
    }

    this._linkToHttp = value;
    this.configureHttpSubscription();
    this.updateLoadingState();
  }

  protected isLoading = false;

  private explicitLoading = false;
  private serviceLoading = false;
  private _linkToHttp = false;
  private httpSubscription?: Subscription;

  private readonly destroyRef = inject(DestroyRef);

  constructor(private readonly loaderService: LoaderService) {}

  private configureHttpSubscription(): void {
    if (this._linkToHttp) {
      if (this.httpSubscription) {
        return;
      }

      this.httpSubscription = this.loaderService.isSmallLoading$.subscribe((isLoading) => {
        this.serviceLoading = isLoading;
        this.updateLoadingState();
      });

      this.destroyRef.onDestroy(() => {
        this.httpSubscription?.unsubscribe();
        this.httpSubscription = undefined;
      });
    } else {
      if (this.httpSubscription) {
        this.httpSubscription.unsubscribe();
        this.httpSubscription = undefined;
      }
      this.serviceLoading = false;
    }
  }

  private updateLoadingState(): void {
    this.isLoading = this.serviceLoading || this.explicitLoading;
  }
}
