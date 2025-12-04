// ───────────────────────────────────────────────────────────────
//  ABSOLUTE UI SHIELD
//  Any element you give class="ui-layer" is UNCLICKABLE by the
//  game. We intercept in the *capture* phase, stop ALL propagation,
//  and preventDefault – covering every browser.
// ───────────────────────────────────────────────────────────────
export function blockUiClicks(): void {
  document.querySelectorAll('.ui-layer').forEach(el => {
    ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach(type => {
      el.addEventListener(
        type,
        e => {
          e.preventDefault();
          e.stopImmediatePropagation();
        },
        { capture: true }
      );
    });
  });
}