export const storeCategories = [
  {
    slug: "fragrances",
    name: "Kemra Perfumes",
    productCategories: ["fragrances"],
    audiences: ["Women", "Men", "Unisex"],
  },
  {
    slug: "mens-shoes",
    name: "Sneakers",
    productCategories: ["mens-shoes", "womens-shoes"],
    audiences: ["Women", "Men", "Children"],
    audienceProductCategories: {
      women: ["womens-shoes"],
      men: ["mens-shoes"],
      children: [],
    },
  },
  {
    slug: "mens-watches",
    name: "Watches",
    productCategories: ["mens-watches", "womens-watches"],
    audiences: ["Women", "Men", "Children"],
    audienceProductCategories: {
      women: ["womens-watches"],
      men: ["mens-watches"],
      children: [],
    },
  },
];

export const comingSoonCategories = ["Makeup", "Accessories"];
export const storeProductCategories = new Set(
  storeCategories.flatMap(({ productCategories }) => productCategories)
);
