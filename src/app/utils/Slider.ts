export interface SliderOptions {
  itemSelector?: string;
  arrowLeftSelector?: string;
  arrowRightSelector?: string;
  enableMouseDrag?: boolean;
  enableTouchDrag?: boolean;
}

const defaultOptions: Required<SliderOptions> = {
  itemSelector: '.match',
  arrowLeftSelector: '.arrow-left',
  arrowRightSelector: '.arrow-right',
  enableMouseDrag: true,
  enableTouchDrag: true,
};

export class Slider {
  private slider: HTMLElement | null;
  private matchesSlider: HTMLElement;
  private matches: HTMLElement[] = [];
  private arrowLeft: HTMLElement | null = null;
  private arrowRight: HTMLElement | null = null;
  private options: Required<SliderOptions>;
  index: number = 0;
  newPosition: number = 0;
  startX: number = 0;
  dragging: boolean = false;
  justDragged: boolean = false;

  constructor(container: HTMLElement, matchesSlider: HTMLElement, options: SliderOptions = {}) {
    this.slider = container;
    this.matchesSlider = matchesSlider;
    this.options = { ...defaultOptions, ...options };
    if (!this.slider) return;
    this.refreshElements();
    this.index = 0;
    this.newPosition = 0;
    this.startX = 0;
    this.dragging = false;
    this.justDragged = false;
    this.init();
  }

  private init(): void {
    if (!this.matchesSlider || !this.matches.length) return;
    this.updateUI();
    this.addEventListeners();
  }

  private refreshElements(): void {
    this.matches = Array.from(this.matchesSlider.querySelectorAll(this.options.itemSelector));
    this.arrowLeft = this.slider?.querySelector(this.options.arrowLeftSelector) ?? null;
    this.arrowRight = this.slider?.querySelector(this.options.arrowRightSelector) ?? null;
  }

  private pxToEm(value: number): string {
    return `${value / 16}em`;
  }

  public updateUI(): void {
    this.refreshElements();
    this.updateSliderPosition();
    this.updateArrowState();
  }

  private updateArrowState(): void {
    if (this.arrowLeft) {
      this.arrowLeft.style.opacity = this.index === 0 ? "0.2" : "1";
      this.arrowLeft.style.pointerEvents = this.index === 0 ? "none" : "auto";
    }
    if (this.arrowRight) {
      this.arrowRight.style.opacity =
        this.index === (this.matches?.length ?? 0) - 1 ||
          (typeof window !== 'undefined' && window.visualViewport && this.matchesSlider.scrollWidth < window.visualViewport.width)
          ? "0.2"
          : "1";
      this.arrowRight.style.pointerEvents = this.index === (this.matches?.length ?? 0) - 1 ? "none" : "auto";
    }
  }

  private touchInit(): void {
    if (!this.options.enableTouchDrag) return;
    let startX: number, moving = false;

    this.matchesSlider.addEventListener("touchstart", (e: TouchEvent) => {
      startX = e.touches[0].pageX;
      moving = true;
      this.matchesSlider.style.transition = "";
    }, { passive: true });

    this.matchesSlider.addEventListener("touchmove", (e: TouchEvent) => {
      e.preventDefault();
      if (!moving) return;
      const currentX = e.touches[0].pageX;
      const translateX = this.newPosition + currentX - startX;
      this.matchesSlider.style.transform = `translateX(${this.pxToEm(translateX)})`;
    }, { passive: false });

    this.matchesSlider.addEventListener("touchend", (e: TouchEvent) => {
      moving = false;
      const endX = e.changedTouches[0].pageX;
      this.handleSwipe(endX - startX);
    });
  }

  private desktopGrabInit(): void {
    if (!this.options.enableMouseDrag) return;
    this.matchesSlider.querySelectorAll("img").forEach((img) => {
      img.addEventListener("dragstart", (e) => e.preventDefault());
    });

    this.matchesSlider.addEventListener("mousedown", (e: MouseEvent) => {
      if (e.button !== 0) return;
      this.dragging = true;
      this.startX = e.pageX;
      this.matchesSlider.style.transition = "";
    });

    this.matchesSlider.addEventListener("mousemove", (e: MouseEvent) => {
      if (!this.dragging) return;
        const currentX = e.pageX;
        const translateX = this.newPosition + currentX - this.startX;
        this.matchesSlider.style.transform = `translateX(${this.pxToEm(translateX)})`;
    });

    this.matchesSlider.addEventListener("mouseup", (e: MouseEvent) => {
      if (!this.dragging) return;
      this.dragging = false;
      this.handleSwipe(e.pageX - this.startX);
      if (Math.abs(e.pageX - this.startX) > 5) {
        this.justDragged = true;
        setTimeout(() => (this.justDragged = false), 100);
      }
    });

    this.matchesSlider.addEventListener("mouseleave", (e: MouseEvent) => {
      if (!this.dragging) return;
      this.dragging = false;
      this.handleSwipe(e.pageX - this.startX);
    });
  }

  private handleSwipe(deltaX: number): void {
    const firstMatch = this.matchesSlider.children[0] as HTMLElement;
    const firstMatchStyles = window.getComputedStyle(firstMatch);
    const matchWidth = firstMatch.offsetWidth;
    const matchMargin = parseInt(firstMatchStyles.marginLeft, 10) + parseInt(firstMatchStyles.marginRight, 10);
    const matchTotalWidth = matchWidth + matchMargin;
    const scrolledMatches = matchTotalWidth === 0 ? 0 : Math.round(Math.abs(deltaX) / matchTotalWidth);

    if (deltaX < 0) {
      this.index = Math.min(this.index + scrolledMatches, this.matches.length - 1);
    } else if (deltaX > 0) {
      this.index = Math.max(this.index - scrolledMatches, 0);
    }

    this.updateUI();
  }

  private updateSliderPosition(): void {
    if (!this.matches || this.matches.length === 0) return;
    const matchElement = this.matches[0];
    const matchStyles = window.getComputedStyle(matchElement);
    const matchWidth = (matchElement as HTMLElement).offsetWidth;
    const matchMarginLeft = parseFloat(matchStyles.marginLeft);
    const matchMarginRight = parseFloat(matchStyles.marginRight);
    const matchTotalWidth = matchWidth + matchMarginLeft + matchMarginRight;
    const maxSlide = this.matchesSlider.scrollWidth - this.matchesSlider.offsetWidth;
    this.newPosition = Math.max(-(this.index * matchTotalWidth), -maxSlide);
    this.matchesSlider.style.transition = "transform 0.3s ease-out";
    this.matchesSlider.style.transform = `translateX(${this.pxToEm(this.newPosition)})`;
  }

  private handleArrowClick(direction: "left" | "right"): void {
    if (direction === "left") {
      this.index = Math.max(this.index - 1, 0);
    } else if (direction === "right") {
      this.index = Math.min(this.index + 1, this.matches!.length - 1);
    }
    this.updateUI();
  }

  private addEventListeners(): void {
    this.touchInit();
    this.desktopGrabInit();
    if (this.arrowLeft) this.arrowLeft.addEventListener("click", () => this.handleArrowClick("left"));
    if (this.arrowRight) this.arrowRight.addEventListener("click", () => this.handleArrowClick("right"));
    window.addEventListener("resize", () => this.updateUI());
  }
}
