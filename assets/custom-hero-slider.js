import { Component } from '@theme/component';

/**
 * MOXIE: custom hero slider — crossfades the active slide in place (no lateral scroll/translate)
 * while two decorative side panels peek the previous/next slide's media, matching the approved
 * Figma. Reuses the theme's generic `on:click="/method"` delegation, so `slideshow-arrows.liquid`
 * and `slideshow-controls.liquid` (dots/counter) work unmodified against this component.
 *
 * @typedef {Object} Refs
 * @property {HTMLElement[]} slides
 * @property {HTMLElement} [peekPrevious]
 * @property {HTMLElement} [peekNext]
 * @property {HTMLElement[]} [dots]
 * @property {HTMLElement} [current]
 *
 * @extends {Component<Refs>}
 */
export class HeroFadeSlider extends Component {
  /** @type {number} */
  #activeIndex = 0;

  /** @type {number | null} */
  #autoplayTimer = null;

  connectedCallback() {
    super.connectedCallback();

    const slides = this.refs.slides ?? [];
    const initialSlide = slides.findIndex((slide) => slide.classList.contains('is-active'));
    this.#activeIndex = initialSlide > -1 ? initialSlide : 0;
    this.#render();

    const autoplaySpeed = Number(this.getAttribute('autoplay'));
    if (autoplaySpeed > 0) this.play(autoplaySpeed * 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.pause();
  }

  get slideCount() {
    return this.refs.slides?.length ?? 0;
  }

  /**
   * Selects a slide by index (wraps around).
   * @param {number} index
   * @param {Event} [event]
   */
  select(index, event) {
    event?.preventDefault();
    const count = this.slideCount;
    if (!count) return;

    const nextIndex = ((Number(index) % count) + count) % count;
    if (nextIndex === this.#activeIndex) return;

    this.#activeIndex = nextIndex;
    this.#render();
  }

  /** @param {Event} [event] */
  next(event) {
    event?.preventDefault();
    this.select(this.#activeIndex + 1);
  }

  /** @param {Event} [event] */
  previous(event) {
    event?.preventDefault();
    this.select(this.#activeIndex - 1);
  }

  /**
   * Starts autoplay.
   * @param {number} [interval] - Milliseconds between slides.
   */
  play(interval = 5000) {
    this.pause();
    this.#autoplayTimer = window.setInterval(() => this.next(), interval);
    this.setAttribute('autoplay-running', '');
  }

  pause() {
    if (this.#autoplayTimer) {
      window.clearInterval(this.#autoplayTimer);
      this.#autoplayTimer = null;
    }
    this.removeAttribute('autoplay-running');
  }

  #render() {
    const { slides = [], dots = [], current, peekPrevious, peekNext } = this.refs;
    const count = slides.length;
    if (!count) return;

    const previousIndex = (this.#activeIndex - 1 + count) % count;
    const nextIndex = (this.#activeIndex + 1) % count;

    slides.forEach((slide, index) => {
      const isActive = index === this.#activeIndex;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
    });

    dots.forEach((dot, index) => {
      dot.setAttribute('aria-selected', String(index === this.#activeIndex));
    });

    if (current) current.textContent = String(this.#activeIndex + 1);

    this.#updatePeek(peekPrevious, slides[previousIndex]);
    this.#updatePeek(peekNext, slides[nextIndex]);
  }

  /**
   * @param {HTMLElement} [peekElement]
   * @param {HTMLElement} [sourceSlide]
   */
  #updatePeek(peekElement, sourceSlide) {
    if (!peekElement || !sourceSlide) return;
    const peekSrc = sourceSlide.getAttribute('data-peek-src');
    if (peekSrc) peekElement.style.setProperty('--peek-image', `url("${peekSrc}")`);
  }
}

if (!customElements.get('hero-fade-slider')) {
  customElements.define('hero-fade-slider', HeroFadeSlider);
}
