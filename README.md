Edge Slider is a flexible and customizable slider component for Angular applications. It offers an intuitive interface to manage slides with various configurable options, enabling smooth transitions, autoplay, and responsive design. This component is ideal for creating interactive image galleries, product carousels, content sliders, and more.

Features:
Customizable Slide Configurations: Easily control slide behavior, width, autoplay, loop, and more.
Draggable: Allow users to manually drag slides for an interactive experience.
Autoplay: Set an automatic slideshow with configurable delay time.
Slide Navigation & Pagination: Enable navigation arrows and pagination with customizable positions.
Responsive Design: Configure different breakpoints for mobile, tablet, and desktop to ensure your slider works well across devices.
Vertical/Horizontal Mode: Support for both vertical and horizontal slides, with smooth transitions.
Customizable Title: Add and position titles for each slide.
Flexible Navigation: Easily enable navigation buttons with hover effect support.
Configurable Breakpoints: Tailor slide behavior and appearance at different screen sizes for optimal performance on all devices.
SlideConfig Object:
title: Optional title for each slide.
titlePosition: Customize the position of the slide title.
draggable: Enable or disable draggable functionality.
slides: The array of slides to be displayed.
slidesToSlide: Number of slides to move when navigating.
slideChangeDelay: Time delay (in milliseconds) between slide transitions.
slidesPerView: Number of slides visible at a time.
slideWidth: Optional custom width for each slide.
changeToClickedSlide: Automatically change to the clicked slide.
autoPlay: Enable automatic slide transitions.
delay: Delay in milliseconds between slides when autoplay is enabled.
loop: Number of times the slides will loop. Set to 0 for infinite looping.
vertical: If set to true, the slider will display slides vertically.
navEnabled: Enable navigation arrows.
navPosition: Position of the navigation arrows.
navHoverable: If true, navigation arrows will be visible only on hover.
paginationEnabled: Enable pagination dots.
paginationPosition: Position of the pagination dots.
breakpoints: Define slide configuration based on breakpoints for responsive behavior (mobile, tablet, desktop).
Responsive Support:
Configure the slider's behavior for different screen sizes using breakpoints. The library allows customization for:

Mobile (mobile): Custom slide configuration for mobile devices.
Tablet (tablet): Tailored configuration for tablet-sized screens.
Desktop (desktop): Adjustments for desktop layouts.
Usage Example:
To use the Edge Slider in your Angular 17+ application, follow the steps below:

Import the Module: First, import the EdgeSliderModule into your AppModule or the module where you want to use the slider.
typescript
Copy code
import { EdgeSliderModule } from '@your-username/edge-slider';

@NgModule({
  imports: [EdgeSliderModule],
  // other configurations...
})
export class AppModule { }
Component HTML: You can use the lib-ngx-edge-slider component in your template. Here's how to initialize it in your Angular component.

<!-- Initialize EdgeSlider component in your template -->
<lib-ngx-edge-slider *ngIf="sliderConfig.slides?.length"
    [config]="sliderConfig" 
    id="EdgeSlider"
    [slideTemplate]="EdgeSliderTemplate" 
    (onSlideChange)="onSlideChange($event)">
</lib-ngx-edge-slider>

<!-- Define the template for the slides -->
<ng-template #EdgeSliderTemplate let-slide="slide" let-index="currentSlide">
    <!-- Template rendering logic here -->
    <!-- 'slide' is our entity, and its properties can be accessed, like slide.id, slide.image -->
    <img [src]="slide.image" alt="Slide image">
</ng-template>

Component TypeScript: In your component's .ts file, define the sliderConfig with the desired slide settings, and create an onSlideChange handler for capturing slide change events.
typescript

import { Component } from '@angular/core';
import { SlideConfig } from '@your-username/edge-slider'; // Import your library

@Component({
  selector: 'app-your-component',
  templateUrl: './your-component.component.html',
  styleUrls: ['./your-component.component.css'],
})
export class YourComponent {
  // Define the slider configuration
  sliderConfig: SlideConfig = new SlideConfig({
    slides: [
      { id: 1, image: 'path_to_image_1.jpg' },
      { id: 2, image: 'path_to_image_2.jpg' },
      { id: 3, image: 'path_to_image_3.jpg' },
    ],
    autoPlay: true,
    delay: 3000, // Set autoplay delay
    loop: 0, // Infinite loop
    slidesToSlide: 1,
    slidesPerView: 1,
    navEnabled: true, // Enable navigation
    paginationEnabled: true, // Enable pagination dots
  });

  // Handle slide change event
  onSlideChange(event: any): void {
    console.log('Slide changed to: ', event);
  }
}

Summary
This package provides an easy-to-integrate, flexible Angular component for building interactive and responsive sliders. With options for autoplay, navigation, pagination, and breakpoints, it adapts to various use cases, making it a powerful tool for displaying image galleries, content carousels, and more.