import { FaStar } from "react-icons/fa6";
import "./RatingStars.css";

function getRatingValue(rating) {
  const value = typeof rating === "object" && rating !== null ? rating.rate : rating;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.min(5, Math.max(0, numericValue)) : 0;
}

function RatingStars({ rating, reviewCount, className = "" }) {
  const value = getRatingValue(rating);
  const countValue = reviewCount ?? (typeof rating === "object" && rating !== null ? rating.count : undefined);
  const count = Number(countValue);

  return (
    <span className={`rating-display ${className}`.trim()} aria-label={`${value.toFixed(1)} out of 5 stars`}>
      <span className="rating-stars" aria-hidden="true">
        <span className="rating-stars-base">
          {Array.from({ length: 5 }, (_, index) => <FaStar key={index} />)}
        </span>
        <span className="rating-stars-fill" style={{ width: `${(value / 5) * 100}%` }}>
          {Array.from({ length: 5 }, (_, index) => <FaStar key={index} />)}
        </span>
      </span>
      <span className="rating-value">{value.toFixed(1)}</span>
      {Number.isFinite(count) && count > 0 && <span className="rating-count">({count})</span>}
    </span>
  );
}

export default RatingStars;
