import { Link } from "react-router-dom";
import { FiArrowLeft, FiCompass } from "react-icons/fi";
import "./NotFoundPage.css";

function NotFoundPage() {
  return (
    <section className="not-found-page" aria-labelledby="not-found-title">
      <div className="not-found-page__content">
        <span className="not-found-page__eyebrow">
          <FiCompass aria-hidden="true" /> KEMRA — PAGE NOT FOUND
        </span>
        <p className="not-found-page__code" aria-hidden="true">404</p>
        <h1 id="not-found-title">This page is out of sight.</h1>
        <p className="not-found-page__description">
          The page you’re looking for may have moved, or the address may be incorrect.
        </p>
        <Link className="not-found-page__home-link" to="/">
          <FiArrowLeft aria-hidden="true" /> Back to home
        </Link>
      </div>
    </section>
  );
}

export default NotFoundPage;
