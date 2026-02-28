import { Injectable } from "@angular/core";
import { Pager, SliderPlugin } from "../slider-plugin";
import { SliderEngine } from "../../engine/slider-engine.service";
import { BehaviorSubject, Subscription } from "rxjs";

@Injectable()
export class SliderPaginationPlugin implements SliderPlugin {
  private engine!: SliderEngine;
  private maxVisibleDots = 10;
  private sub!: Subscription;

  private _pager$ = new BehaviorSubject<Pager | null>(null);
  public pager$ = this._pager$.asObservable();

  init(engine: SliderEngine) {
    this.engine = engine;

    this.sub = this.engine.getStateObservable().subscribe(() => {
      this.updatePager();
    });

    // initial
    setTimeout(() => this.updatePager());
  }

  destroy() {
    this.sub?.unsubscribe();
    this._pager$.next(null);
  }

  /** Go to a slide by slide index (NOT dot index) */
  goToSlide(slideIndex: number) {
    this.engine.selectSlide(slideIndex);
  }

  private updatePager() {
    const state = this.engine.getState();
    const totalSlides = state.visibleSlides?.length ?? 0;
    if (totalSlides <= 0) {
      this._pager$.next(null);
      return;
    }

    // ✅ important: selectedSlide is -1 initially; fallback to currentSlide
    const current = state.selectedSlide !== -1 ? state.selectedSlide : state.currentSlide;

    const maxDots = Math.max(1, this.maxVisibleDots);

    // ✅ clamp to >= 0
    const safeCurrent = Math.max(0, Math.min(current, totalSlides - 1));

    const pageStart = Math.max(0, Math.floor(safeCurrent / maxDots) * maxDots);
    const pageEnd = Math.min(pageStart + maxDots, totalSlides);

    const visibleDots = Array.from({ length: pageEnd - pageStart }, (_, i) => pageStart + i);

    const activeDotIndex = visibleDots.indexOf(safeCurrent);

    this._pager$.next({ visibleDots, activeDotIndex });
  }
}
