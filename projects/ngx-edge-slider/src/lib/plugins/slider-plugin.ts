import { SliderEngine } from "../engine/slider-engine.service";

export type NavPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right" | "center-sides";
export interface Pager {
  visibleDots: number[];
  activeDotIndex: number;
}

export interface SliderPlugin {
  init?(engine: SliderEngine): void;
  destroy?(): void;

  onNext?(): void;
  onPrevious?(): void;
  onSlideClick?(index: number): void;

  onDragStart?(event: PointerEvent): void;
  onDragMove?(event: PointerEvent): void;
  onDragEnd?(): void;
}
