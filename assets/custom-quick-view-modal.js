import { DialogComponent } from '@theme/dialog';

/**
 * MOXIE: modal "Compra rápida" (mobile). Extiende el DialogComponent nativo (assets/dialog.js) sin
 * modificarlo — showDialog()/closeDialog()/toggleDialog() se heredan tal cual. Solo agrega
 * selectSize() para reutilizar el ProductFormComponent nativo (assets/product-form.js) al agregar
 * al carrito, igual que en custom-product-card-size-select.js.
 *
 * @extends DialogComponent
 */
export class QuickViewDialog extends DialogComponent {
  /**
   * @param {PointerEvent} event
   */
  selectSize(event) {
    const target = /** @type {HTMLButtonElement | null} */ (event.currentTarget);
    if (!target || target.disabled) return;

    const variantId = target.dataset.variantId;
    if (!variantId) return;

    const productForm = /** @type {import('./product-form').ProductFormComponent | null} */ (
      this.querySelector('product-form-component')
    );
    const variantIdInput = productForm?.refs?.variantId;
    if (!productForm || !variantIdInput) return;

    variantIdInput.value = variantId;
    productForm.handleSubmit(event);
  }

  // TODO: conectar cuando se defina la fuente de datos de la guía de tallas (pendiente, ver plan).
  showSizeGuide() {}
}

if (!customElements.get('custom-quick-view-modal')) {
  customElements.define('custom-quick-view-modal', QuickViewDialog);
}
