import Swiper from 'swiper';
import type { SwiperOptions } from 'swiper/types';

// Tiny helper to deduplicate Swiper lifecycle code between match lists.
export class SwiperManager {
  private instance?: Swiper;

  constructor(
    private readonly elementResolver: () => HTMLElement | null | undefined,
    private readonly config: SwiperOptions,
  ) { }

  init(): void {
    if (this.instance) {
      return;
    }

    const element = this.elementResolver();
    if (!element) {
      return;
    }

    this.instance = new Swiper(element, this.config);
    this.queueUpdate();
  }

  queueUpdate(): void {
    queueMicrotask(() => {
      const element = this.elementResolver();
      if (!element) {
        return;
      }

      if (!this.instance) {
        this.instance = new Swiper(element, this.config);
      } else {
        this.instance.update();
      }
    });
  }

  destroy(): void {
    this.instance?.destroy(true, true);
    this.instance = undefined;
  }

  get value(): Swiper | undefined {
    return this.instance;
  }
}
