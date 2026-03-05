# WingmanColt Angular Slider

A modern, fully reactive, plugin‑driven **Angular slider / carousel library** built for **Angular 18+**.

Main Slider (3 rendered sliders on homepage):
https://obscene.me/

Main Slider + Thumb Slider :
https://obscene.me/shop/product/the-devil



Stackblitz:
https://stackblitz.com/edit/angular-rx83vkhm?file=src%2Fmain.ts


WingmanColt is designed for **production‑grade UI systems** where flexibility, performance, and clean architecture matter. It supports **dragging**, **pagination**, **navigation**, **autoplay**, **responsive breakpoints**, and **synced thumbnail sliders**, all powered by a small, predictable core engine.

---

## ✨ Features

- ✅ Angular **18+** compatible (Standalone components)
- ⚡ **RxJS‑driven state** (predictable & debuggable)
- 🧩 **Plugin architecture** (enable only what you need)
- 🖱️ Pointer‑based dragging (mouse + touch)
- 📱 Responsive breakpoints (container‑aware)
- 🧭 Navigation arrows
- 🔘 Pagination (dots)
- ▶️ Autoplay (configurable)
- 🖼️ **Main + Thumbs slider syncing**
- 📐 Vertical & horizontal modes
- 🎯 Click‑to‑select slides
- ♻️ Safe re‑initialization on data changes

---

## 📦 Installation

```bash
npm install ngx-edge-slider
```

> Angular **18 or newer** is required.

---

## 🚀 Quick Start

### 1️⃣ Import the module

```ts
import { NgxEdgeSliderModule } from "ngx-edge-slider";

@Component({
  standalone: true,
  imports: [NgxEdgeSliderModule],
})
export class AppComponent {}
```

Or use as standalone
```ts
@Component({
  selector: 'app-root',
  imports: [CommonModule, NgxEdgeSliderModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  encapsulation: ViewEncapsulation.None,
})
```


---
### Import Style

```css
@import 'ngx-edge-slider/assets/ngx-simple-slider.scss';
OR
@import 'ngx-edge-slider/assets/ngx-simple-slider.css';

OR USE CDN

<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/WingmanColt/ngx-edge-slider@master/projects/ngx-edge-slider/assets/ngx-simple-slider.scss"/>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/WingmanColt/ngx-edge-slider@master/projects/ngx-edge-slider/assets/ngx-simple-slider.css"/>

```


---

### 2️⃣ Basic Slider Usage

```html
<app-simple-slider  #MainSlider [config]="sliderConfig"  [slideTemplate]="mainSlideTemplate" (slideChange)="onSlideChange($event)"></app-simple-slider>

      <ng-template #mainSlideTemplate let-slide="slide" let-index="index">
        <div class="slide-content">
          <img [src]="slide.image" alt="Slide {{ index + 1 }}" />
        </div>
      </ng-template>
```

```ts
sliderConfig: SliderConfig = {
  slides: this.slides,
  slidesPerView: 1,
  plugins: {
    draggable: true,
    pagination: true,
    navigation: true,
  },
};
```

---

## 🧱 Slider Templates

Slider is **template‑driven**. You fully control slide markup.

```html
<app-simple-slider [config]="sliderConfig" [slideTemplate]="slideTpl"></app-simple-slider>

<ng-template #slideTpl let-slide let-index="index">
  <img [src]="slide.image" />
</ng-template>
```

---

## Full Component with MainSlider, ThumbSlider Pagination, Navigation


```html

  <ng-container *ngIf="this.slides.length">
    <div class="slider-container" style="position: relative">
      <app-simple-slider
        #MainSlider
        [config]="sliderConfig"
        class="slider-main-product"
        [slideTemplate]="mainSlideTemplate"
        (slideChange)="onSlideChangeMain($event)"
      >
      </app-simple-slider>

      <ng-template #mainSlideTemplate let-slide="slide" let-index="index">
        <div class="slide-content">
          <img [src]="slide.image" alt="Slide {{ index + 1 }}" />
        </div>
      </ng-template>

      <!-- NAVIGATION -->
      <div class="slider-nav" [ngClass]="'nav--' + navPosition">
        <button
          type="button"
          class="nav-btn nav-btn--prev"
          [class.is-hidden]="!(canPrev$ | async)"
          (click)="onPrevClick($event)"
          aria-label="Previous"
        >
          <
        </button>

        <button
          type="button"
          class="nav-btn nav-btn--next"
          [class.is-hidden]="!(canNext$ | async)"
          (click)="onNextClick($event)"
          aria-label="Next"
        >
          >
        </button>
      </div>
      <ng-container *ngIf="pager$ | async as pager">
        <div class="slider-pagination" *ngIf="pager">
          <div class="thumb-dots-wrapper">
            <div
              *ngFor="let slideIndex of pager.visibleDots; let i = index"
              (click)="goToSlide(slideIndex)"
            >
              <span
                class="thumb-dot"
                [class.active]="slideIndex === pager.visibleDots[pager.activeDotIndex]"
                [class.inactive]="slideIndex !== pager.visibleDots[pager.activeDotIndex]"
              ></span>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  </ng-container>

  <!-- Thumbs Slider -->
  <ng-container *ngIf="sliderConfigThumbs?.slides?.length">
    <div class="thumbs-wrapper">
      <div
        class="thumb-nav thumb-nav--left"
        [class.activeArrow]="(thumbsState$ | async)?.canPrev"
        (click)="ThumbsSlider?.prev()"
      ></div>
      <app-simple-slider
        #ThumbsSlider
        [config]="sliderConfigThumbs"
        [slideTemplate]="ThumbsSlideTemplate"
      ></app-simple-slider>

      <ng-template #ThumbsSlideTemplate let-slide="slide" let-index="index">
        <div
          class="slide-content"
          [class.slide--current]="(thumbsState$ | async)?.selectedSlide === index"
          (click)="onThumbClick(index)"
        >
          <img [src]="slide.image" alt="Slide {{ index + 1 }}" />
        </div>
      </ng-template>

      <div
        class="thumb-nav thumb-nav--right"
        [class.activeArrow]="(thumbsState$ | async)?.canNext"
        (click)="ThumbsSlider?.next()"
      ></div>
    </div>
  </ng-container>


```

