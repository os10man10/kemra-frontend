import { Link, useLocation } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa6";
import { getAdminCollections } from "../pages/Admin/adminCollections";
import { getAdminStoreSettings } from "../pages/Admin/adminStoreSettings";
import "./SiteFooter.css";

const socialDefinitions = [
  { key: "instagram", label: "Instagram", icon: <FaInstagram /> },
  { key: "facebook", label: "Facebook", icon: <FaFacebookF /> },
  { key: "whatsapp", label: "WhatsApp", icon: <FaWhatsapp /> },
  { key: "tiktok", label: "TikTok", icon: <FaTiktok /> },
];

function SiteFooter() {
  const { pathname } = useLocation();
  const settings = getAdminStoreSettings();
  const socialLinks = socialDefinitions
    .map((social) => ({ ...social, href: settings.socials[social.key] }))
    .filter((social) => social.href);
  const collections = getAdminCollections().filter((collection) => collection.navigationEnabled);

  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <footer className="site-footer">
      <div className="site-footer__main">
        <div className="site-footer__brand">
          <Link className="site-footer__logo-link" to="/" aria-label="Kemra home">
            <img src="/kemra-logo.svg" alt="Kemra" />
            <span>KEMRA</span>
          </Link>
          <p>{settings.footerDescription}</p>
        </div>

        <nav className="site-footer__nav" aria-label="Footer navigation">
          <h2>Explore</h2>
          {collections.map((collection) => (
            <Link key={collection.slug} to={collection.homeEnabled ? `/#${collection.slug}` : `/category/${collection.slug}`}>
              {collection.name}
            </Link>
          ))}
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </nav>

        <div className="site-footer__social">
          <h2>Stay connected</h2>
          <p>Follow Kemra and discover what’s new.</p>
          <div className="site-footer__social-links">
            {socialLinks.map((social) => (
              <a
                href={social.href}
                key={social.label}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                title={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} Kemra. All rights reserved.</span>
        <span>Crafted with meaning.</span>
      </div>
    </footer>
  );
}

export default SiteFooter;
