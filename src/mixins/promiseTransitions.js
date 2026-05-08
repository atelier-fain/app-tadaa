let transitionState = Promise.resolve();
let resolveTransition = null;

/**
 * Call this before the leave phase of the transition
 */
export function transitionOut() {
  transitionState = new Promise((resolve) => {
    resolveTransition = resolve;
  });
}

/**
 * Call this in the enter phase of the transition
 */
export function transitionIn() {
  if (resolveTransition) {
    resolveTransition();
    resolveTransition = null;
  }
}

/**
 * Await this in scrollBehavior
 */
export function pageTransition() {
  return transitionState;
}
