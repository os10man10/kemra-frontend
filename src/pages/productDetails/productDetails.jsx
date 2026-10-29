import { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa6";
import { FaCartArrowDown } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { getProductVariantInventory, getProductVariantOptions } from "../../productVariants";
import { useRatings } from "../../RatingContext";
import RatingStars from "../../components/RatingStars";
import { getProduct } from "../../services/products";
import "./productDetails.css";

function ProductDetailsSkeleton() {
  return (
    <section
      className="product-details-page product-details-skeleton"
      aria-label="Loading product details"
      aria-busy="true"
    >
      <span className="product-details-loading-label" role="status">
        Loading product details
      </span>
      <div className="product-details-layout">
        <div className="product-gallery" aria-hidden="true">
          <div className="product-gallery-main">
            <span className="product-details-shimmer skeleton-main-image" />
          </div>
          <div className="product-gallery-thumbnails">
            {Array.from({ length: 4 }, (_, index) => (
              <span
                className="product-details-shimmer skeleton-thumbnail"
                key={index}
              />
            ))}
          </div>
        </div>

        <div className="product-details-info" aria-hidden="true">
          <span className="product-details-shimmer skeleton-category" />
          <span className="product-details-shimmer skeleton-title" />
          <span className="product-details-shimmer skeleton-rating" />
          <span className="product-details-shimmer skeleton-price" />
          <div className="skeleton-description">
            <span className="product-details-shimmer" />
            <span className="product-details-shimmer" />
            <span className="product-details-shimmer is-short" />
          </div>
          <div className="skeleton-variants">
            {Array.from({ length: 2 }, (_, groupIndex) => (
              <div className="skeleton-variant-group" key={groupIndex}>
                <span className="product-details-shimmer skeleton-variant-label" />
                <div>
                  {Array.from({ length: 3 }, (_, optionIndex) => (
                    <span
                      className="product-details-shimmer skeleton-variant-option"
                      key={optionIndex}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <span className="product-details-shimmer skeleton-stock" />
          <div className="skeleton-purchase-actions">
            <span className="product-details-shimmer skeleton-quantity" />
            <span className="product-details-shimmer skeleton-add-button" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedVariants, setSelectedVariants] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [cartFeedback, setCartFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const { addToCart } = useCart();
  const { ratings, setProductRating } = useRatings();

  useEffect(() => {
    const controller = new AbortController();

    const fetchProduct = async () => {
      setLoading(true);
      setError(false);
      setProduct(null);
      setSelectedImage("");
      setSelectedVariants({});
      setQuantity(1);
      setCartFeedback("");

      try {
        const data = await getProduct(id, { signal: controller.signal });
        setProduct(data);
        setSelectedImage(data.images?.[0] || data.thumbnail || "");
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchProduct();
    return () => controller.abort();
  }, [id, retryToken]);

  if (loading) {
    return <ProductDetailsSkeleton />;
  }

  if (error || !product) {
    return (
      <section className="product-details-state" role="alert">
        <h1>Product unavailable</h1>
        <p>We couldn’t load this product. Please try again.</p>
        <button
          className="product-retry-button"
          onClick={() => setRetryToken((current) => current + 1)}
          type="button"
        >
          Try again
        </button>
      </section>
    );
  }

  const images = product.images?.length
    ? product.images
    : product.thumbnail
      ? [product.thumbnail]
      : [];
  const variantGroups = getProductVariantOptions(product);
  const selectedVariantValues = Object.fromEntries(
    variantGroups.map((group) => {
      const currentValue = selectedVariants[group.key];
      const isValid = group.options.some((option) => option.value === currentValue);
      return [group.key, isValid ? currentValue : group.options[0].value];
    })
  );
  const selectedInventory = getProductVariantInventory(product, selectedVariantValues);
  const selectedPrice = selectedInventory.price;
  const selectedCompareAtPrice = selectedInventory.compareAtPrice;
  const selectedStock = selectedInventory.stock;

  const handleAddToCart = () => {
    if (selectedStock <= 0) return;

    const wasAdded = addToCart({ ...product, price: selectedPrice, stock: selectedStock }, selectedVariantValues, quantity);
    setCartFeedback(wasAdded
      ? `${wasAdded} × ${product.title} added to your demo cart.`
      : `You can’t add more ${product.title}; the available stock limit has been reached.`);
  };

  return (
    <section className="product-details-page">
      <div className="product-details-layout">
        <div className="product-gallery">
          <div className="product-gallery-main">
            {selectedImage && (
              <img src={selectedImage} alt={product.title} />
            )}
          </div>

          {images.length > 1 && (
            <div className="product-gallery-thumbnails" aria-label="Product images">
              {images.map((image, index) => (
                <button
                  className={`product-gallery-thumbnail${selectedImage === image ? " is-selected" : ""}`}
                  key={`${image}-${index}`}
                  onClick={() => setSelectedImage(image)}
                  type="button"
                  aria-label={`Show product image ${index + 1}`}
                  aria-pressed={selectedImage === image}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-details-info">
          <p className="product-details-category">
            {product.brand && <span>{product.brand}</span>}
            {product.brand && product.category && <span aria-hidden="true"> / </span>}
            {product.category && <span>{product.category}</span>}
          </p>

          <h1 className="product-details-title">{product.title}</h1>

          <div className="product-details-rating">
            <RatingStars rating={product.rating} />
            <span className="product-details-rating-label">Customer rating</span>
          </div>

          <div className="product-user-rating">
            <span className="product-user-rating-title">Your rating</span>
            <div className="product-user-rating-stars" role="group" aria-label="Choose your rating">
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;
                const isSelected = value <= (ratings[product.id] || 0);

                return (
                  <button
                    className={isSelected ? "is-selected" : ""}
                    key={value}
                    type="button"
                    aria-label={`Rate ${value} out of 5`}
                    aria-pressed={ratings[product.id] === value}
                    onClick={() => setProductRating(product.id, value)}
                  >
                    <FaStar aria-hidden="true" />
                  </button>
                );
              })}
              {ratings[product.id] > 0 && <span>{ratings[product.id]}/5</span>}
            </div>
            <p className="product-user-rating-note">
              {ratings[product.id]
                ? "Your rating is saved on this device."
                : "Choose a star to rate this product."}
            </p>
          </div>

          <div className="product-details-price-row">
            <p className="product-details-price">${Number(selectedPrice).toFixed(2)}</p>
            {selectedCompareAtPrice > selectedPrice && <del className="product-details-compare-at">${selectedCompareAtPrice.toFixed(2)}</del>}
            {(selectedCompareAtPrice > selectedPrice || product.discountPercentage > 0) && (
              <span className="product-details-discount">
                {selectedCompareAtPrice > selectedPrice
                  ? `${Math.round(((selectedCompareAtPrice - selectedPrice) / selectedCompareAtPrice) * 100)}% off`
                  : `${Math.round(product.discountPercentage)}% off`}
              </span>
            )}
          </div>

          <p className="product-details-description">{product.description}</p>

          {variantGroups.length > 0 && (
            <div className="product-variant-picker">
              {variantGroups.map((group) => {
                const currentValue = selectedVariants[group.key];
                const selectedValue = group.options.some(
                  (option) => option.value === currentValue
                )
                  ? currentValue
                  : group.options[0].value;

                return (
                  <fieldset className="product-variant-group" key={group.key}>
                    <legend>
                        {group.label}: <span>{group.options.find((option) => option.value === selectedValue)?.label}</span>
                    </legend>
                    <div className={group.key === "color" ? "product-variant-options is-colors" : "product-variant-options"}>
                      {group.options.map((option) => (
                        <button
                          className={`product-variant-option${selectedValue === option.value ? " is-selected" : ""}${option.swatch ? " has-swatch" : ""}`}
                          key={option.value}
                          onClick={() => {
                            const nextSelection = { ...selectedVariantValues, [group.key]: option.value };
                            setSelectedVariants(nextSelection);
                            const nextStock = getProductVariantInventory(product, nextSelection).stock;
                            setQuantity((current) => Math.min(current, Math.max(nextStock, 1)));
                          }}
                          type="button"
                          aria-label={`${group.label}: ${option.label}`}
                          aria-pressed={selectedValue === option.value}
                          title={option.label}
                        >
                          {option.swatch ? (
                            <span
                              className="product-variant-swatch"
                              style={{ "--variant-swatch": option.swatch }}
                            />
                          ) : (
                            option.label
                          )}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                );
              })}
              <p className="product-variant-demo-note">
                {product.variants?.length
                  ? "Option price and stock are set separately in this browser demo."
                  : "These are sample options; live variant data will be connected to the store backend."}
              </p>
            </div>
          )}

          <p className={`product-details-stock${selectedStock <= 0 ? " is-out-of-stock" : ""}`}>
            <span className="product-details-stock-dot" />
            {selectedStock > 0
              ? `${selectedStock <= 5 || product.availabilityStatus === "Low Stock" ? "Low stock" : "In stock"} · ${selectedStock} available`
              : "Out of stock"}
          </p>

          <div className="product-purchase-actions">
            <div className="product-quantity-picker" aria-label="Choose quantity">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={quantity <= 1 || selectedStock <= 0}
              >
                −
              </button>
              <output aria-live="polite">{quantity}</output>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((current) => Math.min(selectedStock, current + 1))}
                disabled={quantity >= selectedStock || selectedStock <= 0}
              >
                +
              </button>
            </div>
            <button
              className="product-add-to-cart"
              type="button"
              onClick={handleAddToCart}
              disabled={selectedStock <= 0}
            >
              <FaCartArrowDown aria-hidden="true" />
              {selectedStock > 0 ? "Add to cart" : "Out of stock"}
            </button>
          </div>

          <p className="product-cart-feedback" role="status" aria-live="polite">
            {cartFeedback}
          </p>
          <p className="product-cart-demo-note">
            Demo cart only — checkout will be available when the store backend is connected.
          </p>

          {product.tags?.length > 0 && (
            <div className="product-details-tags" aria-label="Product tags">
              {product.tags.slice(0, 4).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ProductDetails;
