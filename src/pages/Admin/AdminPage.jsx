import { Link, NavLink } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import {
  FiArrowLeft,
  FiArrowUpRight,
  FiClock,
  FiGrid,
  FiImage,
  FiLayers,
  FiPackage,
  FiShield,
  FiShoppingBag,
  FiSettings,
  FiTag,
} from "react-icons/fi";
import { comingSoonCategories } from "../../data/storeCategories";
import { getAdminBanners } from "./adminBanners";
import { getAdminCollections } from "./adminCollections";
import { getAdminOrders } from "./adminOrders";
import "./AdminPage.css";

const dashboardSections = [
  {
    title: "Products",
    description: "Add products, update prices, manage options, and control availability.",
    status: "Next step",
    icon: <FiPackage aria-hidden="true" />,
  },
  {
    title: "Hero banners",
    description: "Change campaign images, text, links, and the order of the slides.",
    status: "Planned",
    icon: <FiImage aria-hidden="true" />,
  },
  {
    title: "Collections",
    description: "Choose which collections appear in navigation and on the home page.",
    status: "Available",
    icon: <FiLayers aria-hidden="true" />,
  },
  {
    title: "Store settings",
    description: "Update customer contact information and the social links in your storefront.",
    status: "Available",
    icon: <FiSettings aria-hidden="true" />,
  },
  {
    title: "Discounts",
    description: "Create discount codes, set minimum order values, and schedule promotions.",
    status: "Available",
    icon: <FiTag aria-hidden="true" />,
  },
  {
    title: "Orders",
    description: "Review preview orders and follow their progress through the fulfillment stages.",
    status: "Preview",
    icon: <FiShoppingBag aria-hidden="true" />,
  },
];

