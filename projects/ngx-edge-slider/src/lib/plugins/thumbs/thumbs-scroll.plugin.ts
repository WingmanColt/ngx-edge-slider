import { Injectable } from "@angular/core";
import { SliderPlugin } from "../slider-plugin";
import { SliderEngine } from "../../engine/slider-engine.service";

@Injectable()
export class SliderThumbsScrollPlugin implements SliderPlugin {
  private engine!: SliderEngine;
  private startX = 0;
  private deltaX = 0;
  private hasDragged = false;

  init(engine: SliderEngine) {
    this.engine = engine;
  }

  onDragStart(event: PointerEvent) {
    this.startX = event.clientX;
    this.deltaX = 0;
    this.hasDragged = false;
  }

  onDragMove(event: PointerEvent) {
    this.deltaX = event.clientX - this.startX;
    if (Math.abs(this.deltaX) > 2) { // more sensitive for thumbnails
      this.hasDragged = true;
      // Scroll the visible slides proportionally
      const slidesPerView = this.engine.getConfig().slidesPerView;
      const step = (this.deltaX / slidesPerView); // movement per slide
      const maxIndex = this.engine.getConfig().slides.length - this.engine.getConfig().slidesPerView;
      const newIndex = Math.round(this.engine.getState().currentSlide - step);
      this.engine.setState({ currentSlide: Math.max(0, Math.min(newIndex, maxIndex)) });

    }
  }

  onDragEnd() {
    this.deltaX = 0;
    this.hasDragged = false;
  }
}
