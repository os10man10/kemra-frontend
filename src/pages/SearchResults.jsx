import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Product, { ProductSkeleton } from "../components/slide Products/Product";
import { searchProducts } from "../services/products";
import "../components/slide Products/SlideProduct.css";
import "./SearchResults.css";

function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  return <SearchResultsContent key={query} query={query} />;
}

function SearchResultsContent({ query }) {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(Boolean(query));
  const [error, setError] = useState("");
  const [retryToken, setRetryToken] = useState(0);

  const retrySearch = () => {
    setProducts([]);
    setTotal(0);
    setError("");
    setLoading(true);
    setRetryToken((current) => current + 1);
  };

  useEffect(() => {
    if (!query) return undefined;

    const controller = new AbortController();

    searchProducts(query, { limit: 0, signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setProducts(data.products || []);
        setTotal(data.total || 0);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError("We couldn’t complete the search. Please try again.");
          setProducts([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [query, retryToken]);

  return (
    <section className="search-results-page container" aria-labelledby="search-results-title">
      <header className="search-results-heading">
        <p className="search-results-eyebrow">Kemra collection</p>
        <h2 id="search-results-title">
          {query ? <>Search results for <span>“{query}”</span></> : "Search all products"}
        </h2>
        {!loading && !error && query && (
          <p className="search-results-count">
          {total} {total === 1 ? "product" : "products"} found
          </p>
        )}
      </header>

      {!query && <p className="search-results-message">Enter a product name in the search bar to get started.</p>}
      {error && (
        <div className="search-results-error" role="alert">
          <p className="search-results-message is-error">{error}</p>
          <button className="search-results-retry" type="button" onClick={retrySearch}>
            Try again
          </button>
        </div>
      )}
      {loading && (
        <div className="search-results-grid" aria-label="Loading search results">
          {Array.from({ length: 6 }, (_, index) => <ProductSkeleton key={index} />)}
        </div>
      )}
      {!loading && !error && query && products.length === 0 && (
        <p className="search-results-message">No products matched your search. Try another name.</p>
      )}
      {!loading && !error && products.length > 0 && (
        <div className="search-results-grid">
          {products.map((product) => <Product key={product.id} item={product} />)}
        </div>
      )}
    </section>
  );
}

export default SearchResults;
