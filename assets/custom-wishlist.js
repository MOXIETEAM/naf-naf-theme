import { Component } from '@theme/component';

/**
 * MOXIE: wishlist toggle button for the product card. Only the UI/ARIA state is wired
 * up for now — toggleWishlist() is a stub. The real persistence logic (localStorage,
 * already built on another NafNaf store) gets connected here once migrated.
 *
 * @typedef {object} Refs
 * @property {HTMLButtonElement} button
 *
 * @extends Component<Refs>
 */
export class WishlistButton extends Component {
  requiredRefs = ['button'];

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener(WishlistChangeEvent.eventName, this.#handleExternalChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener(WishlistChangeEvent.eventName, this.#handleExternalChange);
  }

  toggleWishlist = () => {
    const active = this.refs.button.getAttribute('aria-pressed') !== 'true';
    this.#setActive(active);

    // TODO: reemplazar por la persistencia real (localStorage) al migrar la wishlist.
    document.dispatchEvent(new WishlistChangeEvent(this.productId, active));
  };

  /**
   * Keeps the mobile and desktop instances of the same product in sync.
   * @param {WishlistChangeEvent} event
   */
  #handleExternalChange = (event) => {
    if (event.productId !== this.productId) return;
    this.#setActive(event.active);
  };

  /**
   * @param {boolean} active
   */
  #setActive(active) {
    this.refs.button.setAttribute('aria-pressed', String(active));
  }

  get productId() {
    return this.dataset.productId ?? '';
  }
}

export class WishlistChangeEvent extends CustomEvent {
  /**
   * @param {string} productId
   * @param {boolean} active
   */
  constructor(productId, active) {
    super(WishlistChangeEvent.eventName, { bubbles: true });
    this.productId = productId;
    this.active = active;
  }

  static eventName = 'wishlist:change';
}

if (!customElements.get('wishlist-button')) customElements.define('wishlist-button', WishlistButton);
