const sharedShoeColors = [
  { value: "black", label: "Black", swatch: "#242321" },
  { value: "white", label: "White", swatch: "#f7f4ed" },
  { value: "sand", label: "Sand", swatch: "#c7ad83" },
];

const sharedWatchColors = [
  { value: "gold", label: "Gold", swatch: "#c6a15b" },
  { value: "silver", label: "Silver", swatch: "#b9bdc0" },
  { value: "black", label: "Black", swatch: "#242321" },
];

export const variantOptionsByCategory = {
  "mens-shoes": [
    { key: "color", label: "Color", options: sharedShoeColors },
    {
      key: "size",
      label: "EU Size",
      options: [39, 40, 41, 42, 43, 44, 45].map((size) => ({ value: String(size), label: String(size) })),
    },
  ],
  "womens-shoes": [
    { key: "color", label: "Color", options: sharedShoeColors },
    {
      key: "size",
      label: "EU Size",
      options: [36, 37, 38, 39, 40, 41, 42].map((size) => ({ value: String(size), label: String(size) })),
    },
  ],
  fragrances: [
    {
      key: "volume",
      label: "Size",
      options: ["30 ml", "50 ml", "100 ml"].map((size) => ({ value: size, label: size })),
    },
  ],
  "mens-watches": [
    { key: "color", label: "Color", options: sharedWatchColors },
  ],
  "womens-watches": [
    { key: "color", label: "Color", options: sharedWatchColors },
  ],
};

export function getProductVariantOptions(product) {
  if (Array.isArray(product?.variantOptions)) return product.variantOptions;
  return variantOptionsByCategory[product?.category] || [];
}

export function getProductVariant(product, selectedOptions = {}) {
  if (!Array.isArray(product?.variants)) return null;
  return product.variants.find((variant) =>
    Object.entries(variant.options || {}).every(([key, value]) => selectedOptions[key] === value)
    && Object.keys(variant.options || {}).length === Object.keys(selectedOptions).length
  ) || null;
}

export function getProductVariantInventory(product, selectedOptions = {}) {
  const variant = getProductVariant(product, selectedOptions);
  if (variant) {
    return {
      price: Number(variant.price ?? product.price),
      compareAtPrice: Number(variant.compareAtPrice ?? 0),
      stock: Math.max(0, Number(variant.stock) || 0),
      variantId: variant.id,
    };
  }
  if (Array.isArray(product?.variants) && product.variants.length > 0) {
    return { price: Number(product.price) || 0, compareAtPrice: Number(product.compareAtPrice) || 0, stock: 0, variantId: null };
  }
  return { price: Number(product?.price) || 0, compareAtPrice: Number(product?.compareAtPrice) || 0, stock: Math.max(0, Number(product?.stock) || 0), variantId: null };
}
