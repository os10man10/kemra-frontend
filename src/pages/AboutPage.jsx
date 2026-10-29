import { Link } from "react-router-dom";
import { FaCompass, FaGem, FaLandmark } from "react-icons/fa6";
import aboutImage from "../img/about-image.webp";
import "./AboutPage.css";

const values = [
  {
    title: "Inspired by ancient Egypt",
    description: "The symbols and artistry of ancient Egypt inspire the identity and visual language of Kemra.",
    icon: <FaLandmark aria-hidden="true" />,
  },
  {
    title: "Three collections, one identity",
    description: "Perfume, sneakers, and watches come together under the Kemra name.",
    icon: <FaCompass aria-hidden="true" />,
  },
  {
    title: "A mark that lasts",
    description: "We believe personal style can stay in people’s memory long after a moment has passed.",
    icon: <FaGem aria-hidden="true" />,
  },
];

function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-story" aria-labelledby="about-title">
        <div className="about-story__copy">
          <div className="about-story__brand">
            <img className="about-story__logo" src="/kemra-logo.svg" alt="Kemra" />
            <p className="about-eyebrow">The story of Kemra</p>
            <p className="about-story__motto">A fragrance may fade, but its mark remains.</p>
          </div>
          <h1 id="about-title">A legacy that<br/>leaves its mark.</h1>
          <p className="about-story__intro">
            Kemra brings together perfume, sneakers, and watches under one identity inspired by the artistry of ancient Egypt. Each collection is designed to express individuality and leave a lasting impression.
          </p>
          <Link className="about-story__link" to="/#fragrances">Explore our collections <span aria-hidden="true">→</span></Link>
        </div>
        <div className="about-story__visual">
          <img src={aboutImage} alt="A person holding a Kemra perfume bottle in the Kemra store" />
          <span className="about-story__visual-caption">Inspired by a civilization that still leaves its mark</span>
        </div>
      </section>

      <section className="about-values" aria-label="What defines Kemra">
          {values.map((value) => (
          <article className="about-value" key={value.title}>
            <span className="about-value__icon">{value.icon}</span>
            <h2>{value.title}</h2>
            <p>{value.description}</p>
          </article>
        ))}
      </section>

    </div>
  );
}

export default AboutPage;
