import { Injectable } from "@angular/core";
import { SliderPlugin } from "../slider-plugin";
import { SliderEngine } from "../../engine/slider-engine.service";
import { AutoplayPluginConfig } from "./autoplay-config.model";

@Injectable()
export class SliderAutoplayPlugin implements SliderPlugin {
  requiresLoop = true;

  private engine!: SliderEngine;
  private config: AutoplayPluginConfig = {};
  private timerId: any = null;
  private disabled = false; // permanently off after interaction (disableOnInteraction)
  private pauseReasons = new Set<string>(); // named pause sources — all must clear to resume

  // DOM listeners we need to remove on destroy
  private containerEl?: HTMLElement;
  private onMouseEnter = () => this.pause("hover");
  private onMouseLeave = () => this.resume("hover");
  private onFocusIn = () => this.pause("focus");
  private onFocusOut = () => this.resume("focus");
  private onVisibility = () => {
    if (document.hidden) {
      this.pause("visibility");
    } else {
      this.resume("visibility");
    }
  };

  // ─── SliderPlugin lifecycle ──────────────────────────────────────────────

  init(engine: SliderEngine) {
    this.engine = engine;
    // Don't start yet — setConfig() is called right after by resolvePlugins
  }

  setConfig(cfg: AutoplayPluginConfig = {}) {
    this.config = {
      delay: 4000,
      pauseOnHover: true,
      pauseOnFocus: true,
      pauseOnDocumentHidden: true,
      disableOnInteraction: false,
      stopOnLastSlide: false,
      reverseDirection: false,
      waitForTransition: false,
      ...cfg,
    };

    this.start();
  }

  onContainerAttached() {
    // Container is guaranteed to exist now — safe to attach all DOM listeners
    this.attachDomListeners();
  }
  onDragStart() {
    if (this.config.disableOnInteraction) {
      this.disable();
    } else {
      this.pause("drag");
    }
  }

  onDragEnd() {
    if (!this.config.disableOnInteraction) {
      this.resume("drag");
    }
  }

  onSlideClick() {
    if (this.config.disableOnInteraction) {
      this.disable();
    }
  }

  destroy() {
    this.stop();
    this.detachDomListeners();
  }

  // ─── Public control ──────────────────────────────────────────────────────

  /** Permanently stop — won't restart unless reset() is called */
  disable() {
    this.disabled = true;
    this.stop();
  }

  reset() {
    this.disabled = false;
    this.pauseReasons.clear();
    this.start();
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private pause(reason: string) {
    this.pauseReasons.add(reason);
    this.stop();
  }

  private resume(reason: string) {
    this.pauseReasons.delete(reason);
    if (!this.disabled && this.pauseReasons.size === 0) {
      this.start();
    }
  }

  private start() {
    if (this.disabled || !this.engine) return;
    this.stop();
    this.timerId = setInterval(() => this.tick(), this.config.delay ?? 4000);
  }

  private stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private tick() {
    if (this.config.waitForTransition && this.engine.getState().isAnimating) {
      return; // skip this tick — transition still running
    }

    if (this.config.stopOnLastSlide) {
      const state = this.engine.getState();
      const totalReal = this.engine.getConfig().slides?.length ?? 0;
      const isLast = state.currentSlide >= totalReal - 1;
      if (isLast) {
        this.disable();
        return;
      }
    }

    if (this.config.reverseDirection) {
      this.engine.previous();
    } else {
      this.engine.next();
    }
  }

  private attachDomListeners() {
    this.detachDomListeners(); // clean up any previous listeners first

    this.containerEl = this.engine.getContainerEl();
    if (!this.containerEl) return;

    if (this.config.pauseOnHover) {
      this.containerEl.addEventListener("mouseenter", this.onMouseEnter);
      this.containerEl.addEventListener("mouseleave", this.onMouseLeave);
    }

    if (this.config.pauseOnFocus) {
      this.containerEl.addEventListener("focusin", this.onFocusIn);
      this.containerEl.addEventListener("focusout", this.onFocusOut);
    }

    if (this.config.pauseOnDocumentHidden) {
      document.addEventListener("visibilitychange", this.onVisibility);
    }
  }

  private detachDomListeners() {
    if (this.containerEl) {
      this.containerEl.removeEventListener("mouseenter", this.onMouseEnter);
      this.containerEl.removeEventListener("mouseleave", this.onMouseLeave);
      this.containerEl.removeEventListener("focusin", this.onFocusIn);
      this.containerEl.removeEventListener("focusout", this.onFocusOut);
      this.containerEl = undefined;
    }
    document.removeEventListener("visibilitychange", this.onVisibility);
  }
}
