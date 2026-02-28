import { Injectable } from "@angular/core";
import { fromEvent, merge, Subject, auditTime, takeUntil } from "rxjs";
import { SliderConfig, DEFAULT_CONFIG } from "../models/slider-config.model";
import { SliderViewState } from "../models/slider-state.model";
import { SliderPlugin } from "../plugins/slider-plugin";
import { SliderStore } from "../store/slider-store.service";

@Injectable()
export class SliderEngine {
  private config!: SliderConfig;
  private plugins: SliderPlugin[] = [];
  private syncThumbsEngine?: SliderEngine;

  // RX lifecycle
  private destroy$ = new Subject<void>();

  // Container-based breakpoints
  private containerEl?: HTMLElement;
  private ro?: ResizeObserver;

  private measuredSlideSizePx?: number;

  constructor(private store: SliderStore) {}

  /* ---------------- Public API ---------------- */

  init(config: SliderConfig, plugins: SliderPlugin[] = []) {
    this.config = { ...DEFAULT_CONFIG, ...config, plugins: { ...(config.plugins ?? {}) } };
    this.plugins = plugins;

    this.plugins.forEach((p) => p.init?.(this));

    this.setupViewportSignals();
    this.applyBreakpoint();
    this.clampIndicesAfterLayoutChange();
    this.recalculate();
  }

  /** Call this from the component once you have the slider host element */
  attachContainer(el: HTMLElement) {
    this.containerEl = el;

    // Observe container size changes (robust in grids/sidebars/tabs)
    this.ro?.disconnect();
    this.ro = new ResizeObserver(() => {
      // We reuse the same debounced layout handler
      this.onLayoutSignal();
    });
    this.ro.observe(el);

    this.measureSlideSize();
    // Apply immediately based on real container width
    this.onLayoutSignal();
  }
  private measureSlideSize() {
    if (!this.containerEl) return;
    const firstSlide = this.containerEl.querySelector<HTMLElement>(".slide");
    if (!firstSlide) return;
    const rect = firstSlide.getBoundingClientRect();
    if (rect.width > 0) this.measuredSlideSizePx = rect.width;
  }
  destroy() {
    // Stop Rx streams
    this.destroy$.next();
    this.destroy$.complete();

    // Disconnect ResizeObserver
    this.ro?.disconnect();
    this.ro = undefined;
    this.containerEl = undefined;

    // Plugin cleanup
    this.plugins.forEach((p) => p.destroy?.());
    this.plugins = [];

    // Reset store
    this.store.reset();
  }

  next() {
    this.goTo(this.store.snapshot.currentSlide + this.slideStep());
    this.plugins.forEach((p) => p.onNext?.());
  }

  previous() {
    this.goTo(this.store.snapshot.currentSlide - this.slideStep());
    this.plugins.forEach((p) => p.onPrevious?.());
  }
  public getContainerEl(): HTMLElement | undefined {
    return this.containerEl;
  }
  selectSlide(index: number) {
    const slidesPerView = this.store.snapshot.slidesPerView;

    // 1️⃣ Mark selected
    this.store.update({ selectedSlide: index });

    // 2️⃣ Calculate page start
    let pageStart = Math.floor(index / slidesPerView) * slidesPerView;

    // 3️⃣ Clamp to maxStartIndex
    pageStart = Math.min(pageStart, this.maxStartIndex);

    // 4️⃣ If synced with thumbs, also clamp to their max index
    if (this.syncThumbsEngine) {
      const thumbMaxIndex = this.syncThumbsEngine.getMaxStartIndex();
      pageStart = Math.min(pageStart, thumbMaxIndex);
    }

    // 5️⃣ Move main slider
    if (pageStart !== this.store.snapshot.currentSlide) {
      this.goToSlide(pageStart);
    }

    // 6️⃣ Notify plugins
    this.plugins.forEach((p) => p.onSlideClick?.(index));
  }

  /* ---------------- Drag ---------------- */

  handleDragStart(event: PointerEvent) {
    this.store.update({ isDragging: true });
    this.plugins.forEach((p) => p.onDragStart?.(event));
  }
  handleDragMove(event: PointerEvent) {
    this.plugins.forEach((p) => p.onDragMove?.(event));
  }
  handleDragEnd() {
    this.store.update({ isDragging: false });
    this.plugins.forEach((p) => p.onDragEnd?.());
  }
  public goTo(index: number) {
    this.goToSlide(index); // reuse your existing private method
  }
  /* ---------------- Internals ---------------- */

  private goToSlide(index: number) {
    const clamped = Math.max(0, Math.min(index, this.maxStartIndex));
    // console.log("[Engine] goToSlide index:", index, "clamped:", clamped);

    this.store.update({ currentSlide: clamped });
    this.recalculate();

    // NOTE: calling onSlideClick here is a bit semantically odd (since it’s not always a click),
    // but I preserved your behavior.
    this.plugins.forEach((p) => p.onSlideClick?.(index));
  }

  public recalculate() {
    if (this.store.snapshot.isDragging) return; // skip during drag
    const slides = this.config.slides ?? [];
    const maxStartIndex = this.getMaxStartIndex();
    const current = this.store.snapshot.currentSlide;

    this.store.update({
      visibleSlides: slides,
      translate: this.translate(current),
      pager: this.buildPager(),
      maxStartIndex,
      canPrev: current > 0,
      canNext: current < maxStartIndex,
    });
  }

