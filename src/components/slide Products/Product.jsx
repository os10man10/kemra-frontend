import { useEffect, useState } from "react";
import { FaCheck, FaHeart } from "react-icons/fa6";
import { FaCartArrowDown } from "react-icons/fa";
import { CiHeart } from "react-icons/ci";
import { FaShare } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useFavorites } from "../../FavoritesContext";
import { getProductVariantInventory, getProductVariantOptions } from "../../productVariants";
import RatingStars from "../RatingStars";

export function ProductSkeleton() {
  return (
    <div className="product product-skeleton" aria-hidden="true">
      <div className="img_product">
        <span className="skeleton-shimmer skeleton-product-image" />
      </div>
      <div className="skeleton-product-name">
        <span className="skeleton-shimmer skeleton-product-line" />
        <span className="skeleton-shimmer skeleton-product-line is-short" />
      </div>
      <div className="skeleton-product-rating">
        {Array.from({ length: 5 }, (_, index) => (
          <span className="skeleton-shimmer skeleton-rating-star" key={index} />
        ))}
      </div>
      <span className="skeleton-shimmer skeleton-product-price" />
    </div>
  );
}

function Product({ item }) {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(item.id);
  const variantGroups = getProductVariantOptions(item);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [added, setAdded] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");
  const [selectedVariants, setSelectedVariants] = useState(() =>
    Object.fromEntries(variantGroups.map((group) => [group.key, group.options[0].value]))
  );

  useEffect(() => {
    if (!added) return undefined;
    const timeoutId = window.setTimeout(() => setAdded(false), 1600);
    return () => window.clearTimeout(timeoutId);
  }, [added]);

  useEffect(() => {
    if (!shareFeedback) return undefined;
    const timeoutId = window.setTimeout(() => setShareFeedback(""), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [shareFeedback]);

  const handleShareClick = async () => {
    const productUrl = new URL(`/products/${encodeURIComponent(item.id)}`, window.location.origin).href;
    const shareData = { title: item.title, text: `Check out ${item.title}`, url: productUrl };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(productUrl);
      } else {
        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = productUrl;
        temporaryInput.setAttribute("readonly", "");
        temporaryInput.style.position = "fixed";
        temporaryInput.style.opacity = "0";
        document.body.appendChild(temporaryInput);
        temporaryInput.select();
        const copied = document.execCommand("copy");
        temporaryInput.remove();
        if (!copied) throw new Error("Clipboard access is unavailable");
      }
      setShareFeedback("Link copied");
    } catch {
      setShareFeedback("Could not copy link");
    }
  };

  const handleCartClick = () => {
    if (variantGroups.length > 0) {
      setShowQuickAdd(true);
      return;
    }

    setAdded(addToCart(item, {}, 1));
  };

  const confirmQuickAdd = () => {
    const wasAdded = addToCart(item, selectedVariants, 1);
    setShowQuickAdd(false);
    setAdded(wasAdded);
  };
  const quickAddInventory = getProductVariantInventory(item, selectedVariants);
  const lowestPricedVariant = item.variants?.length
    ? item.variants.filter((variant) => Number(variant.price) === Number(item.price))[0]
    : null;
  const compareAtPrice = Number(lowestPricedVariant?.compareAtPrice ?? item.compareAtPrice ?? 0);
  const isOnSale = compareAtPrice > Number(item.price);

  return (
    <article className="product">
      <Link className="product-main-link" to={`/products/${item.id}`} aria-label={`View ${item.title}`}>
        <div className="img_product">
          <img src={item.images?.[0] || item.thumbnail} alt={item.title} />
        </div>
        <p className="name-product">{item.title}</p>
        <div className="star">
          <RatingStars rating={item.rating} />
        </div>
        <p className="price-row"><span className="price">{item.variants?.length ? `From $${Number(item.price).toFixed(2)}` : `$${Number(item.price).toFixed(2)}`}</span>{isOnSale && <del className="compare-at-price">${compareAtPrice.toFixed(2)}</del>}</p>
      </Link>

      <div className="icons">
        <button
          className="product-cart-button"
          type="button"
          aria-label={`Add ${item.title} to cart`}
          disabled={item.stock <= 0}
          onClick={handleCartClick}
        >
          <FaCartArrowDown />
        </button>
        <button
          className={`product-favorite-button${favorite ? " is-favorite" : ""}`}
          type="button"
          aria-label={favorite ? `Remove ${item.title} from favorites` : `Add ${item.title} to favorites`}
          aria-pressed={favorite}
          onClick={() => toggleFavorite(item)}
        >
          {favorite ? <FaHeart /> : <CiHeart />}
        </button>
        <button
          className="product-share-button"
          type="button"
          aria-label={`Share ${item.title}`}
          onClick={handleShareClick}
        >
          <FaShare />
        </button>
      </div>

      {shareFeedback && (
        <div className="product-share-feedback" role="status" aria-live="polite">
          {shareFeedback}
        </div>
      )}

      {added && (
        <div className="product-cart-confirmation" role="status" aria-live="polite">
          <FaCheck />
          <span>In Cart</span>
        </div>
      )}

      {showQuickAdd && (
        <div className="product-quick-add-backdrop" onClick={() => setShowQuickAdd(false)}>
          <section
            className="product-quick-add"
            role="dialog"
            aria-modal="true"
            aria-label={`Choose options: ${item.title}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="product-quick-add-close" type="button" onClick={() => setShowQuickAdd(false)} aria-label="Close">
              ×
            </button>
            <h3>Choose options</h3>
            {variantGroups.map((group) => (
              <fieldset className="product-quick-add-group" key={group.key}>
                <legend>{group.label}</legend>
                <div className="product-quick-add-options">
                  {group.options.map((option) => (
                    <button
                      className={`product-quick-add-option${selectedVariants[group.key] === option.value ? " is-selected" : ""}${option.swatch ? " has-swatch" : ""}`}
                      key={option.value}
                      type="button"
                      aria-pressed={selectedVariants[group.key] === option.value}
                      aria-label={option.label}
                      onClick={() => setSelectedVariants((current) => ({ ...current, [group.key]: option.value }))}
                    >
                      {option.swatch && <span className="product-quick-add-swatch" style={{ "--variant-swatch": option.swatch }} />}
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
            <button className="product-quick-add-submit" type="button" onClick={confirmQuickAdd} disabled={quickAddInventory.stock <= 0}>
              {quickAddInventory.stock > 0 ? `Add to cart · $${quickAddInventory.price.toFixed(2)}` : "Out of stock"}
            </button>
          </section>
        </div>
      )}
    </article>
  );
}

export default Product;
