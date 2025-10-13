import { SwiperOptions } from 'swiper/types';

export const BASE_SLIDER_CONFIG: SwiperOptions = {
  slidesPerView: 'auto',
  spaceBetween: 16,
  grabCursor: true,
  centerInsufficientSlides: true,
  watchOverflow: true,
  breakpoints: {
    0: {
      spaceBetween: 12
    },
    768: {
      spaceBetween: 16
    }
  }
};
