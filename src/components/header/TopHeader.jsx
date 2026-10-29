import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { FaRegHeart } from "react-icons/fa";
import { BsCart4 } from "react-icons/bs";
import { useCart } from "../../context/CartContext";
import { useFavorites } from "../../FavoritesContext";
import { searchProducts } from "../../services/products";
import { useEffect, useRef, useState } from "react";
import "./header.css";

function TopHeader() {
  const { itemCount } = useCart();
  const { favoriteCount } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const searchWrapRef = useRef(null);
  const currentLocation = `${location.pathname}${location.search}`;
  const [syncedLocation, setSyncedLocation] = useState(currentLocation);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  // Reset search UI only when navigation changes the URL (including back/forward).
  // Keeping the previous location lets React apply this state transition before paint.
  if (syncedLocation !== currentLocation) {
    const params = new URLSearchParams(location.search);
    setSyncedLocation(currentLocation);
    setQuery(location.pathname === "/search" ? params.get("q") || "" : "");
    setSuggestions([]);
    setSuggestionsLoading(false);
    setSuggestionsError("");
    setIsSearchOpen(false);
    setActiveSuggestion(-1);
  }

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) return undefined;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      setSuggestionsError("");
      try {
        const data = await searchProducts(trimmedQuery, { limit: 5, signal: controller.signal });
        if (!controller.signal.aborted) setSuggestions(data.products || []);
      } catch (error) {
        if (error.name !== "AbortError") {
          setSuggestions([]);
          setSuggestionsError("Suggestions are unavailable right now.");
        }
      } finally {
        if (!controller.signal.aborted) setSuggestionsLoading(false);
      }
    }, 280);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const closeSearchOnOutsideClick = (event) => {
      if (!searchWrapRef.current?.contains(event.target)) setIsSearchOpen(false);
    };
    document.addEventListener("pointerdown", closeSearchOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeSearchOnOutsideClick);
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    setIsSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  };

  const openProduct = (product) => {
    setIsSearchOpen(false);
    navigate(`/products/${product.id}`);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsSearchOpen(false);
      setActiveSuggestion(-1);
      return;
    }

    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setIsSearchOpen(true);
      setActiveSuggestion((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setActiveSuggestion((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === "Enter" && activeSuggestion >= 0 && suggestions[activeSuggestion]) {
      event.preventDefault();
      openProduct(suggestions[activeSuggestion]);
    }
  };

  return (
    <div className="top-header">
      <div className="container">
        <Link  to="/">
          <img src="/kemra-logo.svg" alt="Kemra Logo" className="logo" />
          <h1 className="title">Kemra<br /> Store</h1>
        </Link>

        <div className="search-box-wrap" ref={searchWrapRef}>
          <form className="search-box" role="search" onSubmit={submitSearch}>
            <input
              type="search"
              name="search"
              id="search"
              placeholder="Search Kemra products..."
              autoComplete="off"
              value={query}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isSearchOpen && query.trim().length >= 2}
              aria-controls="product-search-suggestions"
              aria-activedescendant={activeSuggestion >= 0 ? `search-suggestion-${activeSuggestion}` : undefined}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);
                setSuggestionsError("");
                setSuggestions([]);
                if (nextQuery.trim().length < 2) {
                  setSuggestions([]);
                  setSuggestionsLoading(false);
                }
                setActiveSuggestion(-1);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
            />
            <button type="submit" aria-label="Search products">
              <FaSearch />
            </button>
          </form>

          {isSearchOpen && query.trim().length >= 2 && (
            <div className="search-suggestions" id="product-search-suggestions" role="listbox" aria-label="Product suggestions">
              {suggestionsLoading ? (
              <p className="search-suggestions-message" role="status">Searching products…</p>
              ) : suggestionsError ? (
                <div className="search-suggestions-error" role="alert">
                  <p className="search-suggestions-message">{suggestionsError} Press Enter to open search results.</p>
                </div>
              ) : suggestions.length > 0 ? (
                <>
                  {suggestions.map((product, index) => (
                    <button
                      className={`search-suggestion${activeSuggestion === index ? " is-active" : ""}`}
                      id={`search-suggestion-${index}`}
                      key={product.id}
                      type="button"
                      role="option"
                      aria-selected={activeSuggestion === index}
                      onClick={() => openProduct(product)}
                    >
                      <img src={product.thumbnail} alt="" />
                      <span className="search-suggestion-details">
                        <span className="search-suggestion-title">{product.title}</span>
                        <span className="search-suggestion-category">{product.category}</span>
                      </span>
                      <span className="search-suggestion-price">${product.price}</span>
                    </button>
                  ))}
                  <button className="search-all-results" type="button" onClick={submitSearch}>
                    See all results for “{query.trim()}”
                  </button>
                </>
              ) : (
                <p className="search-suggestions-message">No matching products. Press Enter to see all results.</p>
              )}
            </div>
          )}
        </div>
        <div className="header-icons">
          <Link className="icon" to="/favorites" aria-label={`Favorites, ${favoriteCount} items`}>
            <FaRegHeart />
            <span className="icon-count">{favoriteCount}</span>
          </Link>
          <Link className="icon" to="/cart" aria-label={`Cart, ${itemCount} items`}>
            <BsCart4 />
            <span className="icon-count">{itemCount}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TopHeader;