  private translate(index: number): string {
    const axis = this.config.vertical ? "Y" : "X";

    const containerSize = this.containerEl
      ? this.config.vertical
        ? this.containerEl.clientHeight
        : this.containerEl.clientWidth
      : this.config.vertical
        ? window.innerHeight
        : window.innerWidth;

    const gap = this.store.snapshot.gap ?? 0;

    const spv = this.store.snapshot.slidesPerView;
    const slideSize =
      this.config.isThumbs && this.measuredSlideSizePx
        ? this.measuredSlideSizePx
        : spv > 0
          ? (containerSize - gap * (spv - 1)) / spv
          : containerSize;

    // move by "pageStart * (slideSize + gap)"
    const offset = index * (slideSize + gap);

    return `translate${axis}(-${offset}px)`;
  }

  /** Debounced layout signals for resize/orientation/container changes */
  private setupViewportSignals() {
    // If you want "only after resizing stops", replace auditTime with debounceTime(120)
    const resize$ = fromEvent(window, "resize", { passive: true } as any);
    const orientation$ = fromEvent(window, "orientationchange", { passive: true } as any);

    merge(resize$, orientation$)
      .pipe(
        auditTime(80), // good compromise: responsive without over-recalc
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.onLayoutSignal());
  }

  private onLayoutSignal() {
    const beforeSlidesPerView = this.store.snapshot.slidesPerView;
    const beforeVisible = this.store.snapshot.isVisible;

    this.applyBreakpoint();

    const afterSlidesPerView = this.store.snapshot.slidesPerView;
    const afterVisible = this.store.snapshot.isVisible;

    if (beforeSlidesPerView !== afterSlidesPerView || beforeVisible !== afterVisible) {
      this.clampIndicesAfterLayoutChange();
    }

    this.measureSlideSize();

    this.recalculate();
  }

  private getBreakpointWidth(): number {
    if (this.containerEl) {
      // Prefer clientWidth (layout), fallback to rect width
      return this.containerEl.clientWidth || this.containerEl.getBoundingClientRect().width || window.innerWidth;
    }
    return window.innerWidth;
  }

  private applyBreakpoint() {
    const width = this.getBreakpointWidth();
    const bp = this.config.breakpoints;

    let override: Partial<SliderConfig> | undefined;
    let device: "mobile" | "tablet" | "desktop" = "desktop";

    if (width < 768) {
      override = bp?.mobile;
      device = "mobile";
    } else if (width < 1024) {
      override = bp?.tablet;
      device = "tablet";
    } else {
      override = bp?.desktop;
      device = "desktop";
    }

    // Merge overrides
    this.config = { ...this.config, ...override };

    this.store.update({
      slidesPerView: this.config.slidesPerView,
      gap: this.config.gap ?? 0, // ✅ NEW
      isVisible: this.config.showOn?.[device] ?? true,
    });
  }

  private clampIndicesAfterLayoutChange() {
    const max = this.getMaxStartIndex();

    const current = this.store.snapshot.currentSlide;
    const selected = this.store.snapshot.selectedSlide;

    const clampedCurrent = Math.max(0, Math.min(current, max));
    const clampedSelected = selected === -1 ? -1 : Math.max(0, Math.min(selected, (this.config.slides?.length ?? 0) - 1));

    this.store.update({
      currentSlide: clampedCurrent,
      selectedSlide: clampedSelected,
    });
  }

  private buildPager() {
    const totalSlides = this.config.slides.length;
    const currentSlide = this.store.snapshot.selectedSlide !== -1 ? this.store.snapshot.selectedSlide : this.store.snapshot.currentSlide;

    const maxVisibleDots = 5;

    let start = Math.max(0, currentSlide - Math.floor(maxVisibleDots / 2));
    let end = start + maxVisibleDots;

    if (end > totalSlides) {
      end = totalSlides;
      start = Math.max(0, end - maxVisibleDots);
    }

    const visibleDots = Array.from({ length: end - start }, (_, i) => start + i);
    const activeDotIndex = visibleDots.indexOf(currentSlide);

    return {
      currentPage: currentSlide,
      totalPages: totalSlides,
      visibleDots,
      activeDotIndex,
    };
  }

  private slideStep() {
    return this.store.snapshot.slidesPerView;
  }

  private get maxStartIndex() {
    const total = this.config.slides?.length ?? 0;
    return Math.max(0, total - this.store.snapshot.slidesPerView);
  }
  getMaxStartIndex() {
    const total = this.config.slides?.length ?? 0;
    const spv = this.store.snapshot.slidesPerView || 1;
    return Math.max(0, total - spv);
  }
  /* -------- Plugin-safe API -------- */

  getState() {
    return this.store.snapshot;
  }

  getStateObservable() {
    return this.store.view$;
  }

  setState(patch: Partial<SliderViewState>) {
    this.store.update(patch);
  }

  getConfig() {
    return this.config;
  }

  /** Link this slider to thumbs */
  syncWithThumbs(thumbsEngine: SliderEngine) {
    this.syncThumbsEngine = thumbsEngine;
  }

  /* -------- Read-only helpers -------- */

  getSlidesPerView(): number {
    return this.store.snapshot.slidesPerView;
  }

  getCurrentSlide(): number {
    return this.store.snapshot.currentSlide;
  }

  getSelectedSlide(): number {
    return this.store.snapshot.selectedSlide;
  }
}
