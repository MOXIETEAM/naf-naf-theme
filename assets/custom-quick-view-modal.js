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
    // MOXIE: event.currentTarget is document (the delegated listener root, see
    // assets/component.js) — the clicked button only comes through as event.target.
    const target = /** @type {HTMLButtonElement | null} */ (event.target);
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

  showSizeGuide() {
    const { sizesView, guideView } = this.refs;
    if (!guideView) return;

    sizesView?.setAttribute('hidden', '');
    guideView.removeAttribute('hidden');
  }

  backToSizes() {
    const { sizesView, guideView } = this.refs;
    if (!guideView) return;

    guideView.setAttribute('hidden', '');
    sizesView?.removeAttribute('hidden');
  }

  /**
   * MOXIE: no recalcula nada — cada celda de la tabla ya trae ambos valores
   * (data-cm/data-in) precargados desde el metaobject size_guide, esto solo
   * decide cuál mostrar.
   * @param {PointerEvent} event
   */
  setUnit(event) {
    const target = /** @type {HTMLButtonElement | null} */ (event.target);
    const unit = target?.dataset.unit;
    if (!unit) return;

    const { unitToggle } = this.refs;
    if (!unitToggle) return;

    unitToggle.dataset.activeUnit = unit;

    for (const button of unitToggle.querySelectorAll('.quick-view-modal__guide-unit')) {
      button.setAttribute('aria-pressed', String(button.dataset.unit === unit));
    }

    for (const cell of this.querySelectorAll('.quick-view-modal__guide-table td[data-cm]')) {
      const value = unit === 'in' ? cell.dataset.in : cell.dataset.cm;
      if (value) cell.textContent = value;
    }
  }
}

if (!customElements.get('custom-quick-view-modal')) {
  customElements.define('custom-quick-view-modal', QuickViewDialog);
}
