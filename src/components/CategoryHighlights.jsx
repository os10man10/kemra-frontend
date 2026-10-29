import { comingSoonCategories } from "../data/storeCategories";
import "./CategoryHighlights.css";

const comingSoonImages = {
  Makeup: "https://images.unsplash.com/photo-1602532381225-eec578361933?auto=format&fit=crop&w=1200&q=82",
  Accessories: "https://images.unsplash.com/photo-1759651037868-eb8039c79ed1?auto=format&fit=crop&w=1200&q=82",
};

function CategoryHighlights() {
  return (
    <section className="category-highlights container" aria-labelledby="category-highlights-title">
      <header className="category-highlights__heading">
        <p>On the horizon</p>
        <h2 id="category-highlights-title">Coming soon</h2>
      </header>
      <div className="category-highlights__grid">
        {comingSoonCategories.map((category) => (
          <article className="category-highlight" key={category}>
            <img src={comingSoonImages[category]} alt="" loading="lazy" />
            <span className="category-highlight__ornament" aria-hidden="true">K</span>
            <span className="category-highlight__label">{category}</span>
            <span className="category-highlight__action">Coming soon</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default CategoryHighlights;
