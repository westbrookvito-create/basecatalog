// Pool of manual payment requisites. On order creation one entry is picked
// at random and its snapshot is saved on the order itself (orders.payment_requisites),
// so it's always visible which requisites were shown to that specific customer —
// even if this list changes later.
//
// Add more entries here as needed; selection is uniformly random across all of them.
export const PAYMENT_REQUISITES = [
  {
    bank: 'АльфаБанк',
    number: '79503339185',
    holder: 'Иван М.',
    type: 'phone', // transfer by phone number (СБП)
  },
];

export function pickRandomRequisites() {
  const i = Math.floor(Math.random() * PAYMENT_REQUISITES.length);
  return PAYMENT_REQUISITES[i];
}
