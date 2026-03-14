import { AutoplayPluginConfig } from "../plugins/autoplay/autoplay-config.model";

export interface SliderPluginConfig {
  draggable?: boolean;
  autoplay?: AutoplayPluginConfig | false;
  navigation?: boolean;
  pagination?: boolean;
}
export interface SliderConfig {
  slides: any[];
  slidesPerView: number;
  slidesToSlide?: number;
  loop?: 0 | 1 | 2;
  vertical?: boolean;
  changeToClickedSlide?: boolean;
  isThumbs?: boolean;

  /** NEW: gap between slides in px */
  gap?: number;

  breakpoints?: {
    mobile?: Partial<SliderConfig>;
    tablet?: Partial<SliderConfig>;
    desktop?: Partial<SliderConfig>;
  };

  plugins?: SliderPluginConfig;

  showOn?: {
    mobile?: boolean;
    tablet?: boolean;
    desktop?: boolean;
  };
}

export const DEFAULT_CONFIG: SliderConfig = {
  slides: [],
  slidesPerView: 1,
  slidesToSlide: 1,
  loop: 0,
  vertical: false,
  changeToClickedSlide: false,
  isThumbs: false,
  plugins: {
    draggable: false,
    pagination: false,
    navigation: false,
    autoplay: undefined,
  },
  gap: 0,

  showOn: { mobile: true, tablet: true, desktop: true },
};
