import { Link } from "react-router-dom";
import { FaMinus, FaPlus, FaTrash } from "react-icons/fa6";
import { useCart } from "../context/CartContext";
import DiscountCodeField from "../components/DiscountCodeField";
import "./cart.css";

const variantLabels = { color: "Color", size: "Size", volume: "Size" };

function CartPage() {
  const { items, itemCount, subtotal, discountAmount, updateQuantity, removeFromCart } = useCart();
  const unavailableItems = items.filter((item) =>
    item.stock === 0 || item.quantity < 1 || (item.stock != null && item.quantity > item.stock)
  );
  const total = Math.max(0, subtotal - discountAmount);

  return (
    <section className="cart-page container">
      <div className="cart-page-heading">
        <p className="cart-eyebrow">Shopping cart</p>
        <h1>Your cart</h1>
        <p>{itemCount} {itemCount === 1 ? "item" : "items"}</p>
      </div>

      {items.length === 0 ? (
        <div className="cart-empty-state">
          <h2>Your cart is empty</h2>
          <p>Explore the collection and add something you love.</p>
          <Link className="cart-continue-button" to="/">Continue shopping</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items-list">
            {items.map((item) => (
              <article className="cart-item" key={item.cartKey}>
                <Link className="cart-item-image" to={`/products/${item.productId}`}>
                  <img src={item.thumbnail} alt={item.title} />
                </Link>
                <div className="cart-item-info">
                  <Link className="cart-item-title" to={`/products/${item.productId}`}>{item.title}</Link>
                  <div className="cart-item-variants">
                    {Object.entries(item.variants || {}).map(([key, value]) => (
                      <span key={key}>{variantLabels[key] || key}: {value}</span>
                    ))}
                  </div>
                  <p className="cart-item-price">${Number(item.price).toFixed(2)}</p>
                  {(item.stock === 0 || item.quantity === 0) && <p className="cart-item-stock-warning">Out of stock — remove this item to continue.</p>}
                  <div className="cart-item-actions">
                    <div className="cart-quantity-control" aria-label={`Quantity for ${item.title}`}>
                      <button type="button" disabled={item.stock === 0 || item.quantity === 0 || item.quantity <= 1} onClick={() => updateQuantity(item.cartKey, item.quantity - 1)} aria-label="Decrease quantity">
                        <FaMinus />
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" disabled={item.stock === 0 || item.quantity === 0 || (item.stock != null && items.filter((other) => other.cartKey !== item.cartKey && (other.inventoryKey ?? String(other.productId)) === (item.inventoryKey ?? String(item.productId))).reduce((total, other) => total + other.quantity, item.quantity) >= item.stock)} onClick={() => updateQuantity(item.cartKey, item.quantity + 1)} aria-label="Increase quantity">
                        <FaPlus />
                      </button>
                    </div>
                    <button className="cart-remove-button" type="button" onClick={() => removeFromCart(item.cartKey)}>
                      <FaTrash /> Remove
                    </button>
                  </div>
                </div>
                <p className="cart-item-total">{item.stock === 0 || item.quantity === 0 ? "Unavailable" : `$${(item.price * item.quantity).toFixed(2)}`}</p>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Order summary</h2>
            <DiscountCodeField />
            <div className="cart-summary-line"><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
            {discountAmount > 0 && <div className="cart-summary-line cart-summary-discount"><span>Discount</span><strong>−${discountAmount.toFixed(2)}</strong></div>}
            <div className="cart-summary-line"><span>Shipping</span><span>Calculated later</span></div>
            <div className="cart-summary-total"><span>Total</span><strong>${total.toFixed(2)}</strong></div>
            {unavailableItems.length > 0 ? (
              <>
                <p className="cart-checkout-warning" role="status">
                  Remove unavailable items or adjust quantities before checkout.
                </p>
                <button className="cart-checkout-button is-disabled" type="button" disabled>
                  Checkout unavailable
                </button>
              </>
            ) : (
              <Link className="cart-checkout-button" to="/checkout">Continue to checkout</Link>
            )}
            <Link className="cart-continue-link" to="/">Continue shopping</Link>
          </aside>
        </div>
      )}
    </section>
  );
}

export default CartPage;
