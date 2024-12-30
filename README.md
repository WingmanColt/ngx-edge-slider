https://youtu.be/tGZ5qX70KU0
Live demo: https://hellauto.com -> All sliders works on same code.


Edge Slider - A Flexible & Customizable Angular Slider Component
Edge Slider is a highly flexible and customizable slider component designed for Angular applications. It offers an intuitive interface to manage slides, providing smooth transitions, autoplay functionality, responsive design, and interactive features like draggable slides and configurable navigation. Perfect for creating engaging image galleries, product carousels, content sliders, and more!

Features:
Customizable Slide Configurations: Easily control slide behavior, width, autoplay, loop, and more.
Draggable: Enable users to manually drag slides for a more interactive experience.
Autoplay: Automatically transition between slides with configurable delay times.
Slide Navigation & Pagination: Add navigation arrows and pagination dots, with customizable positions.
Responsive Design: Customize behavior across devices (mobile, tablet, desktop) with breakpoint configurations.
Vertical/Horizontal Mode: Supports both vertical and horizontal slide orientations with smooth transitions.
Customizable Titles: Add and position titles for each slide.
Flexible Navigation: Enable navigation buttons with hover effects.
Configurable Breakpoints: Tailor slide behavior based on screen size for optimal display on any device.
SlideConfig Object:
The SlideConfig object allows you to define various slider settings:

title: Optional title for each slide.
titlePosition: Customize the position of the slide title.
draggable: Enable/disable draggable functionality.
slides: An array of slides to display in the slider.
slidesToSlide: The number of slides to move at once during navigation.
slideChangeDelay: Time delay (in milliseconds) between slide transitions.
slidesPerView: Number of slides visible at once.
slideWidth: Optionally customize the width of each slide.
changeToClickedSlide: Automatically navigate to the clicked slide.
autoPlay: Enable automatic slide transitions.
delay: Time in milliseconds between autoplay transitions.
loop: Set the number of times to loop the slides (set to 0 for infinite looping).
vertical: If set to true, slides are displayed vertically.
navEnabled: Enable navigation arrows.
navPosition: Set the position of navigation arrows.
navHoverable: If true, arrows appear only on hover.
paginationEnabled: Enable pagination dots.
paginationPosition: Position for pagination dots.
breakpoints: Define configurations for different screen sizes (mobile, tablet, desktop).
Responsive Support:
This component includes responsive settings to ensure optimal performance across devices:

Mobile (mobile): Custom configurations for mobile devices.
Tablet (tablet): Tailored settings for tablet-sized screens.
Desktop (desktop): Adjustments for desktop displays.
Usage Example:
To integrate the Edge Slider component in your Angular 17+ application, follow these steps:

1. Import the Module:
In your app.module.ts (or the module where you want to use the slider), import the EdgeSliderModule:

import { EdgeSliderModule } from '@your-username/edge-slider';

@NgModule({
  imports: [EdgeSliderModule],
  // other configurations...
})
export class AppModule { }


2. Component HTML:
Add the lib-ngx-edge-slider component to your template. Here’s how you can initialize it:

<!-- Initialize EdgeSlider component -->
<lib-ngx-edge-slider *ngIf="sliderConfig.slides?.length"
    [config]="sliderConfig" 
    id="EdgeSlider"
    [slideTemplate]="EdgeSliderTemplate" 
    (onSlideChange)="onSlideChange($event)">
</lib-ngx-edge-slider>

<!-- Define the slide template -->
<ng-template #EdgeSliderTemplate let-slide="slide" let-index="currentSlide">
    <!-- Template rendering logic -->
    <img [src]="slide.image" alt="Slide image">
</ng-template>
3. Component TypeScript:
In your TypeScript file, define the slider configuration and handle slide change events:

import { Component } from '@angular/core';
import { SlideConfig } from '@your-username/edge-slider'; // Import your library

@Component({
  selector: 'app-your-component',
  templateUrl: './your-component.component.html',
  styleUrls: ['./your-component.component.css'],
})
export class YourComponent {
  sliderConfig: SlideConfig = new SlideConfig({
    slides: [
      { id: 1, image: 'path_to_image_1.jpg' },
      { id: 2, image: 'path_to_image_2.jpg' },
      { id: 3, image: 'path_to_image_3.jpg' },
    ],
    autoPlay: true,
    delay: 3000,
    loop: 0, // Infinite loop
    slidesToSlide: 1,
    slidesPerView: 1,
    navEnabled: true,
    paginationEnabled: true,
  });

  // Handle slide change event
  onSlideChange(event: any): void {
    console.log('Slide changed to: ', event);
  }
}

Summary:
Edge Slider provides a powerful, easy-to-integrate solution for creating responsive and interactive sliders in Angular applications. With features like autoplay, custom navigation, draggable slides, and responsive configurations, it's ideal for building engaging image galleries, carousels, content sliders, and more.
