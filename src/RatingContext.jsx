import { createContext, useContext, useEffect, useMemo, useState } from "react";

const RatingContext = createContext(null);
const RATINGS_STORAGE_KEY = "kemra-demo-ratings";

function readStoredRatings() {
  try {
    const storedRatings = window.localStorage.getItem(RATINGS_STORAGE_KEY);
    const parsedRatings = storedRatings ? JSON.parse(storedRatings) : {};
    return parsedRatings && typeof parsedRatings === "object" && !Array.isArray(parsedRatings)
      ? parsedRatings
      : {};
  } catch {
    return {};
  }
}

export function RatingProvider({ children }) {
  const [ratings, setRatings] = useState(readStoredRatings);

  useEffect(() => {
    try {
      window.localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(ratings));
    } catch {
      // Ratings stay available for the current session if browser storage is unavailable.
    }
  }, [ratings]);

  const setProductRating = (productId, value) => {
    if (!Number.isInteger(value) || value < 1 || value > 5) return;
    setRatings((currentRatings) => ({ ...currentRatings, [productId]: value }));
  };

  const value = useMemo(() => ({ ratings, setProductRating }), [ratings]);

  return <RatingContext.Provider value={value}>{children}</RatingContext.Provider>;
}

// This hook shares its context with a Fast Refresh component in this file.
// eslint-disable-next-line react-refresh/only-export-components
export function useRatings() {
  const context = useContext(RatingContext);

  if (!context) {
    throw new Error("useRatings must be used inside RatingProvider");
  }

  return context;
}
