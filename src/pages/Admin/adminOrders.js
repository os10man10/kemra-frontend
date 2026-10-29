const ADMIN_ORDERS_KEY = "kemra-demo-orders";

export const orderStatuses = ["New", "Preparing", "Shipped", "Delivered", "Cancelled"];

export function getAdminOrders() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ADMIN_ORDERS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((order) => order && typeof order === "object") : [];
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  try {
    window.localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(orders));
    return true;
  } catch {
    return false;
  }
}

export function createAdminOrder(order) {
  const orderId = `KMR-${Date.now().toString(36).toUpperCase()}`;
  const createdOrder = {
    ...order,
    id: orderId,
    createdAt: new Date().toISOString(),
    status: "New",
  };
  return saveOrders([createdOrder, ...getAdminOrders()]) ? createdOrder : null;
}

export function updateAdminOrderStatus(orderId, status) {
  if (!orderStatuses.includes(status)) return false;
  const nextOrders = getAdminOrders().map((order) =>
    order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order
  );
  return saveOrders(nextOrders);
}
