import { Component } from '@theme/component';
import { trapFocus, removeTrapFocus } from '@theme/focus';

/**
 * MOXIE: drawer mobile custom con tabs persistentes (Fase 2 del header custom).
 *
 * Controla la copia mobile de blocks/_custom_menu.liquid: apertura/cierre del drawer,
 * selección de tab (un tab por ítem de menú, panel compartido con el dropdown desktop)
 * y drill-down de columnas a pantalla completa con botón "back".
 *
 * @typedef {object} Refs
 * @property {HTMLDetailsElement} details - El details exterior (summary = hamburguesa).
 * @property {HTMLDivElement} drawer - El panel deslizable del drawer.
 *
 * @extends {Component<Refs>}
 */
class CustomHeaderDrawer extends Component {
  requiredRefs = ['details', 'drawer'];

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('keyup', this.#onKeyUp);
    this.addEventListener('keydown', this.#onKeyDown);
    this.#dedupeIds();

    const [firstItem] = this.#items;
    if (firstItem && !this.#items.some((item) => item.hasAttribute('data-active'))) {
      this.#activateTab(firstItem);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keyup', this.#onKeyUp);
    this.removeEventListener('keydown', this.#onKeyDown);
  }

  get isOpen() {
    return this.refs.details.hasAttribute('open');
  }

  get #items() {
    return Array.from(this.querySelectorAll('.custom-menu-item'));
  }

  toggle() {
    return this.isOpen ? this.close() : this.open();
  }

  open() {
    const summary = this.refs.details.querySelector('summary');
    summary?.setAttribute('aria-expanded', 'true');

    requestAnimationFrame(() => {
      this.refs.details.classList.add('menu-open');
      trapFocus(this.refs.details);
    });
  }

  close() {
    const { details } = this.refs;
    const summary = details.querySelector('summary');

    summary?.setAttribute('aria-expanded', 'false');
    details.classList.remove('menu-open');
    this.#closeDrill();
    removeTrapFocus();
    details.removeAttribute('open');
  }

  /**
   * Activa el tab del ítem clickeado.
   * @param {string} [_target] - Sin uso (firma del sistema de eventos declarativos).
   * @param {Event} [event]
   */
  selectTab(_target, event) {
    const item = event?.target instanceof Element ? event.target.closest('.custom-menu-item') : null;
    if (!(item instanceof HTMLElement)) return;

    this.#closeDrill();
    this.#activateTab(item);
  }

  /**
   * Abre el subpanel (drill-down) de la columna clickeada.
   * @param {string} [_target]
   * @param {Event} [event]
   */
  drillDown(_target, event) {
    const column = event?.target instanceof Element ? event.target.closest('.custom-menu-column') : null;
    if (!(column instanceof HTMLElement)) return;

    column.setAttribute('data-drill-open', '');
    this.refs.drawer.classList.add('custom-menu-drawer--sub-open');

    const back = column.querySelector('.custom-menu-column__back');
    if (back instanceof HTMLElement) back.focus();
  }

  /**
   * Cierra el subpanel abierto y devuelve el foco a la fila que lo abrió.
   * @param {string} [_target]
   * @param {Event} [event]
   */
  drillBack(_target, event) {
    const column = event?.target instanceof Element ? event.target.closest('[data-drill-open]') : null;
    this.#closeDrill();

    const row = column?.querySelector('.custom-menu-column__drill-row');
    if (row instanceof HTMLElement) row.focus();
  }

  /**
   * MOXIE: no-ops obligatorios. Los <li> de los ítems traen on:focus/blur/pointerenter/
   * pointerleave="/activate|/deactivate" (contrato del mega menu desktop, assets/header-menu.js).
   * Dentro del drawer esos eventos declarativos resuelven contra este componente — sin estos
   * métodos cada toque/foco lanzaría un error en consola.
   */
  activate() {}
  deactivate() {}

  /**
   * @param {HTMLElement} item
   */
  #activateTab(item) {
    for (const candidate of this.#items) {
      const active = candidate === item;
      candidate.toggleAttribute('data-active', active);
      candidate.querySelector('.custom-menu-item__tab')?.setAttribute('aria-expanded', String(active));
    }
  }

  #closeDrill() {
    this.refs.drawer.classList.remove('custom-menu-drawer--sub-open');
    for (const column of this.querySelectorAll('[data-drill-open]')) {
      column.removeAttribute('data-drill-open');
    }
  }

  /**
   * @param {KeyboardEvent} event
   */
  #onKeyUp = (event) => {
    if (event.key !== 'Escape') return;

    const openColumn = this.querySelector('[data-drill-open]');
    if (openColumn) {
      this.#closeDrill();
      const row = openColumn.querySelector('.custom-menu-column__drill-row');
      if (row instanceof HTMLElement) row.focus();
    } else {
      this.close();
    }
  };

  /**
   * Navegación por flechas entre los tabs (foco enfocado en el tab bar).
   * @param {KeyboardEvent} event
   */
  #onKeyDown = (event) => {
    const { target } = event;
    if (!(target instanceof HTMLElement) || !target.classList.contains('custom-menu-item__tab')) return;

    const tabs = Array.from(this.querySelectorAll('.custom-menu-item__tab'));
    const index = tabs.indexOf(target);
    if (index === -1) return;

    let next = null;
    if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
    if (event.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
    if (event.key === 'Home') next = tabs[0];
    if (event.key === 'End') next = tabs[tabs.length - 1];

    if (next instanceof HTMLElement) {
      event.preventDefault();
      next.focus();
    }
  };

  /**
   * MOXIE: el mismo static block se renderiza dos veces (desktop + drawer), así que los ids de
   * los paneles (aria-controls de los links/tabs) quedarían duplicados en el DOM. Se re-prefijan
   * los del subárbol del drawer al conectarse para restaurar la unicidad.
   */
  #dedupeIds() {
    for (const element of this.querySelectorAll('[id]')) {
      if (element.id.startsWith('drawer-')) continue;
      element.id = `drawer-${element.id}`;
    }
    for (const element of this.querySelectorAll('[aria-controls]')) {
      const value = element.getAttribute('aria-controls');
      if (!value || value.startsWith('drawer-')) continue;
      element.setAttribute('aria-controls', `drawer-${value}`);
    }
  }
}

if (!customElements.get('custom-header-drawer')) {
  customElements.define('custom-header-drawer', CustomHeaderDrawer);
}
