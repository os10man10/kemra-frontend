const ADMIN_DISCOUNTS_KEY = "kemra-demo-discounts";

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

export function getAdminDiscounts() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ADMIN_DISCOUNTS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((discount) => discount && typeof discount === "object") : [];
  } catch {
    return [];
  }
}

export function saveAdminDiscounts(discounts) {
  try {
    window.localStorage.setItem(ADMIN_DISCOUNTS_KEY, JSON.stringify(discounts));
    return true;
  } catch {
    return false;
  }
}

export function checkDiscountCode(code, subtotal, now = new Date()) {
  const normalizedCode = normalizeCode(code);
  const amount = Math.max(0, Number(subtotal) || 0);
  if (!normalizedCode) return { valid: false, message: "Enter a discount code." };

  const discount = getAdminDiscounts().find((item) => normalizeCode(item.code) === normalizedCode);
  if (!discount) return { valid: false, message: "That discount code was not found." };
  if (!discount.active) return { valid: false, message: "That discount code is inactive." };

  const startsAt = discount.startsAt ? new Date(`${discount.startsAt}T00:00:00`) : null;
  const endsAt = discount.endsAt ? new Date(`${discount.endsAt}T23:59:59.999`) : null;
  if (startsAt && now < startsAt) return { valid: false, message: "That discount is not active yet." };
  if (endsAt && now > endsAt) return { valid: false, message: "That discount has expired." };

  const minimumSubtotal = Math.max(0, Number(discount.minimumSubtotal) || 0);
  if (amount < minimumSubtotal) {
    return { valid: false, message: `Add $${(minimumSubtotal - amount).toFixed(2)} more to use this code.`, discount };
  }

  const value = Math.max(0, Number(discount.value) || 0);
  const discountAmount = discount.type === "percentage"
    ? amount * Math.min(value, 100) / 100
    : Math.min(value, amount);

  return {
    valid: true,
    discount,
    discountAmount: Math.round(discountAmount * 100) / 100,
    message: `${normalizedCode} applied successfully.`,
  };
}

export function normalizeDiscountCode(code) {
  return normalizeCode(code);
}
