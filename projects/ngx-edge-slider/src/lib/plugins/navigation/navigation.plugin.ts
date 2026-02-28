import { Injectable } from "@angular/core";
import { SliderPlugin } from "../slider-plugin";
import { SliderEngine } from "../../engine/slider-engine.service";
import { BehaviorSubject, Subscription } from "rxjs";

@Injectable()
export class SliderNavigationPlugin implements SliderPlugin {
  private engine!: SliderEngine;

  private isPagerMode = false;

  private _canPrev$ = new BehaviorSubject<boolean>(false);
  private _canNext$ = new BehaviorSubject<boolean>(false);

  private sub!: Subscription;

  get canPrev$() {
    return this._canPrev$.asObservable();
  }
  get canNext$() {
    return this._canNext$.asObservable();
  }

  init(engine: SliderEngine, isPagerMode: boolean = false) {
    this.engine = engine;
    this.isPagerMode = isPagerMode;

    // Subscribe to state changes
    this.sub = this.engine.getStateObservable?.()?.subscribe(() => this.updateArrows());

    // ✅ Force initial check after a short delay (to catch async slides)
    setTimeout(() => this.updateArrows());
  }

  destroy() {
    this.sub?.unsubscribe();
  }
  next() {
    if (!this.engine) return;

    if (this.isPagerMode) {
      const state = this.engine.getState();
      const cfg = this.engine.getConfig();

      const totalSlides = cfg?.slides?.length ?? 0;
      const perView = state?.slidesPerView ?? cfg?.slidesPerView ?? 1;
      const step = cfg?.slidesToSlide ?? 1;

      const maxIndex = Math.max(0, totalSlides - perView);
      const current = state?.currentSlide ?? 0;

      const newIndex = Math.min(maxIndex, current + step);
      this.engine.goTo(newIndex);
    } else {
      this.engine.next();
    }
  }

  prev() {
    if (!this.engine) return;

    if (this.isPagerMode) {
      const state = this.engine.getState();
      const cfg = this.engine.getConfig();

      const step = cfg?.slidesToSlide ?? 1;
      const current = state?.currentSlide ?? 0;

      const newIndex = Math.max(0, current - step);
      this.engine.goTo(newIndex);
    } else {
      this.engine.previous();
    }
  }

  public updateArrows() {
    if (!this.engine) return;

    const state = this.engine.getState();
    const cfg = this.engine.getConfig();
    const totalSlides = cfg?.slides?.length ?? 0;
    const perView = state?.slidesPerView ?? 1;

    const canPrev = totalSlides > 0 && (state?.currentSlide ?? 0) > 0;
    const canNext = totalSlides > 0 && (state?.currentSlide ?? 0) < Math.max(0, totalSlides - perView);

    if (this._canPrev$.value !== canPrev) this._canPrev$.next(canPrev);
    if (this._canNext$.value !== canNext) this._canNext$.next(canNext);
  }
}
