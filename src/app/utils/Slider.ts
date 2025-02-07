export class Slider {
  private slider: HTMLElement | null;
  private matchesSlider: HTMLElement  = document.querySelector(".matches-slider") as HTMLElement;
  matches: NodeListOf<HTMLElement> | undefined;
  arrowLeft: any;
  arrowRight: any;
  index: number = 0;
  newPosition: number = 0;
  startX: number = 0;
  dragging: boolean = false;
  justDragged: boolean = false;

  constructor(containerId: string, matchesSlider: HTMLElement) {
    this.slider = document.getElementById(containerId);
    if (!this.slider) return;
    this.matchesSlider = matchesSlider;
    this.matches = this.slider.querySelectorAll(".match");
    this.arrowLeft = this.slider.querySelector(".arrow-left");
    this.arrowRight = this.slider.querySelector(".arrow-right");
    this.index = 0;
    this.newPosition = 0;
    this.startX = 0;
    this.dragging = false;
    this.justDragged = false;
    this.init();
  }

  private init(): void {
    if (!this.matchesSlider || !this.matches?.length) return;
    this.updateUI();
    this.addEventListeners();
  }

  private updateUI(): void {
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
          this.matchesSlider.scrollWidth < window.visualViewport!.width
          ? "0.2"
          : "1";
      this.arrowRight.style.pointerEvents = this.index === (this.matches?.length ?? 0) - 1 ? "none" : "auto";
    }
  }

  private touchInit(): void {
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
      this.matchesSlider.style.transform = `translateX(${translateX}px)`;
    });

    this.matchesSlider.addEventListener("touchend", (e: TouchEvent) => {
      moving = false;
      const endX = e.changedTouches[0].pageX;
      this.handleSwipe(endX - startX);
    });
  }

  private desktopGrabInit(): void {
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
      this.matchesSlider.style.transform = `translateX(${translateX}px)`;
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
    const scrolledMatches = Math.round(Math.abs(deltaX) / matchTotalWidth);

    if (deltaX < 0) {
      this.index = Math.min(this.index + scrolledMatches, this.matches!.length - 1);
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
    this.matchesSlider.style.transform = `translateX(${this.newPosition}px)`;
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
