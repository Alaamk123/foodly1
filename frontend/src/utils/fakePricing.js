const PRICES = {
  milk: 3.5,
  bread: 2.5,
  eggs: 4.5,
  chicken: 8.99,
  rice: 5.99,
  pasta: 2.99,
  tomato: 2.49,
  potato: 2.99,
  onion: 1.99,
  apple: 3.99,
  banana: 2.49,
};

export function priceForItem(name, category) {
  const key = String(name).toLowerCase().trim();

  if (PRICES[key] !== undefined) {
    return PRICES[key];
  }

  // سعر تجريبي افتراضي إذا الصنف غير موجود
  return 3.99;
}

export function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}