import Swiper from 'swiper';
import type { SwiperOptions } from 'swiper/types';

// Tiny helper to deduplicate Swiper lifecycle code between match lists.
export class SwiperManager {
  private instance?: Swiper;
  private config: SwiperOptions;

  constructor(
    private readonly elementResolver: () => HTMLElement | null | undefined,
    initialConfig: SwiperOptions,
  ) {
    // Clone the initial config so every slider instance can safely extend it
    // without mutating shared objects (e.g. BASE_SLIDER_CONFIG).
    this.config = { ...initialConfig };
  }

  /**
   * Allows callers to extend the Swiper configuration after construction.
   * Useful when navigation elements are only available once the view is ready.
   */
  updateConfig(partial: SwiperOptions): void {
    if (partial.navigation !== undefined) {
      this.config = {
        ...this.config,
        ...partial,
        navigation: this.mergeNavigationConfig(partial.navigation),
      };
    } else {
      this.config = {
        ...this.config,
        ...partial,
      };
    }

    if (this.instance) {
      // When an instance already exists we simply trigger an update so Swiper
      // can pick up the latest DOM changes (e.g. navigation buttons).
      this.instance.update();
    }
  }

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

  private mergeNavigationConfig(newNavigation: SwiperOptions['navigation']): SwiperOptions['navigation'] {
    const currentNavigation = this.config.navigation;

    if (typeof newNavigation === 'boolean' || newNavigation == null) {
      return newNavigation;
    }

    if (typeof currentNavigation === 'object' && currentNavigation !== null) {
      return {
        ...currentNavigation,
        ...newNavigation,
      };
    }

    return newNavigation;
  }
}
