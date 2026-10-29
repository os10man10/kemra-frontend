import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiPackage, FiSearch, FiShoppingBag } from "react-icons/fi";
import { getAdminOrders, orderStatuses, updateAdminOrderStatus } from "./adminOrders";
import "./AdminOrdersPage.css";

const filters = ["All", ...orderStatuses];

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function AdminOrdersPage() {
  const [orders, setOrders] = useState(() => getAdminOrders());
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesFilter = activeFilter === "All" || order.status === activeFilter;
      const matchesSearch = !query || [order.id, order.customer?.name, order.customer?.email, order.customer?.phone]
        .some((value) => String(value || "").toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [orders, activeFilter, search]);

  const changeStatus = (orderId, status) => {
    if (!updateAdminOrderStatus(orderId, status)) {
      setNotice("The browser could not update this order.");
      return;
    }
    setOrders(getAdminOrders());
    setNotice(`Order ${orderId} updated to ${status}.`);
  };

  return (
    <div className="admin-orders-page">
      <Link className="admin-orders-back" to="/admin"><FiArrowLeft aria-hidden="true" /> Admin overview</Link>
      <header className="admin-orders-heading">
        <div><p className="admin-eyebrow">Fulfillment</p><h1>Orders</h1><p>Review demo checkouts and update their progress.</p></div>
        <span className="admin-orders-count"><FiShoppingBag aria-hidden="true" /> {orders.length} orders</span>
      </header>

      <p className="admin-orders-note">Preview mode: orders are saved only in this browser. There is no live customer notification, payment, or shared order database yet.</p>
      {notice && <p className="admin-orders-feedback" role="status">{notice}</p>}

      <section className="admin-orders-panel" aria-labelledby="admin-orders-list-title">
        <div className="admin-orders-toolbar">
          <div><p className="admin-eyebrow">Store activity</p><h2 id="admin-orders-list-title">Order list</h2></div>
          <label className="admin-orders-search"><FiSearch aria-hidden="true" /><span className="admin-orders-visually-hidden">Search orders</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order or customer" /></label>
        </div>
        <div className="admin-orders-filters" role="tablist" aria-label="Filter orders by status">
          {filters.map((filter) => (
            <button className={activeFilter === filter ? "is-active" : ""} key={filter} type="button" role="tab" aria-selected={activeFilter === filter} onClick={() => setActiveFilter(filter)}>
              {filter}<span>{filter === "All" ? orders.length : orders.filter((order) => order.status === filter).length}</span>
            </button>
          ))}
        </div>

        {visibleOrders.length === 0 ? (
          <div className="admin-orders-empty"><FiPackage aria-hidden="true" /><strong>{orders.length ? "No matching orders" : "No orders yet"}</strong><span>{orders.length ? "Try another status or search term." : "Place a demo order through the storefront checkout to see it here."}</span></div>
        ) : (
          <div className="admin-orders-list">
            {visibleOrders.map((order) => (
              <article className="admin-order-card" key={order.id}>
                <div className="admin-order-card__top">
                  <div><strong>{order.id}</strong><span>{formatDate(order.createdAt)}</span></div>
                  <span className={`admin-order-status is-${String(order.status).toLowerCase()}`}>{order.status}</span>
                </div>
                <div className="admin-order-card__details">
                  <div><small>Customer</small><strong>{order.customer?.name || "Guest"}</strong><span>{order.customer?.phone || order.customer?.email || "No contact details"}</span></div>
                  <div><small>Items</small><strong>{(order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)} items</strong><span>{(order.items || []).map((item) => item.title).join(", ")}</span></div>
                  <div><small>Total</small><strong>${Number(order.total || 0).toFixed(2)}</strong><span>{order.discountCode ? `${order.discountCode} applied` : "No discount"}</span></div>
                </div>
                <details className="admin-order-card__more">
                  <summary>View order details</summary>
                  <div className="admin-order-card__expanded">
                    <div className="admin-order-items">
                      {(order.items || []).map((item) => (
                        <div className="admin-order-item" key={item.cartKey || item.productId}>
                          <img src={item.thumbnail} alt="" />
                          <div><strong>{item.title}</strong><span>Qty: {item.quantity}{Object.entries(item.variants || {}).map(([key, value]) => ` · ${key}: ${value}`).join("")}</span></div>
                          <strong>${(Number(item.price) * Number(item.quantity)).toFixed(2)}</strong>
                        </div>
                      ))}
                    </div>
                    <dl className="admin-order-customer">
                      <div><dt>Email</dt><dd>{order.customer?.email || "—"}</dd></div>
                      <div><dt>Address</dt><dd>{[order.customer?.address, order.customer?.city, order.customer?.region].filter(Boolean).join(", ") || "—"}</dd></div>
                      <div><dt>Payment</dt><dd>Cash on delivery · not collected</dd></div>
                      <div><dt>Subtotal</dt><dd>${Number(order.subtotal || 0).toFixed(2)}</dd></div>
                      {Number(order.discountAmount) > 0 && <div><dt>Discount</dt><dd>−${Number(order.discountAmount).toFixed(2)}</dd></div>}
                      <div><dt>Total</dt><dd>${Number(order.total || 0).toFixed(2)}</dd></div>
                    </dl>
                  </div>
                </details>
                <label className="admin-order-status-control"><span>Update status</span><select value={order.status} onChange={(event) => changeStatus(order.id, event.target.value)}>{orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminOrdersPage;
