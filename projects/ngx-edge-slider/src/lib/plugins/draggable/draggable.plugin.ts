import { Injectable } from "@angular/core";
import { SliderPlugin } from "../slider-plugin";
import { SliderEngine } from "../../engine/slider-engine.service";

@Injectable()
export class SliderDraggablePlugin implements SliderPlugin {
  private engine!: SliderEngine;
  private startX = 0;
  private startY = 0; // ← add
  private deltaX = 0;
  private hasDragged = false;
  private isDragging = false;
  private isHorizontalDrag: boolean | null = null; // ← null = undecided
  private readonly dragThreshold = 50;
  private readonly directionLockThreshold = 8; // px before we decide axis

  public get isDraggingPointer(): boolean {
    return this.isDragging;
  }

  init(engine: SliderEngine) {
    this.engine = engine;
  }

  onDragStart(event: PointerEvent) {
    this.startX = event.clientX;
    this.startY = event.clientY; // ← add
    this.deltaX = 0;
    this.hasDragged = false;
    this.isDragging = true;
    this.isHorizontalDrag = null; // ← reset axis lock

    this.engine.setState({ isDragging: true });
  }

  onDragMove(event: PointerEvent): boolean {
    if (!this.isDragging) return false;

    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    // Axis not yet decided — wait for threshold
    if (this.isHorizontalDrag === null) {
      if (Math.abs(dx) < this.directionLockThreshold && Math.abs(dy) < this.directionLockThreshold) {
        return false; // not enough movement to decide yet
      }
      this.isHorizontalDrag = Math.abs(dx) > Math.abs(dy);
    }

    // Vertical intent — let browser scroll, abort drag
    if (!this.isHorizontalDrag) {
      this.cancelDrag();
      return false;
    }

    // Horizontal drag — block scroll and move slider
    event.preventDefault();

    const moveX = event.clientX - this.startX;
    this.deltaX += moveX;
    this.hasDragged = true;

    const currentTranslate = this.extractTranslate(this.engine.getState().translate);
    const newTranslate = currentTranslate + moveX;

    this.engine.setState({ translate: `translateX(${newTranslate}px)` });

    this.startX = event.clientX;
    this.startY = event.clientY; // ← keep Y in sync too
    return true;
  }

  onDragEnd() {
    if (this.hasDragged && this.isHorizontalDrag) {
      if (this.deltaX > this.dragThreshold) {
        this.engine.previous();
      } else if (this.deltaX < -this.dragThreshold) {
        this.engine.next();
      } else {
        this.engine.recalculate();
      }
    }

    this.resetState();
  }

  private cancelDrag(): void {
    this.engine.recalculate(); // snap back if partially moved
    this.resetState();
  }

  private resetState(): void {
    this.isDragging = false;
    this.hasDragged = false;
    this.deltaX = 0;
    this.isHorizontalDrag = null;
    this.engine.setState({ isDragging: false });
  }

  private extractTranslate(transform: string | undefined): number {
    if (!transform) return 0;
    const match = transform.match(/-?\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  }
}
