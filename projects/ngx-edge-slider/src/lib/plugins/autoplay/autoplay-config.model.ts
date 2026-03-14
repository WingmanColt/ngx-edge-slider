/* delay — milliseconds between each slide advance. Default 4000 = slides change every 4 seconds.

pauseOnHover — stops the timer when the mouse is over the slider, resumes when it leaves. Prevents the slider from advancing while the user is looking at or interacting with a slide.

pauseOnFocus — stops when any focusable element inside the slider receives focus (e.g. a button or link inside a slide). Important for keyboard and screen reader users — without this, the slide could disappear mid-interaction.

pauseOnDocumentHidden — stops when the user switches to another browser tab or minimizes the window, resumes when they come back. Prevents wasted CPU cycles and avoids the slider jumping multiple positions when the user returns.

disableOnInteraction — permanently kills autoplay the moment the user drags or clicks a slide. The assumption is: the user has taken manual control and doesn't want the slider moving on its own anymore. Unlike pause, it never resumes automatically — only a manual reset() call brings it back.

stopOnLastSlide — when the slider reaches the last real slide it stops and disables autoplay. Only meaningful when loop mode is off. Useful for onboarding flows or story sequences where you want to play through once and stop.

reverseDirection — calls engine.previous() on each tick instead of engine.next(), so the slider advances right-to-left instead of left-to-right.

waitForTransition — if a tick fires while the slide transition CSS animation is still running, it skips that tick instead of queuing another move. Prevents slides from stacking up and jumping if the transition is slow or the browser is under load. 
*/

export interface AutoplayPluginConfig {
  delay?: number;
  pauseOnHover?: boolean;
  pauseOnFocus?: boolean;
  pauseOnDocumentHidden?: boolean;
  disableOnInteraction?: boolean;
  stopOnLastSlide?: boolean;
  reverseDirection?: boolean;
  waitForTransition?: boolean;
}
