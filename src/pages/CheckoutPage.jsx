import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import DiscountCodeField from "../components/DiscountCodeField";
import { createAdminOrder } from "./Admin/adminOrders";
import "./checkout.css";

const variantLabels = { color: "Color", size: "Size", volume: "Size" };

function CheckoutPage() {
  const { items, subtotal, discountCode, discountAmount, clearCart } = useCart();
  const [demoCustomer, setDemoCustomer] = useState(null);
  const [demoOrder, setDemoOrder] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const unavailableItems = items.filter((item) =>
    item.stock === 0 || item.quantity < 1 || (item.stock != null && item.quantity > item.stock)
  );
  const total = Math.max(0, subtotal - discountAmount);
  const confirmationItems = demoOrder?.items || items;
  const confirmationSubtotal = demoOrder?.subtotal ?? subtotal;
  const confirmationDiscountCode = demoOrder?.discountCode || "";
  const confirmationDiscountAmount = demoOrder?.discountAmount || 0;
  const confirmationTotal = demoOrder?.total ?? total;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (unavailableItems.length > 0) return;
    const formData = new FormData(event.currentTarget);
    const customer = Object.fromEntries(formData.entries());
    const order = createAdminOrder({
      customer,
      items: items.map((item) => ({
        cartKey: item.cartKey,
        productId: item.productId,
        title: item.title,
        thumbnail: item.thumbnail,
        price: item.price,
        quantity: item.quantity,
        variants: item.variants || {},
      })),
      subtotal,
      discountCode,
      discountAmount,
      total,
      paymentMethod: customer.payment || "cash-on-delivery",
    });
    if (!order) {
      setSubmitError("This browser could not save the demo order. Please try again.");
      return;
    }
    setSubmitError("");
    setDemoCustomer(customer);
    setDemoOrder(order);
    clearCart();
  };

  if (items.length === 0 && !demoOrder) {
    return (
      <section className="checkout-page container">
        <div className="checkout-empty">
          <p className="checkout-eyebrow">Checkout</p>
          <h1>Your cart is empty</h1>
          <p>Add a product to your cart before continuing.</p>
          <Link to="/">Explore the collection</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-page container" aria-labelledby="checkout-title">
      <header className="checkout-heading">
        <p className="checkout-eyebrow">Almost yours</p>
        <h1 id="checkout-title">Checkout</h1>
        <p>Enter your delivery details to review your order.</p>
      </header>

      {demoCustomer ? (
        <div className="checkout-confirmation" role="status" aria-live="polite">
          <header className="checkout-confirmation__heading">
            <span className="checkout-success__mark" aria-hidden="true">✓</span>
            <p className="checkout-eyebrow">Checkout preview</p>
            <h2>Order placed</h2>
            <p>Your demo order was saved in this browser. No payment or real notification was sent.</p>
            {demoOrder && <span className="checkout-order-number">Order {demoOrder.id}</span>}
          </header>

          <div className="checkout-confirmation__grid">
            <section className="checkout-confirmation__delivery" aria-labelledby="confirmation-delivery-title">
              <h3 id="confirmation-delivery-title">Delivery details</h3>
              <dl>
                <div><dt>Name</dt><dd>{demoCustomer.name}</dd></div>
                <div><dt>Phone</dt><dd>{demoCustomer.phone}</dd></div>
                <div><dt>Email</dt><dd>{demoCustomer.email}</dd></div>
                <div><dt>Address</dt><dd>{demoCustomer.address}</dd></div>
                <div><dt>City</dt><dd>{demoCustomer.city}</dd></div>
                <div><dt>Area / Governorate</dt><dd>{demoCustomer.region}</dd></div>
              </dl>
            </section>

            <aside className="checkout-summary" aria-labelledby="confirmation-summary-title">
              <h3 id="confirmation-summary-title">Order summary</h3>
              <div className="checkout-summary__items">
                {confirmationItems.map((item) => (
                  <article className="checkout-summary__item" key={item.cartKey}>
                    <div className="checkout-summary__image">
                      <img src={item.thumbnail} alt="" />
                      <span>{item.quantity}</span>
                    </div>
                    <div className="checkout-summary__details">
                      <strong>{item.title}</strong>
                      {Object.entries(item.variants || {}).map(([key, value]) => (
                        <small key={key}>{variantLabels[key] || key}: {value}</small>
                      ))}
                      <small>Qty: {item.quantity}</small>
                    </div>
                    <strong className="checkout-summary__price">${(item.price * item.quantity).toFixed(2)}</strong>
                  </article>
                ))}
              </div>
              <div className="checkout-summary__line"><span>Subtotal</span><strong>${confirmationSubtotal.toFixed(2)}</strong></div>
              {confirmationDiscountAmount > 0 && <div className="checkout-summary__line checkout-summary__discount"><span>Discount {confirmationDiscountCode && `(${confirmationDiscountCode})`}</span><strong>−${confirmationDiscountAmount.toFixed(2)}</strong></div>}
              <div className="checkout-summary__line"><span>Shipping</span><span>Calculated later</span></div>
              <div className="checkout-summary__total"><span>Total</span><strong>${confirmationTotal.toFixed(2)}</strong></div>
              <p className="checkout-demo-note">No payment was collected.</p>
            </aside>
          </div>

          <Link className="checkout-confirmation__continue" to="/">Continue shopping</Link>
        </div>
      ) : (
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit}>
            {submitError && <p className="checkout-submit-error" role="alert">{submitError}</p>}
            {unavailableItems.length > 0 && (
              <div className="checkout-stock-warning" role="alert">
                <p>Some items in your cart are unavailable or exceed the available stock.</p>
                <Link to="/cart">Review your cart</Link>
              </div>
            )}
            <section className="checkout-form__section" aria-labelledby="delivery-title">
              <div className="checkout-form__section-heading">
                <span>01</span>
                <div>
                  <h2 id="delivery-title">Delivery information</h2>
                  <p>Where should we send your order?</p>
                </div>
              </div>

              <div className="checkout-fields">
                <label className="checkout-field">
                  <span>Full name</span>
                  <input name="name" type="text" autoComplete="name" placeholder="Your full name" required />
                </label>
                <label className="checkout-field">
                  <span>Phone number</span>
                  <input name="phone" type="tel" autoComplete="tel" placeholder="Your phone number" required />
                </label>
                <label className="checkout-field checkout-field--full">
                  <span>Email address</span>
                  <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
                </label>
                <label className="checkout-field checkout-field--full">
                  <span>Street address</span>
                  <input name="address" type="text" autoComplete="street-address" placeholder="Building, street, apartment" required />
                </label>
                <label className="checkout-field">
                  <span>City</span>
                  <input name="city" type="text" autoComplete="address-level2" placeholder="Your city" required />
                </label>
                <label className="checkout-field">
                  <span>Area / Governorate</span>
                  <input name="region" type="text" autoComplete="address-level1" placeholder="Your area" required />
                </label>
              </div>
            </section>

            <section className="checkout-form__section checkout-payment" aria-labelledby="payment-title">
              <div className="checkout-form__section-heading">
                <span>02</span>
                <div>
                  <h2 id="payment-title">Payment method</h2>
                  <p>Payment options will be finalized with the backend.</p>
                </div>
              </div>
              <label className="checkout-payment__option">
                <input type="radio" name="payment" value="cash-on-delivery" defaultChecked />
                <span className="checkout-payment__radio" aria-hidden="true" />
                <span>
                  <strong>Cash on delivery</strong>
                  <small>Demo selection · no payment will be collected</small>
                </span>
              </label>
            </section>

            <button className="checkout-submit" type="submit" disabled={unavailableItems.length > 0}>
              {unavailableItems.length > 0 ? "Review unavailable items" : "Place demo order"}
              {unavailableItems.length === 0 && <span aria-hidden="true">→</span>}
            </button>
            <p className="checkout-demo-note">Preview only — this saves a local demo order without charging payment.</p>
          </form>

          <aside className="checkout-summary" aria-labelledby="checkout-summary-title">
            <h2 id="checkout-summary-title">Order summary</h2>
            <DiscountCodeField />
            <div className="checkout-summary__items">
              {items.map((item) => (
                <article className="checkout-summary__item" key={item.cartKey}>
                  <div className="checkout-summary__image">
                    <img src={item.thumbnail} alt="" />
                    <span>{item.quantity}</span>
                  </div>
                  <div className="checkout-summary__details">
                    <strong>{item.title}</strong>
                    {Object.entries(item.variants || {}).map(([key, value]) => (
                      <small key={key}>{variantLabels[key] || key}: {value}</small>
                    ))}
                    <small>Qty: {item.quantity}</small>
                  </div>
                  <strong className="checkout-summary__price">${(item.price * item.quantity).toFixed(2)}</strong>
                </article>
              ))}
            </div>
            <div className="checkout-summary__line"><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
            {discountAmount > 0 && <div className="checkout-summary__line checkout-summary__discount"><span>Discount {discountCode && `(${discountCode})`}</span><strong>−${discountAmount.toFixed(2)}</strong></div>}
            <div className="checkout-summary__line"><span>Shipping</span><span>Calculated later</span></div>
            <div className="checkout-summary__total"><span>Total</span><strong>${total.toFixed(2)}</strong></div>
            <Link className="checkout-summary__back" to="/cart">Edit cart</Link>
          </aside>
        </div>
      )}
    </section>
  );
}

export default CheckoutPage;
