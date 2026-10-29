const ADMIN_CATALOG_KEY = "kemra-admin-demo-catalog";

function emptyCatalog() {
  return { created: [], updated: {}, deleted: [] };
}

function readCatalog() {
  try {
    const rawCatalog = window.localStorage.getItem(ADMIN_CATALOG_KEY);
    const parsedCatalog = rawCatalog ? JSON.parse(rawCatalog) : emptyCatalog();
    return {
      created: Array.isArray(parsedCatalog.created) ? parsedCatalog.created : [],
      updated: parsedCatalog.updated && typeof parsedCatalog.updated === "object"
        ? parsedCatalog.updated
        : {},
      deleted: Array.isArray(parsedCatalog.deleted) ? parsedCatalog.deleted.map(String) : [],
    };
  } catch {
    return emptyCatalog();
  }
}

function writeCatalog(catalog) {
  try {
    window.localStorage.setItem(ADMIN_CATALOG_KEY, JSON.stringify(catalog));
    return true;
  } catch {
    return false;
  }
}

export function getAdminCatalogChanges() {
  return readCatalog();
}

export function saveAdminProduct(product) {
  const catalog = readCatalog();
  const stock = Number(product.stock);
  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error("Stock must be a whole number of pieces.");
  }
  const images = (Array.isArray(product.images) ? product.images : [product.thumbnail])
    .map((image) => String(image || "").trim())
    .filter(Boolean);
  const thumbnail = images[0] || String(product.thumbnail || "").trim();
  const variants = Array.isArray(product.variants)
    ? product.variants.map((variant) => ({
      ...variant,
      compareAtPrice: variant.compareAtPrice == null || variant.compareAtPrice === "" ? null : Number(variant.compareAtPrice),
      costPerItem: variant.costPerItem == null || variant.costPerItem === "" ? null : Number(variant.costPerItem),
      sku: String(variant.sku || "").trim(),
      barcode: String(variant.barcode || "").trim(),
    }))
    : product.variants;
  const normalizedProduct = {
    ...product,
    id: String(product.id),
    price: Number(product.price),
    stock,
    publicationStatus: ["draft", "active", "unlisted", "archived"].includes(product.publicationStatus)
      ? product.publicationStatus
      : "active",
    thumbnail,
    images,
    sku: String(product.sku || "").trim(),
    barcode: String(product.barcode || "").trim(),
    compareAtPrice: product.compareAtPrice == null || product.compareAtPrice === "" ? null : Number(product.compareAtPrice),
    costPerItem: product.costPerItem == null || product.costPerItem === "" ? null : Number(product.costPerItem),
    tags: [...new Set((Array.isArray(product.tags) ? product.tags : [])
      .map((tag) => String(tag || "").trim())
      .filter((tag) => tag && tag.length <= 255))].slice(0, 250),
    ...(variants ? { variants } : {}),
    availabilityStatus: Number(product.stock) > 0 ? "In Stock" : "Out of Stock",
  };

  if (String(product.id).startsWith("kemra-")) {
    catalog.created = catalog.created.map((item) =>
      String(item.id) === normalizedProduct.id ? normalizedProduct : item
    );
    if (!catalog.created.some((item) => String(item.id) === normalizedProduct.id)) {
      catalog.created.push(normalizedProduct);
    }
  } else {
    catalog.updated[normalizedProduct.id] = normalizedProduct;
  }

  catalog.deleted = catalog.deleted.filter((id) => id !== normalizedProduct.id);
  if (!writeCatalog(catalog)) throw new Error("The browser could not save this demo product.");
  return normalizedProduct;
}

export function createAdminProduct(product) {
  const id = `kemra-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
  return saveAdminProduct({ ...product, id });
}

export function deleteAdminProduct(productId) {
  const id = String(productId);
  const catalog = readCatalog();
  const isCreatedHere = catalog.created.some((product) => String(product.id) === id);

  if (isCreatedHere) {
    catalog.created = catalog.created.filter((product) => String(product.id) !== id);
  } else if (!catalog.deleted.includes(id)) {
    catalog.deleted.push(id);
  }

  delete catalog.updated[id];
  if (!writeCatalog(catalog)) throw new Error("The browser could not save this demo change.");
}

export function applyAdminCatalogChanges(products, collectionSlug, { includeUnpublished = false } = {}) {
  const catalog = readCatalog();
  const deletedIds = new Set(catalog.deleted);
  const seenIds = new Set();

  const mergedProducts = products.flatMap((product) => {
    const id = String(product.id);
    if (deletedIds.has(id)) return [];

    const mergedProduct = {
      publicationStatus: "active",
      ...product,
      storeCollection: collectionSlug,
      ...catalog.updated[id],
    };
    if (mergedProduct.storeCollection !== collectionSlug) return [];

    seenIds.add(id);
    return [mergedProduct];
  });

  const movedProducts = Object.values(catalog.updated).filter((product) =>
    product.storeCollection === collectionSlug
    && !deletedIds.has(String(product.id))
    && !seenIds.has(String(product.id))
  );
  const newProducts = catalog.created.filter((product) =>
    product.storeCollection === collectionSlug && !deletedIds.has(String(product.id))
  );

  const catalogProducts = [...mergedProducts, ...movedProducts, ...newProducts];
  return includeUnpublished
    ? catalogProducts
    : catalogProducts.filter((product) => (product.publicationStatus || "active") === "active");
}
