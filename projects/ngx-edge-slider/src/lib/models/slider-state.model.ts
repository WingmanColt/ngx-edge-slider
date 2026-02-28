export interface SliderViewState {
  currentSlide: number;
  selectedSlide: number;

  slidesPerView: number;
  visibleSlides: any[];

  gap?: number;

  maxStartIndex?: number;
  canPrev?: boolean;
  canNext?: boolean;

  pager?: {
    currentPage: number;
    totalPages: number;
    visibleDots: number[];
    activeDotIndex: number;
  } | null;

  translate?: string;
  transition?: string;

  isAnimating?: boolean;
  isVisible?: boolean;
  isDragging?: boolean;
}

export const INITIAL_SLIDER_STATE: SliderViewState = {
  currentSlide: 0,
  selectedSlide: -1,

  slidesPerView: 1,
  visibleSlides: [],

  gap: 0,
  maxStartIndex: 0,
  canPrev: false,
  canNext: false,

  translate: "translateX(0px)",
  transition: "transform 300ms ease",
  pager: null,

  isAnimating: false,
  isVisible: false,
  isDragging: false,
};
