/**
 * Easing Functions
 * Collection of easing functions for smooth animations
 */

/**
 * Linear easing (no easing)
 */
export function linear(t) {
  return t;
}

/**
 * Ease in cubic
 */
export function easeInCubic(t) {
  return t * t * t;
}

/**
 * Ease out cubic
 */
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Ease in-out cubic (smooth acceleration and deceleration)
 */
export function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Ease in quadratic
 */
export function easeInQuad(t) {
  return t * t;
}

/**
 * Ease out quadratic
 */
export function easeOutQuad(t) {
  return t * (2 - t);
}

/**
 * Ease in-out quadratic
 */
export function easeInOutQuad(t) {
  return t < 0.5
    ? 2 * t * t
    : -1 + (4 - 2 * t) * t;
}

/**
 * Ease in sine
 */
export function easeInSine(t) {
  return 1 - Math.cos((t * Math.PI) / 2);
}

/**
 * Ease out sine
 */
export function easeOutSine(t) {
  return Math.sin((t * Math.PI) / 2);
}

/**
 * Ease in-out sine
 */
export function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/**
 * Ease in exponential
 */
export function easeInExpo(t) {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
}

/**
 * Ease out exponential
 */
export function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Ease in-out exponential
 */
export function easeInOutExpo(t) {
  return t === 0
    ? 0
    : t === 1
    ? 1
    : t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2;
}

/**
 * Elastic ease out (bouncy effect)
 */
export function easeOutElastic(t) {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

/**
 * Bounce ease out
 */
export function easeOutBounce(t) {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

// Default easing function for the particle engine
export const defaultEasing = easeInOutCubic;
