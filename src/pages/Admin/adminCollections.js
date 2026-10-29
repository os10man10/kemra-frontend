import { storeCategories } from "../../data/storeCategories";

const ADMIN_COLLECTIONS_KEY = "kemra-admin-demo-collections";

export function getAdminCollections() {
  const defaults = storeCategories.map((category) => ({
    ...category,
    navigationEnabled: true,
    homeEnabled: true,
  }));

  try {
    const saved = window.localStorage.getItem(ADMIN_COLLECTIONS_KEY);
    if (!saved) return defaults;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return defaults;

    const defaultsBySlug = new Map(defaults.map((category) => [category.slug, category]));
    const seen = new Set();
    const savedCategories = parsed.flatMap((category) => {
      if (!category || typeof category.slug !== "string" || !defaultsBySlug.has(category.slug) || seen.has(category.slug)) return [];
      seen.add(category.slug);
      return [{ ...defaultsBySlug.get(category.slug), ...category }];
    });
    return [...savedCategories, ...defaults.filter((category) => !seen.has(category.slug))];
  } catch {
    return defaults;
  }
}

export function saveAdminCollections(collections) {
  try {
    const settings = collections.map(({ slug, name, navigationEnabled, homeEnabled }) => ({
      slug,
      name,
      navigationEnabled: Boolean(navigationEnabled),
      homeEnabled: Boolean(homeEnabled),
    }));
    window.localStorage.setItem(ADMIN_COLLECTIONS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
