import { Link } from "react-router-dom";
import Product from "../components/slide Products/Product";
import { useFavorites } from "../FavoritesContext";
import "./favorites.css";

function FavoritesPage() {
  const { favorites } = useFavorites();

  return (
    <section className="favorites-page container">
      <div className="favorites-page-heading">
        <p className="favorites-eyebrow">Your selection</p>
        <h1>Favorites</h1>
        <p>{favorites.length} saved {favorites.length === 1 ? "product" : "products"}</p>
      </div>

      {favorites.length === 0 ? (
        <div className="favorites-empty-state">
          <h2>No favorites yet</h2>
          <p>Tap the heart on a product to save it here.</p>
          <Link to="/">Explore products</Link>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((item) => <Product item={item} key={item.id} />)}
        </div>
      )}
    </section>
  );
}

export default FavoritesPage;
