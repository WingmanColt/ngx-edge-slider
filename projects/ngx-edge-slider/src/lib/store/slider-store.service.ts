import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { INITIAL_SLIDER_STATE, SliderViewState } from "../models/slider-state.model";

@Injectable()
export class SliderStore {
  private readonly state$ = new BehaviorSubject<SliderViewState>({
    currentSlide: 0,
    selectedSlide: -1,

    slidesPerView: 1,
    visibleSlides: [],

    translate: "translateX(0)",
    transition: "transform 300ms ease",
    pager: null,
    isVisible: true,

    isAnimating: false,
    isDragging: false,
  });
  readonly view$ = this.state$.asObservable();

  get snapshot() {
    return this.state$.value;
  }

  update(patch: Partial<SliderViewState>) {
    this.state$.next({ ...this.snapshot, ...patch });
  }

  reset() {
    this.state$.next(INITIAL_SLIDER_STATE);
  }
}
