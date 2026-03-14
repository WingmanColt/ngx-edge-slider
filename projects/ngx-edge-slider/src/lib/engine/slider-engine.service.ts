import { Injectable } from "@angular/core";
import { fromEvent, merge, Subject, auditTime, takeUntil } from "rxjs";
import { SliderConfig, DEFAULT_CONFIG } from "../models/slider-config.model";
import { SliderViewState } from "../models/slider-state.model";
import { SliderPlugin } from "../plugins/slider-plugin";
import { SliderStore } from "../store/slider-store.service";
import { SliderAutoplayPlugin } from "../plugins/autoplay/autoplay.plugin";

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
  private silentJumpTimer: any;
  constructor(private store: SliderStore) {}

  /* ---------------- Public API ---------------- */

  // In init() — fix starting position and selectedSlide
  init(config: SliderConfig, plugins: SliderPlugin[] = []) {
    this.config = { ...DEFAULT_CONFIG, ...config, plugins: { ...(config.plugins ?? {}) } };
    this.plugins = plugins;
    this.plugins.forEach((p) => p.init?.(this));
    this.setupViewportSignals();
    this.applyBreakpoint();

    // Only start at middle clone if loop mode is active
    const startIndex = this.isLoopMode ? this.loopLength : 0;
    this.store.update({ currentSlide: startIndex, selectedSlide: 0 }); // ← selectedSlide: 0
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

    // ← notify plugins that container is ready
    this.plugins.forEach((p) => p.onContainerAttached?.());
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
    const next = this.store.snapshot.currentSlide + this.slideStep();
    this.goToSlide(next);
    this.plugins.forEach((p) => p.onNext?.());
    if (this.isLoopMode) this.scheduleLoopReset(); // ← guarded
  }

  previous() {
    const prev = this.store.snapshot.currentSlide - this.slideStep();
    this.goToSlide(prev);
    this.plugins.forEach((p) => p.onPrevious?.());
    if (this.isLoopMode) this.scheduleLoopReset(); // ← guarded
  }

  public getContainerEl(): HTMLElement | undefined {
    return this.containerEl;
  }
  selectSlide(index: number) {
    const slidesPerView = this.store.snapshot.slidesPerView;

    // Map looped index back to real index
    const len = this.loopLength;
    const realIndex = len > 0 ? ((index % len) + len) % len : index;

    this.store.update({ selectedSlide: realIndex }); // ← use realIndex, not raw loop index

    let pageStart = Math.floor(index / slidesPerView) * slidesPerView;
    pageStart = Math.min(pageStart, this.maxStartIndex);

    if (pageStart !== this.store.snapshot.currentSlide) {
      this.goToSlide(pageStart);
    }

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

  // Guard scheduleLoopReset and normalizeLoopPosition
  private scheduleLoopReset() {
    if (!this.isLoopMode) return; // ← add this
    clearTimeout(this.silentJumpTimer);
    this.silentJumpTimer = setTimeout(() => this.normalizeLoopPosition(), 520);
  }

  private normalizeLoopPosition() {
    const len = this.loopLength;
    if (len === 0) return;
    const current = this.store.snapshot.currentSlide;

    let normalized: number | null = null;

    if (current >= len * 2) {
      // Went past the 3rd copy — jump back to 2nd copy (middle)
      normalized = len + ((current - len) % len);
    } else if (current < len) {
      // Went before the 1st copy — jump forward to 2nd copy (middle)
      normalized = len + (((current % len) + len) % len);
    }

    if (normalized !== null) {
      this.store.update({ silentJump: true, currentSlide: normalized });
      this.recalculate();
      requestAnimationFrame(() => {
        this.store.update({ silentJump: false });
      });
    }
  }

  public recalculate() {
    if (this.store.snapshot.isDragging) return;
    const slides = this.loopedSlides;
    const maxStartIndex = this.getMaxStartIndex();
    const current = this.store.snapshot.currentSlide;

    this.store.update({
      visibleSlides: slides,
      translate: this.translate(current),
      pager: this.buildPager(),
      maxStartIndex,
      canPrev: this.isLoopMode ? true : current > 0, // ← fix
      canNext: this.isLoopMode ? true : current < maxStartIndex, // ← fix
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

    // Merge overrides deeply to preserve showOn
    this.config = {
      ...this.config,
      ...override,
      showOn: { ...this.config.showOn, ...override?.showOn },
    };

    this.store.update({
      slidesPerView: this.config.slidesPerView,
      gap: this.config.gap ?? 0,
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

  // Update buildPager to use original slides for dot count
  private buildPager() {
    const totalSlides = this.originalSlides.length;
    const len = this.loopLength;

    // When not in loop mode, use currentSlide directly
    const raw = this.store.snapshot.selectedSlide !== -1 ? this.store.snapshot.selectedSlide : this.store.snapshot.currentSlide;

    const currentSlide = len > 0 ? (((raw - len) % len) + len) % len : Math.min(raw, totalSlides - 1); // ← no modulo when not looping

    const maxVisibleDots = 5;
    let start = Math.max(0, currentSlide - Math.floor(maxVisibleDots / 2));
    let end = start + maxVisibleDots;
    if (end > totalSlides) {
      end = totalSlides;
      start = Math.max(0, end - maxVisibleDots);
    }

    const visibleDots = Array.from({ length: end - start }, (_, i) => start + i);
    return {
      currentPage: currentSlide,
      totalPages: totalSlides,
      visibleDots,
      activeDotIndex: visibleDots.indexOf(currentSlide),
    };
  }
  private slideStep() {
    return this.store.snapshot.slidesPerView;
  }

  private get maxStartIndex() {
    return Math.max(0, this.loopedSlides.length - this.store.snapshot.slidesPerView);
  }
  getMaxStartIndex() {
    const spv = this.store.snapshot.slidesPerView || 1;
    return Math.max(0, this.loopedSlides.length - spv);
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

  // Helpers
  private get isLoopMode(): boolean {
    return !!(this.config.loop || this.plugins.some((p) => p instanceof SliderAutoplayPlugin));
  }
  private get originalSlides() {
    return this.config.slides ?? [];
  }
  private get loopedSlides() {
    const s = this.originalSlides;
    return this.isLoopMode ? [...s, ...s, ...s] : [...s];
  }
  private get loopLength() {
    return this.isLoopMode ? this.originalSlides.length : 0;
  }
}
