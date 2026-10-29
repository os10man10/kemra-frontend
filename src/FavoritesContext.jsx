import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { storeProductCategories } from "./data/storeCategories";

const FavoritesContext = createContext(null);
const FAVORITES_STORAGE_KEY = "kemra-demo-favorites";

function readStoredFavorites() {
  try {
    const storedFavorites = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    const parsedFavorites = storedFavorites ? JSON.parse(storedFavorites) : [];
    return Array.isArray(parsedFavorites)
      ? parsedFavorites.filter((item) => storeProductCategories.has(item.category))
      : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(readStoredFavorites);

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Favorites stay available for the current session if browser storage is unavailable.
    }
  }, [favorites]);

  const toggleFavorite = (product) => {
    setFavorites((currentFavorites) =>
      currentFavorites.some((item) => String(item.id) === String(product.id))
        ? currentFavorites.filter((item) => String(item.id) !== String(product.id))
        : [...currentFavorites, product]
    );
  };

  const removeFavorite = (productId) => {
    setFavorites((currentFavorites) =>
      currentFavorites.filter((item) => String(item.id) !== String(productId))
    );
  };

  const isFavorite = useCallback(
    (productId) => favorites.some((item) => String(item.id) === String(productId)),
    [favorites]
  );

  const value = useMemo(() => ({
    favorites,
    favoriteCount: favorites.length,
    toggleFavorite,
    removeFavorite,
    isFavorite,
  }), [favorites, isFavorite]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

// This hook shares its context with a Fast Refresh component in this file.
// eslint-disable-next-line react-refresh/only-export-components
export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used inside FavoritesProvider");
  }

  return context;
}
