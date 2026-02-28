import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[appSimpleSlider]'
})
export class SimpleSliderDirective {
  @Input('appSimpleSlider') config: any;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    // Apply configurations or animations as needed
    this.el.nativeElement.style.transition = `transform ${this.config.delay || 500}ms ease`;
  }
}
