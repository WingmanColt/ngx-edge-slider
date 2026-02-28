import { Injectable } from "@angular/core";
import { SliderPlugin } from "../slider-plugin";
import { SliderEngine } from "../../engine/slider-engine.service";

@Injectable()
export class SliderDraggablePlugin implements SliderPlugin {
  private engine!: SliderEngine;
  private startX = 0;
  private deltaX = 0;
  private hasDragged = false;
  private isDragging = false;
  private readonly dragThreshold = 50;

  // Expose drag state to template
  public get isDraggingPointer(): boolean {
    return this.isDragging;
  }

  init(engine: SliderEngine) {
    this.engine = engine;
  }

  onDragStart(event: PointerEvent) {
    this.startX = event.clientX;
    this.deltaX = 0;
    this.hasDragged = false;
    this.isDragging = true;

    // Set engine dragging state
    this.engine.setState({ isDragging: true });
  }

  onDragMove(event: PointerEvent) {
    if (!this.isDragging) return;

    const moveX = event.clientX - this.startX;
    this.deltaX += moveX;
    this.hasDragged = true;

    const currentTranslate = this.extractTranslate(this.engine.getState().translate);
    const newTranslate = currentTranslate + moveX;

    this.engine.setState({ translate: `translateX(${newTranslate}px)` });

    this.startX = event.clientX;
  }

  onDragEnd() {
    if (this.hasDragged) {
      if (this.deltaX > this.dragThreshold) {
        this.engine.previous();
      } else if (this.deltaX < -this.dragThreshold) {
        this.engine.next();
      } else {
        // Small drag → snap back
        this.engine.recalculate();
      }
    }

    this.isDragging = false;
    this.hasDragged = false;
    this.deltaX = 0;

    this.engine.setState({ isDragging: false });
  }

  /** Extract numeric value from 'translateX(-123px)' */
  private extractTranslate(transform: string | undefined): number {
    if (!transform) return 0;
    const match = transform.match(/-?\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  }
}
