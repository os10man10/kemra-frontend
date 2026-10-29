import { storeCategories } from "../data/storeCategories";
import { applyAdminCatalogChanges } from "../pages/Admin/adminCatalog";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://dummyjson.com").replace(/\/+$/, "");
const CATEGORY_CACHE_TTL_MS = 30_000;
const apiCategoryCache = new Map();
const apiCategoryRequests = new Map();

async function requestProducts(path, signal) {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });
  if (!response.ok) throw new Error("Product request failed");
  return response.json();
}

function waitForRequest(sharedRequest, signal) {
  if (!signal) return sharedRequest;
  if (signal.aborted) {
    return Promise.reject(new DOMException("The request was aborted", "AbortError"));
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => signal.removeEventListener("abort", handleAbort);
    const handleAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new DOMException("The request was aborted", "AbortError"));
    };

    signal.addEventListener("abort", handleAbort, { once: true });
    sharedRequest.then(
      (value) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      },
      (error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      }
    );
  });
}

async function getProductsForApiCategory(category, signal) {
  if (signal?.aborted) throw new DOMException("The request was aborted", "AbortError");

  const cached = apiCategoryCache.get(category);
  if (cached && Date.now() - cached.savedAt < CATEGORY_CACHE_TTL_MS) {
    return cached.products;
  }

  let sharedRequest = apiCategoryRequests.get(category);
  if (!sharedRequest) {
    sharedRequest = requestProducts(`/products/category/${encodeURIComponent(category)}?limit=0`)
      .then((data) => {
        const products = data.products || [];
        apiCategoryCache.set(category, { products, savedAt: Date.now() });
        return products;
      })
      .finally(() => apiCategoryRequests.delete(category));
    apiCategoryRequests.set(category, sharedRequest);
  }

  return waitForRequest(sharedRequest, signal);
}

export async function getProducts({ limit = 0, signal, includeUnpublished = false } = {}) {
  const groupedProducts = await Promise.all(
    storeCategories.map(({ slug }) => getProductsByCategory(slug, { limit: 0, signal, includeUnpublished }))
  );
  const products = groupedProducts.flat();
  return limit > 0 ? products.slice(0, limit) : products;
}

export async function getProductsByCategory(category, { audience, limit, signal, includeUnpublished = false } = {}) {
  const storeCategory = storeCategories.find((item) => item.slug === category);
  if (!storeCategory) throw new Error("This collection is not available in the Kemra store.");
  if (signal?.aborted) throw new DOMException("The request was aborted", "AbortError");

  const audienceKey = audience?.trim().toLowerCase() || "";
  const audienceMap = storeCategory.audienceProductCategories || {};
  const hasAudienceMapping = audienceKey !== ""
    && Object.prototype.hasOwnProperty.call(audienceMap, audienceKey);
  const apiCategories = hasAudienceMapping
    ? audienceMap[audienceKey]
    : storeCategory.productCategories;
  const productGroups = await Promise.all(
    apiCategories.map((apiCategory) => getProductsForApiCategory(apiCategory, signal))
  );
  const apiProducts = productGroups.flatMap((group, index) => {
    const apiCategory = apiCategories[index];
    const inferredAudience = Object.entries(audienceMap)
      .find(([, mappedCategories]) => mappedCategories.includes(apiCategory))?.[0];

    return group.map((product) => ({
      ...product,
      storeCollection: category,
      ...(inferredAudience ? { audience: inferredAudience } : {}),
    }));
  });
  const catalogProducts = applyAdminCatalogChanges(apiProducts, category, { includeUnpublished });
  const products = hasAudienceMapping
    ? catalogProducts.filter((product) => {
        const productAudience = product.audience || product.gender || product.targetAudience;
        if (!productAudience) return false;
        const normalizedAudiences = Array.isArray(productAudience)
          ? productAudience.map((value) => String(value).toLowerCase())
          : String(productAudience).toLowerCase().split(/[\s,;/|]+/);
        return normalizedAudiences.includes(audienceKey);
      })
    : catalogProducts;

  return limit > 0 ? products.slice(0, limit) : products;
}

export async function searchProducts(query, { limit, signal } = {}) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const catalog = await getProducts({ signal });
  const products = catalog.filter((product) => {
    const searchableText = [product.title, product.description, product.brand, product.category, product.audience, ...(product.tags || [])]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    return searchableText.includes(normalizedQuery);
  });
  return {
    products: limit === undefined || limit === 0 ? products : products.slice(0, limit),
    total: products.length,
  };
}

export function getProduct(id, { signal } = {}) {
  return getProducts({ signal, includeUnpublished: true }).then((products) => {
    const product = products.find((item) => String(item.id) === String(id));
    if (!product || ["draft", "archived"].includes(product.publicationStatus)) {
      throw new Error("This product is not part of the Kemra collection.");
    }
    return product;
  });
}

export async function getProductCategories({ signal } = {}) {
  if (signal?.aborted) throw new DOMException("The request was aborted", "AbortError");
  return storeCategories;
}
