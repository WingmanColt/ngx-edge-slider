import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  TemplateRef,
  Input,
  EventEmitter,
  Output,
  SimpleChanges,
  OnChanges,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ViewEncapsulation,
} from "@angular/core";
import { SliderViewState } from "../models/slider-state.model";
import { Observable, Subject, takeUntil } from "rxjs";
import { SliderConfig } from "../models/slider-config.model";
import { SliderEngine } from "../engine/slider-engine.service";
import { SliderStore } from "../store/slider-store.service";
import { SliderDraggablePlugin } from "../plugins/draggable/draggable.plugin";
import { SliderNavigationPlugin } from "../plugins/navigation/navigation.plugin";
import { SliderPaginationPlugin } from "../plugins/pagination/pagination.plugin";
import { Pager, SliderPlugin } from "../plugins/slider-plugin";
import { CommonModule } from "@angular/common";
import { SliderAutoplayPlugin } from "../plugins/autoplay/autoplay.plugin";

@Component({
  selector: "app-simple-slider",
  templateUrl: "./simple-slider.component.html",
  styleUrl: "./simple-slider.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule],
  providers: [SliderEngine, SliderStore, SliderDraggablePlugin, SliderPaginationPlugin, SliderNavigationPlugin, SliderAutoplayPlugin],
})
export class SimpleSliderComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() config!: SliderConfig;
  @Input() slideTemplate?: TemplateRef<any>;
  @Input() navigationTemplate?: TemplateRef<any>;
  @Input() paginationTemplate?: TemplateRef<any>;
  @Output() slideChange = new EventEmitter<number>();

  private initialized = false;
  private isDraggingPointer = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private lastIndex = -1;
  private lastSlidesRef: any[] | null = null;
  private destroy$ = new Subject<void>();

  state$!: Observable<SliderViewState>;
  @ViewChild("sliderHost", { static: false }) sliderHost?: ElementRef<HTMLElement>;

  constructor(
    private engine: SliderEngine,
    private store: SliderStore,
    private draggable: SliderDraggablePlugin,
    private pagination: SliderPaginationPlugin,
    private navigation: SliderNavigationPlugin,
    private autoplay: SliderAutoplayPlugin,
  ) {}

  ngOnInit() {
    this.state$ = this.store.view$;

    this.state$.pipe(takeUntil(this.destroy$)).subscribe((state) => {
      if (state.currentSlide !== this.lastIndex) {
        this.lastIndex = state.currentSlide;
        this.slideChange.emit(state.currentSlide);
      }
    });
    this.lastSlidesRef = this.config?.slides ?? null;
    this.resolvePlugins(this.config);
    this.initialized = true; // ← mark after first resolvePlugins
  }
  ngAfterViewInit() {
    if (this.sliderHost?.nativeElement) {
      this.engine.attachContainer(this.sliderHost.nativeElement);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes["config"] || !this.config) return;
    if (!this.initialized) return; // ← skip the pre-ngOnInit call; ngOnInit handles it

    const newSlidesRef = this.config.slides ?? null;

    if (newSlidesRef !== this.lastSlidesRef) {
      this.lastSlidesRef = newSlidesRef;
      this.engine.destroy();
      this.resolvePlugins(this.config);
    }
  }
  ngOnDestroy() {
    this.destroySlider();
  }

  public goTo(index: number) {
    this.engine.selectSlide(index); // add this line
    //this.slideChange.emit(index);
  }

  destroySlider() {
    this.destroy$.next();
    this.destroy$.complete();
    this.engine.destroy();
  } // destroys plugins and clears store

  onNext() {
    this.engine.next();
  }
  onPrevious() {
    this.engine.previous();
  }
  selectSlide(index: number) {
    this.engine.selectSlide(index);
  }
  onRecalculate() {
    this.engine.recalculate();
  }
  // Navigation
  /** Expose navigation observables safely */
  get canPrev$(): Observable<boolean> | null {
    if (!this.navigation) {
      console.warn("Navigation plugin is not enabled.");
      return null;
    }
    return this.navigation.canPrev$;
  }

  get canNext$(): Observable<boolean> | null {
    if (!this.navigation) {
      console.warn("Navigation plugin is not enabled.");
      return null;
    }
    return this.navigation.canNext$;
  }

  /** Expose next/prev methods */
  public next() {
    this.navigation?.next();
  }

  public prev() {
    this.navigation?.prev();
  }

  /** Expose pagination observable */
  get pager$(): Observable<Pager | null> | null {
    if (!this.pagination) {
      console.warn("Pagination plugin is not enabled for this slider.");
      return null;
    }
    return this.pagination.pager$;
  }

  /** Expose a goToSlide method */
  public goToSlide(index: number) {
    this.pagination.goToSlide(index);
  }

  // Handle Pointers

  onPointerDown(event: PointerEvent) {
    // Only start drag if not clicking a nav button
    if ((event.target as HTMLElement).closest(".nav-btn")) {
      return; // ignore
    }
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.isDraggingPointer = false;

    // Do not capture yet; wait until movement exceeds threshold
    this.engine.handleDragStart(event);
  }

  onPointerMove(event: PointerEvent) {
    const dx = Math.abs(event.clientX - this.dragStartX);
    const dy = Math.abs(event.clientY - this.dragStartY);

    if (!this.isDraggingPointer && (dx > 5 || dy > 5)) {
      this.isDraggingPointer = true;

      // Now start capturing pointer so dragging works outside the slider bounds
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }

    if (this.isDraggingPointer) {
      this.engine.handleDragMove(event);
    }
  }

  onPointerUp(event: PointerEvent) {
    if (!event) return;

    if (!this.isDraggingPointer) {
      const target = event.target as HTMLElement;

      // Only select the slide if click is not on an interactive child
      const slideEl = target.closest(".slide");
      if (slideEl && !target.closest("button, video, a")) {
        const indexAttr = slideEl.getAttribute("data-index");
        const index = indexAttr ? parseInt(indexAttr, 10) : null;
        if (index !== null) this.engine.selectSlide(index);
      }
    }

    this.engine.handleDragEnd();
    this.isDraggingPointer = false;

    // Release pointer capture if it was captured
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {}
  }

  private resolvePlugins(config: SliderConfig) {
    const runtimePlugins: SliderPlugin[] = [];

    const cfg = config.plugins ?? {}; // <-- safe fallback

    if (cfg.draggable) runtimePlugins.push(this.draggable);
    if (cfg.pagination) runtimePlugins.push(this.pagination);
    if (cfg.navigation) runtimePlugins.push(this.navigation);
    if (cfg.autoplay) runtimePlugins.push(this.autoplay); // ← add BEFORE init, no setConfig yet

    this.engine.init({ ...config, plugins: undefined }, runtimePlugins);

    // ← call setConfig AFTER engine.init so this.engine is set inside the plugin
    if (cfg.autoplay) {
      this.autoplay.setConfig(cfg.autoplay);
    }
    if (cfg.navigation) {
      setTimeout(() => this.navigation?.updateArrows?.());
    }
  }
}
