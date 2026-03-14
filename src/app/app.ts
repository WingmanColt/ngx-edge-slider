import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, ViewChild, ViewEncapsulation } from '@angular/core';
import {
  NavPosition,
  NgxEdgeSliderModule,
  Pager,
  SimpleSliderComponent,
  SliderConfig,
} from 'ngx-edge-slider';
import { Observable, take } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule, NgxEdgeSliderModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  encapsulation: ViewEncapsulation.None,
})
export class App implements OnInit {
  slidesArray = [
    {
      image: 'https://obscene.me/assets/images/products/27/image-1/image-1.webp',
      caption: 'First Slide',
    },
    {
      image: 'https://obscene.me/assets/images/products/27/image-2/image-2.webp',
      caption: 'Second Slide',
    },
    {
      image: 'https://obscene.me/assets/images/products/27/image-3/image-3.webp',
      caption: 'Third Slide',
    },
    {
      image: 'https://obscene.me/assets/images/products/27/image-4/image-4.webp',
      caption: 'Fourth Slide',
    },
    {
      image: 'https://obscene.me/assets/images/products/27/image-3/image-3.webp',
      caption: 'Third Slide',
    },
    {
      image: 'https://obscene.me/assets/images/products/27/image-1/image-1.webp',
      caption: 'First Slide',
    },
    {
      image: 'https://obscene.me/assets/images/products/27/image-2/image-2.webp',
      caption: 'Second Slide',
    },
  ];

  private isSyncing = false;
  slides: any[] = [...this.slidesArray];

  sliderConfig!: SliderConfig;
  sliderConfigThumbs!: SliderConfig;

  navPosition: NavPosition = 'top-right'; // change this to switch layouts "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right" | "center-sides";

  @ViewChild('MainSlider') MainSlider!: SimpleSliderComponent;
  @ViewChild('ThumbsSlider') ThumbsSlider?: SimpleSliderComponent;

  constructor() {}

  ngOnInit(): void {
    this.sliderConfig = {
      slides: this.slides,
      slidesPerView: 1,
      slidesToSlide: 1,
      isThumbs: false,
      plugins: {
        draggable: true,
        pagination: true,
        navigation: true,
        autoplay: undefined,
      },
    };

    this.sliderConfigThumbs = {
      slides: this.slides,
      slidesPerView: 4, // desktop default
      slidesToSlide: 1,
      isThumbs: true,
      plugins: {
        pagination: true, // enable pagination
        navigation: true, // optional
        draggable: true, // optional
        autoplay: undefined,
      },
      showOn: { mobile: false, tablet: true, desktop: true },
      breakpoints: {
        mobile: { slidesPerView: 0 }, // not used because showOn.mobile=false
        tablet: { slidesPerView: 4 },
        desktop: { slidesPerView: 5 },
      },
    };
  }

  /** Sync sliders */
  onSlideChangeMain(index: number) {
    this.syncSliders(index);
  }
  onSlideChangeThumbs(index: number) {
    this.syncSliders(index);
  }
  onThumbClick(index: number) {
    this.syncSliders(index);
  }

  private syncSliders(index: number) {
    if (this.isSyncing) return;
    this.isSyncing = true;

    this.MainSlider?.goTo(index);
    this.ThumbsSlider?.goTo(index);

    this.isSyncing = false;
  }

  // GET SLIDER STATES
  get mainState$() {
    return this.MainSlider?.state$;
  }
  get thumbsState$() {
    return this.ThumbsSlider?.state$;
  }

  // NAVIGATION
  get canPrev$(): Observable<boolean> | null {
    if (!this.MainSlider || !this.MainSlider.canPrev$) {
      console.warn('Navigation plugin is not enabled for this slider.');
      return null;
    }
    return this.MainSlider.canPrev$;
  }

  get canNext$(): Observable<boolean> | null {
    if (!this.MainSlider || !this.MainSlider.canNext$) {
      console.warn('Navigation plugin is not enabled for this slider.');
      return null;
    }
    return this.MainSlider.canNext$;
  }

  onPrevClick(event?: MouseEvent) {
    event?.stopPropagation();
    event?.preventDefault();

    this.MainSlider?.canPrev$?.pipe(take(1)).subscribe((can) => {
      if (can) this.MainSlider.prev?.();
    });
  }

  onNextClick(event?: MouseEvent) {
    event?.stopPropagation();
    event?.preventDefault();

    this.MainSlider?.canNext$?.pipe(take(1)).subscribe((can) => {
      if (can) this.MainSlider.next?.();
    });
  }

  // PAGINATION
  get pager$(): Observable<Pager | null> | null {
    if (!this.MainSlider?.pager$) {
      console.warn('Pagination plugin is not enabled for this slider.');
      return null;
    }
    return this.MainSlider.pager$;
  }

  goToSlide(index: number) {
    this.MainSlider?.goToSlide?.(index);
  }

  protected readonly title = signal('slider-test');
}
