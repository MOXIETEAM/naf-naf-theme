import { Component } from '@theme/component';
import { isMobileBreakpoint } from '@theme/utilities';

/**
 * MOXIE: reemplaza el quick-add nativo para el catálogo NafNaf (una sola opción: Talla).
 * Desktop: el trigger revela un overlay de tallas sobre la imagen (ver CSS), clic agrega al carrito
 * reutilizando el mismo ProductFormComponent nativo (assets/product-form.js) — sin duplicar la
 * lógica de Ajax cart.
 * Mobile: el mismo trigger abre el modal "Compra rápida" (custom-quick-view-modal.js) en su lugar.
 *
 * @typedef {object} Refs
 * @property {HTMLButtonElement} trigger
 * @property {HTMLElement} overlay
 *
 * @extends Component<Refs>
 */
export class ProductCardSizeSelect extends Component {
  requiredRefs = ['trigger', 'overlay'];

  handleTriggerClick() {
    if (!isMobileBreakpoint()) return;

    /** @type {import('./custom-quick-view-modal').QuickViewDialog | null} */
    const quickViewModal = document.getElementById(`QuickViewModal-${this.productId}`);
    quickViewModal?.showDialog();
  }

  /**
   * @param {PointerEvent} event
   */
  selectSize(event) {
    const target = /** @type {HTMLElement | null} */ (event.currentTarget);
    const variantId = target?.dataset.variantId;
    if (!variantId) return;

    const productForm = /** @type {import('./product-form').ProductFormComponent | null} */ (
      this.querySelector('product-form-component')
    );
    const variantIdInput = productForm?.refs?.variantId;
    if (!productForm || !variantIdInput) return;

    variantIdInput.value = variantId;
    productForm.handleSubmit(event);
  }

  get productId() {
    return this.dataset.productId ?? '';
  }
}

if (!customElements.get('product-card-size-select')) {
  customElements.define('product-card-size-select', ProductCardSizeSelect);
}
