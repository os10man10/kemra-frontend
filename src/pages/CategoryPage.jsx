import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Product, { ProductSkeleton } from "../components/slide Products/Product";
import { getProductsByCategory } from "../services/products";
import { getAdminCollections } from "./Admin/adminCollections";
import NotFoundPage from "./NotFoundPage";
import "../components/slide Products/SlideProduct.css";
import "./CategoryPage.css";

function CategoryPage() {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const selectedAudience = searchParams.get("audience")?.toLowerCase() || "";
  const categoryTitles = Object.fromEntries(getAdminCollections().map(({ slug, name }) => [slug, name]));
  if (!categoryTitles[category]) return <NotFoundPage />;
  return <CategoryPageContent key={`${category}:${selectedAudience}`} category={category} categoryTitle={categoryTitles[category]} selectedAudience={selectedAudience} />;
}

function CategoryPageContent({ category, categoryTitle, selectedAudience }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const [sortBy, setSortBy] = useState("featured");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const title = categoryTitle || category.replaceAll("-", " ");
  const categoryConfig = getAdminCollections().find((item) => item.slug === category);
  const audienceOptions = categoryConfig?.audiences || [];
  const audienceLabel = audienceOptions.find((audience) => audience.toLowerCase() === selectedAudience);
  const audienceHasNoSource = Boolean(
    audienceLabel
    && categoryConfig?.audienceProductCategories
    && Object.hasOwn(categoryConfig.audienceProductCategories, selectedAudience)
    && categoryConfig.audienceProductCategories[selectedAudience].length === 0
  );
  const hasAudienceData = products.some((product) => product.audience || product.gender || product.targetAudience);
  const audienceProducts = !audienceLabel || !hasAudienceData
    ? products
    : products.filter((product) => {
        const productAudience = product.audience || product.gender || product.targetAudience;
        const normalizedAudience = Array.isArray(productAudience)
          ? productAudience.map((value) => String(value).toLowerCase())
          : String(productAudience).toLowerCase().split(/[\s,;/|]+/);
        if (!productAudience) return true;
        return normalizedAudience.includes(selectedAudience);
      });
  const visibleProducts = useMemo(() => {
    const filtered = audienceProducts.filter((product) => {
      const matchesMinimum = minimumPrice === "" || product.price >= Number(minimumPrice);
      const matchesMaximum = maximumPrice === "" || product.price <= Number(maximumPrice);
      const matchesStock = !inStockOnly || product.stock > 0;
      return matchesMinimum && matchesMaximum && matchesStock;
    });

    if (sortBy === "price-low") filtered.sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") filtered.sort((a, b) => b.price - a.price);
    if (sortBy === "rating") filtered.sort((a, b) => b.rating - a.rating);
    return filtered;
  }, [audienceProducts, minimumPrice, maximumPrice, inStockOnly, sortBy]);

  const hasActiveFilters = minimumPrice !== "" || maximumPrice !== "" || inStockOnly;

  const clearFilters = () => {
    setMinimumPrice("");
    setMaximumPrice("");
    setInStockOnly(false);
    setSortBy("featured");
  };

  const retryLoading = () => {
    setProducts([]);
    setError("");
    setLoading(true);
    setRetryToken((current) => current + 1);
  };

  useEffect(() => {
    const controller = new AbortController();

    getProductsByCategory(category, {
      limit: 0,
      audience: selectedAudience,
      signal: controller.signal,
    })
      .then((categoryProducts) => {
        if (!controller.signal.aborted) setProducts(categoryProducts);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError("We couldn’t load these products. Please try again.");
          setProducts([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [category, selectedAudience, retryToken]);

  return (
    <section className="category-page container" aria-labelledby="category-page-title">
      <header className="category-page-heading">
        <p className="category-page-eyebrow">Explore collection</p>
        <h2 id="category-page-title">
          {title}{audienceLabel ? ` · ${audienceLabel}` : ""}
        </h2>
        {!loading && !error && audienceLabel && !hasAudienceData && (
          <p className="category-page-audience-note">
            Audience-specific results will appear when the product data includes audience details.
          </p>
        )}
        {!loading && !error && (
          <p>
            Showing {visibleProducts.length} of {audienceProducts.length} products
          </p>
        )}
      </header>

      {error && (
        <div className="category-page-error" role="alert">
          <p className="category-page-message is-error">{error}</p>
          <button className="category-page-retry" type="button" onClick={retryLoading}>
            Try again
          </button>
        </div>
      )}
      {!loading && !error && products.length > 0 && (
        <div className="category-page-toolbar" aria-label="Product filters and sorting">
          <label className="category-page-sort">
            <span>Sort by</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="featured">Recommended</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
          </label>

          <div className="category-page-price-filter">
            <span>Price</span>
            <label>
              <span className="visually-hidden">Minimum price</span>
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={minimumPrice}
                onChange={(event) => setMinimumPrice(event.target.value)}
              />
            </label>
            <span aria-hidden="true">–</span>
            <label>
              <span className="visually-hidden">Maximum price</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={maximumPrice}
                onChange={(event) => setMaximumPrice(event.target.value)}
              />
            </label>
          </div>

          <label className="category-page-stock-filter">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) => setInStockOnly(event.target.checked)}
            />
            <span>In stock</span>
          </label>

          {(hasActiveFilters || sortBy !== "featured") && (
            <button className="category-page-clear" type="button" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}
      {loading && (
        <div className="category-page-grid" aria-label={`Loading ${title}`}>
          {Array.from({ length: 6 }, (_, index) => <ProductSkeleton key={index} />)}
        </div>
      )}
      {!loading && !error && products.length === 0 && (
          <p className="category-page-message">
          {audienceHasNoSource
            ? "This collection is coming soon."
            : "No products are available in this collection yet."}
        </p>
      )}
      {!loading && !error && products.length > 0 && visibleProducts.length === 0 && (
        <p className="category-page-message">No products match these filters.</p>
      )}
      {!loading && !error && visibleProducts.length > 0 && (
        <div className="category-page-grid">
          {visibleProducts.map((product) => <Product key={product.id} item={product} />)}
        </div>
      )}
    </section>
  );
}

export default CategoryPage;
