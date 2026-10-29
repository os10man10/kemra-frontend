import { defaultHeroBanners } from "./heroBanners";

const ADMIN_BANNERS_KEY = "kemra-admin-demo-banners";
const MEDIA_DB_NAME = "kemra-admin-demo-media";
const MEDIA_STORE_NAME = "banner-media";

function openMediaDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("This browser does not support local media storage."));
      return;
    }
    const request = window.indexedDB.open(MEDIA_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(MEDIA_STORE_NAME)) {
        request.result.createObjectStore(MEDIA_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Browser media storage could not be opened."));
  });
}

export function getAdminBanners() {
  try {
    const saved = window.localStorage.getItem(ADMIN_BANNERS_KEY);
    if (!saved) return defaultHeroBanners;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return defaultHeroBanners;

    const defaultsById = new Map(defaultHeroBanners.map((banner) => [banner.id, banner]));
    const seenIds = new Set();
    const savedBanners = parsed.flatMap((banner) => {
      if (!banner || typeof banner !== "object" || typeof banner.id !== "string" || seenIds.has(banner.id)) return [];
      seenIds.add(banner.id);
      const fallback = defaultsById.get(banner.id);
      return [{ ...(fallback || {}), ...banner }];
    });
    return [...savedBanners, ...defaultHeroBanners.filter((banner) => !seenIds.has(banner.id))];
  } catch {
    return defaultHeroBanners;
  }
}

export function saveAdminBanners(banners) {
  try {
    window.localStorage.setItem(ADMIN_BANNERS_KEY, JSON.stringify(banners));
    return true;
  } catch {
    return false;
  }
}

export async function storeAdminBannerMedia(blob) {
  const id = `banner-media-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
  const database = await openMediaDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(MEDIA_STORE_NAME, "readwrite");
      transaction.objectStore(MEDIA_STORE_NAME).put({ id, blob, type: blob.type });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(new Error("The selected media could not be saved in this browser."));
      transaction.onabort = () => reject(new Error("The selected media could not be saved in this browser."));
    });
    return id;
  } finally {
    database.close();
  }
}

export async function getAdminBannerMediaUrl(id) {
  const database = await openMediaDatabase();
  try {
    const record = await new Promise((resolve, reject) => {
      const request = database.transaction(MEDIA_STORE_NAME, "readonly").objectStore(MEDIA_STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("The saved banner media could not be loaded."));
    });
    return record?.blob ? URL.createObjectURL(record.blob) : null;
  } finally {
    database.close();
  }
}

export async function deleteAdminBannerMedia(id) {
  if (!id) return;
  const database = await openMediaDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(MEDIA_STORE_NAME, "readwrite");
      transaction.objectStore(MEDIA_STORE_NAME).delete(id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(new Error("Unused banner media could not be removed."));
    });
  } finally {
    database.close();
  }
}
