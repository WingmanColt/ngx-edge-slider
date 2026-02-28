import { Injectable } from "@angular/core";
import { SliderPlugin } from "../slider-plugin";
import { SliderEngine } from "../../engine/slider-engine.service";
import { AutoplayPluginConfig } from "../../models/slider-config.model";
@Injectable()
export class SliderAutoplayPlugin implements SliderPlugin {
  private engine!: SliderEngine;
  private timerId: any;
  private delay = 4000; // default

  init(engine: SliderEngine) {
    this.engine = engine;
    this.start();
  }

  setConfig(config?: AutoplayPluginConfig) {
    if (!config) return;

    if (typeof config.delay === "number") {
      this.delay = config.delay;
    }

    // restart autoplay with new config
    this.start();
  }

  onDragStart() {
    this.stop();
  }

  onDragEnd() {
    this.start();
  }

  private start() {
    this.stop();
    this.timerId = setInterval(() => {
      this.engine.next();
    }, this.delay);
  }

  private stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  destroy() {
    this.stop();
  }
}
