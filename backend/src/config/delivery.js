// Delivery methods offered in the order form. `id` is what gets stored on the
// order and used for admin filtering; `label` is shown to the user/admin.
export const DELIVERY_METHODS = [
  { id: 'cdek', label: 'СДЭК' },
  { id: 'russian_post', label: 'Почта России' },
  { id: 'yandex', label: 'Яндекс Доставка' },
];

export function isValidDeliveryMethod(id) {
  return DELIVERY_METHODS.some((m) => m.id === id);
}

export function deliveryLabel(id) {
  return DELIVERY_METHODS.find((m) => m.id === id)?.label || id;
}