function AdminPage() {
  const banners = getAdminBanners();
  const collections = getAdminCollections();
  const orders = getAdminOrders();
  const activeBannerCount = banners.filter((banner) => banner.enabled).length;
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <Link className="admin-brand" to="/admin" aria-label="Kemra admin overview">
          <img className="admin-brand__mark" src="/kemra-logo.svg" alt="" />
          <span>
            <strong>KEMRA</strong>
            <small>STORE ADMIN</small>
          </span>
        </Link>

        <p className="admin-sidebar__label">Workspace</p>
        <nav className="admin-nav">
          <NavLink className={({ isActive }) => `admin-nav__link${isActive ? " is-active" : ""}`} to="/admin" end>
            <FiGrid aria-hidden="true" />
            <span>Overview</span>
          </NavLink>
          <NavLink className={({ isActive }) => `admin-nav__link${isActive ? " is-active" : ""}`} to="/admin/products">
            <FiPackage aria-hidden="true" />
            <span>Products</span>
          </NavLink>
          <NavLink className={({ isActive }) => `admin-nav__link${isActive ? " is-active" : ""}`} to="/admin/banners">
            <FiImage aria-hidden="true" /><span>Hero banners</span>
          </NavLink>
          <NavLink className={({ isActive }) => `admin-nav__link${isActive ? " is-active" : ""}`} to="/admin/collections">
            <FiLayers aria-hidden="true" /><span>Collections</span>
          </NavLink>
          <NavLink className={({ isActive }) => `admin-nav__link${isActive ? " is-active" : ""}`} to="/admin/settings">
            <FiSettings aria-hidden="true" /><span>Store settings</span>
          </NavLink>
          <NavLink className={({ isActive }) => `admin-nav__link${isActive ? " is-active" : ""}`} to="/admin/discounts">
            <FiTag aria-hidden="true" /><span>Discounts</span>
          </NavLink>
          <NavLink className={({ isActive }) => `admin-nav__link${isActive ? " is-active" : ""}`} to="/admin/orders">
            <FiShoppingBag aria-hidden="true" /><span>Orders</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar__bottom">
          <span className="admin-demo-indicator"><FiShield aria-hidden="true" /> Preview mode</span>
          <Link className="admin-store-link" to="/">
            <FiArrowLeft aria-hidden="true" />
            <span>Back to storefront</span>
            <FiArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">Kemra workspace</p>
            <h1>Store overview</h1>
          </div>
          <span className="admin-preview-badge"><FiClock aria-hidden="true" /> Frontend preview</span>
        </header>

        <section className="admin-welcome" aria-labelledby="admin-welcome-title">
          <div>
            <p className="admin-eyebrow">Your store, at a glance</p>
            <h2 id="admin-welcome-title">A first look at Kemra Admin</h2>
            <p>
              This is the starting point for managing your collections. We’ll build each tool one step at a time.
            </p>
          </div>
          <div className="admin-welcome__seal" aria-hidden="true"><img src="/kemra-logo.svg" alt="" /></div>
        </section>

        <section className="admin-stats" aria-label="Store summary">
          <article className="admin-stat-card">
            <span className="admin-stat-card__icon"><FiGrid aria-hidden="true" /></span>
            <span className="admin-stat-card__label">Store collections</span>
            <strong>{collections.filter((collection) => collection.navigationEnabled).length}</strong>
            <small>Perfumes, sneakers, and watches</small>
          </article>
          <article className="admin-stat-card">
            <span className="admin-stat-card__icon"><FiImage aria-hidden="true" /></span>
            <span className="admin-stat-card__label">Hero slides</span>
            <strong>{activeBannerCount} of {banners.length}</strong>
            <small>Active on the home page</small>
          </article>
          <article className="admin-stat-card admin-stat-card--muted">
            <span className="admin-stat-card__icon"><FiShoppingBag aria-hidden="true" /></span>
            <span className="admin-stat-card__label">Order activity</span>
            <strong>{orders.length}</strong>
            <small>Demo orders saved in this browser</small>
          </article>
        </section>

        <section className="admin-management" aria-labelledby="admin-management-title">
          <div className="admin-section-heading">
            <div>
              <p className="admin-eyebrow">Management tools</p>
              <h2 id="admin-management-title">What you’ll manage here</h2>
            </div>
            <span className="admin-section-note">Built step by step</span>
          </div>
          <div className="admin-tool-grid">
            {dashboardSections.map((section, index) => (
              <article className="admin-tool-card" key={section.title}>
                <span className="admin-tool-card__icon">{section.icon}</span>
                <span className={`admin-tool-card__status${index === 0 ? " is-next" : ""}`}>
                  {section.title === "Orders" ? section.status : "Available"}
                </span>
                <h3>{section.title}</h3>
                <p>{section.description}</p>
                {section.title === "Products" && <Link className="admin-tool-card__link" to="/admin/products">Open product manager <FiArrowRight aria-hidden="true" /></Link>}
                {section.title === "Hero banners" && <Link className="admin-tool-card__link" to="/admin/banners">Open banner manager <FiArrowRight aria-hidden="true" /></Link>}
                {section.title === "Collections" && <Link className="admin-tool-card__link" to="/admin/collections">Manage collections <FiArrowRight aria-hidden="true" /></Link>}
                {section.title === "Store settings" && <Link className="admin-tool-card__link" to="/admin/settings">Open store settings <FiArrowRight aria-hidden="true" /></Link>}
                {section.title === "Discounts" && <Link className="admin-tool-card__link" to="/admin/discounts">Manage discounts <FiArrowRight aria-hidden="true" /></Link>}
                {section.title === "Orders" && <Link className="admin-tool-card__link" to="/admin/orders">Open order manager <FiArrowRight aria-hidden="true" /></Link>}
              </article>
            ))}
          </div>
        </section>

        <section className="admin-categories" aria-labelledby="admin-categories-title">
          <div className="admin-section-heading">
            <div>
              <p className="admin-eyebrow">Catalog structure</p>
              <h2 id="admin-categories-title">Kemra collections</h2>
            </div>
            <span className="admin-section-note">Current storefront setup</span>
          </div>
          <div className="admin-category-list">
            {collections.map((category) => (
              <div className="admin-category-row" key={category.slug}>
                <span>{category.name}</span>
                <small>{category.navigationEnabled ? "In navigation" : "Hidden from navigation"}{category.homeEnabled ? " · On home" : ""}</small>
              </div>
            ))}
            {comingSoonCategories.map((category) => (
              <div className="admin-category-row is-coming-soon" key={category}>
                <span>{category}</span>
                <small>Coming soon</small>
              </div>
            ))}
          </div>
        </section>

        <p className="admin-disclaimer" role="note">
          Preview only: changes made in the product manager are saved in this browser. There is no admin sign-in or live store connection yet.
        </p>
      </div>
    </div>
  );
}

export default AdminPage;