---

---

## Full TS File

```ts
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

```
----

## 🔧 SliderConfig Reference

```ts
export interface SliderConfig {
  slides: any[];
  slidesPerView: number;
  slidesToSlide?: number;
  loop?: 0 | 1 | 2;
  vertical?: boolean;
  changeToClickedSlide?: boolean;
  isThumbs?: boolean;
  gap?: number;

  breakpoints?: {
    mobile?: Partial<SliderConfig>;
    tablet?: Partial<SliderConfig>;
    desktop?: Partial<SliderConfig>;
  };

  plugins?: {
    draggable?: boolean;
    autoplay?: { delay?: number };
    navigation?: boolean;
    pagination?: boolean;
  };

  showOn?: {
    mobile?: boolean;
    tablet?: boolean;
    desktop?: boolean;
  };
}
```

---

## 🔌 Plugins

Plugins are **opt‑in**. Only enabled plugins are initialized.

### Draggable

```ts
plugins: {
  draggable: true;
}
```

- Mouse + touch dragging
- Pointer capture outside slider bounds

---

### Navigation

```ts
plugins: {
  navigation: true;
}
```

```html
<button (click)="slider.prev()">Prev</button>
<button (click)="slider.next()">Next</button>
```

Reactive state:

```ts
slider.canPrev$;
slider.canNext$;
```

---

### Pagination

```ts
plugins: {
  pagination: true;
}
```

```ts
slider.pager$; // Observable<Pager>
```

Pager structure:

```ts
interface Pager {
  currentPage: number;
  totalPages: number;
  visibleDots: number[];
  activeDotIndex: number;
}
```

---

### Autoplay

```ts
plugins: {
  autoplay: {
    delay: 3000;
  }
}
```

- Automatically pauses during dragging
- Resumes safely

---

## 🖼️ Thumbnails Slider (Main + Thumbs)

WingmanColt supports **fully synced sliders**.

```html
<app-simple-slider #MainSlider [config]="mainConfig" (slideChange)="onMainChange($event)"></app-simple-slider>

<app-simple-slider #ThumbsSlider [config]="thumbsConfig"></app-simple-slider>
```

```ts
onMainChange(index: number) {
  this.MainSlider.goTo(index);
  this.ThumbsSlider.goTo(index);
}
```

Thumbs config example:

```ts
thumbsConfig = {
  slides,
  slidesPerView: 5,
  isThumbs: true,
  plugins: { draggable: true, navigation: true },
  breakpoints: {
    tablet: { slidesPerView: 4 },
    desktop: { slidesPerView: 5 },
  },
};
```

---

## 📐 Responsive Breakpoints

Breakpoints are **container‑aware**, not just viewport‑based.

```ts
breakpoints: {
  mobile: { slidesPerView: 1 },
  tablet: { slidesPerView: 2 },
  desktop: { slidesPerView: 4 }
}
```

Visibility control:

```ts
showOn: {
  mobile: false,
  tablet: true,
  desktop: true
}
```

---

## 🧠 Architecture Overview

- **SliderEngine** – core logic, movement, breakpoints
- **SliderStore** – RxJS state container
- **Plugins** – isolated feature modules
- **SimpleSliderComponent** – UI wrapper

This separation allows:

- Easy feature expansion
- Predictable state transitions
- Minimal DOM coupling

---

## ♻️ Lifecycle & Reinitialization

The slider safely re‑initializes when:

- Slides array reference changes
- Breakpoints change
- Container size changes

```ts
this.engine.destroy();
this.engine.init(newConfig);
```

---

## 🛠️ Requirements

- Angular **18+**
- RxJS **7+**
- Browser support for `ResizeObserver`

---

## 🧪 Status

WingmanColt is **production‑ready**, actively evolving, and designed for real‑world applications.

Planned enhancements:

- ⏩ Loop modes
- 🎞️ Animation presets
- ♿ Accessibility helpers
- 🔄 Virtual slides

---

## 📄 License

MIT

---

## 👤 Author

**WingmanColt**
Angular & Full‑Stack Engineer

---

If you find this library useful, ⭐️ the repository and feel free to contribute.
