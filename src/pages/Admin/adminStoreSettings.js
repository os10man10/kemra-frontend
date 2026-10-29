const ADMIN_STORE_SETTINGS_KEY = "kemra-admin-demo-store-settings";

export const defaultStoreSettings = {
  supportEmail: "support@kemra.com",
  footerDescription: "Perfume, sneakers, and watches with an ancient soul and a modern spirit.",
  socials: {
    instagram: "https://www.instagram.com/kemra_perfumes/",
    facebook: "https://www.facebook.com/share/18zhs9SmXH/",
    whatsapp: "https://wa.me/201141613775",
    tiktok: "https://www.tiktok.com/@kemra.perfumes",
  },
};

export function getAdminStoreSettings() {
  try {
    const saved = window.localStorage.getItem(ADMIN_STORE_SETTINGS_KEY);
    if (!saved) return defaultStoreSettings;
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") return defaultStoreSettings;
    return {
      ...defaultStoreSettings,
      ...parsed,
      socials: { ...defaultStoreSettings.socials, ...(parsed.socials || {}) },
    };
  } catch {
    return defaultStoreSettings;
  }
}

export function saveAdminStoreSettings(settings) {
  try {
    window.localStorage.setItem(ADMIN_STORE_SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
