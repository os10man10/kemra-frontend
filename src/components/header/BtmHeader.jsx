import { IoMdMenu } from "react-icons/io";
import { IoMdArrowDropdown } from "react-icons/io";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { PiSignInBold } from "react-icons/pi";
import { FaEnvelope, FaInfoCircle, FaUserPlus } from "react-icons/fa";
import { FaClock, FaEllipsisH, FaHome } from "react-icons/fa";
import { GiConverseShoe, GiPerfumeBottle } from "react-icons/gi";
import { getProductCategories } from "../../services/products";
import { getAdminCollections } from "../../pages/Admin/adminCollections";

function audienceLink(category, audience) {
  return `/category/${category.slug}?audience=${encodeURIComponent(audience.toLowerCase())}`;
}

function isNavigationLinkActive(link, location) {
  if (link === "/") return location.pathname === "/" && !location.hash;
  if (link.startsWith("/#")) {
    const section = link.slice(2);
    return (location.pathname === "/" && location.hash === `#${section}`)
      || location.pathname === `/category/${section}`;
  }
  return location.pathname === link;
}

function CategorySkeletonList() {
  return (
    <>
      <span className="category-loading-status" role="status">
        Loading categories
      </span>
      {Array.from({ length: 3 }, (_, index) => (
        <span
          className="category-skeleton-row"
          aria-hidden="true"
          key={index}
        >
          <span className="category-skeleton-shimmer" />
        </span>
      ))}
    </>
  );
}

function BomHeader() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
  const visibleCollections = getAdminCollections().filter((category) => category.navigationEnabled);
  const navLinks = [
    { title: "Home", link: "/" },
    ...visibleCollections.map((category) => ({
      title: category.name,
      link: category.homeEnabled ? `/#${category.slug}` : `/category/${category.slug}`,
      category,
    })),
    { title: "About", link: "/about" },
    { title: "Contact", link: "/contact" },
  ];

  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [openDesktopMenu, setOpenDesktopMenu] = useState(null);
  const [openMobileCategory, setOpenMobileCategory] = useState(null);
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        await getProductCategories({ signal: controller.signal });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching categories", error);
        }
      } finally {
        if (!controller.signal.aborted) setIsCategoriesLoading(false);
      }
    };

    fetchCategories();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    function handleScroll() {
      const currentScrollY = window.scrollY;

      if (isMoreOpen || currentScrollY <= 8 || currentScrollY < lastScrollY - 4) {
        setIsMobileNavVisible(true);
      } else if (currentScrollY > lastScrollY + 4) {
        setIsMobileNavVisible(false);
      }

      lastScrollY = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMoreOpen]);

  const mobileLinks = [
    { title: "Home", link: "/", icon: <FaHome /> },
    ...visibleCollections.map((category) => ({
      title: category.name,
      category,
      icon: category.slug === "fragrances" ? <GiPerfumeBottle /> : category.slug === "mens-shoes" ? <GiConverseShoe /> : <FaClock />,
    })),
  ];
  return (
    <div className="bottom-header">
      <div className="container">
        <nav className="nav">
          <div className="category-nav">
            <button
              type="button"
              className="category-btn"
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              aria-expanded={isCategoryOpen}
              aria-controls="category-list"
            >
              <IoMdMenu />
              <p>Browse category</p>
              <IoMdArrowDropdown />
            </button>
            <div
              id="category-list"
              className={`category-nav-list ${isCategoryOpen ? "active" : ""}`}
              aria-busy={isCategoriesLoading}
            >
              {isCategoriesLoading ? (
                <CategorySkeletonList />
              ) : (
                visibleCollections.map((category) => (
                  <div className="category-nav-group" key={category.slug}>
                    <Link
                      to={`/category/${category.slug}`}
                      onClick={() => setIsCategoryOpen(false)}
                    >
                      {category.name}
                    </Link>
                    {category.audiences?.map((audience) => (
                      <Link
                        className="category-nav-audience"
                        to={audienceLink(category, audience)}
                        key={audience}
                        onClick={() => setIsCategoryOpen(false)}
                      >
                        {audience}
                      </Link>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
          <nav
            id="main-navigation-links"
            className="nav-links"
            aria-label="Main navigation"
          >
              {navLinks.map((item) => (
                <li
                  className={`${isNavigationLinkActive(item.link, location) ? "active" : ""}${item.category ? " nav-link-dropdown" : ""}${openDesktopMenu === item.category?.slug ? " is-open" : ""}`}
                  key={item.link}
                >
                  <Link to={item.link} onClick={() => setOpenDesktopMenu(null)}>{item.title}</Link>
                  {item.category && (
                    <>
                      <button
                        className="nav-dropdown-toggle"
                        type="button"
                        aria-label={`Browse ${item.title} by audience`}
                        aria-expanded={openDesktopMenu === item.category.slug}
                        aria-controls={`desktop-audience-${item.category.slug}`}
                        onClick={() => setOpenDesktopMenu((current) => current === item.category.slug ? null : item.category.slug)}
                      >
                        <IoMdArrowDropdown aria-hidden="true" />
                      </button>
                      <div className="nav-dropdown-menu" id={`desktop-audience-${item.category.slug}`}>
                        {item.category.audiences.map((audience) => (
                          <Link
                            key={audience}
                            to={audienceLink(item.category, audience)}
                            onClick={() => setOpenDesktopMenu(null)}
                          >
                            {audience}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </li>
              ))}
          </nav>
        </nav>
        <div className="sign-reds">
            <Link to="/login" aria-label="Login" title="Login">
            <PiSignInBold />
          </Link>
            <Link to="/register" aria-label="Register" title="Register">
            <FaUserPlus />
          </Link>
        </div>
      </div>
      {!isAuthPage && (
        <div className={`mobile-bottom-nav ${isMobileNavVisible || isMoreOpen || openMobileCategory ? "" : "hidden"}`}>
          {openMobileCategory && !isMoreOpen && (
            <div className="mobile-category-panel" id="mobile-category-panel">
          <h2>{openMobileCategory.name}</h2>
              <div className="mobile-category-options">
                <Link
                  to={`/category/${openMobileCategory.slug}`}
                  onClick={() => setOpenMobileCategory(null)}
                >
                  View collection
                </Link>
                {openMobileCategory.audiences.map((audience) => (
                  <Link
                    key={audience}
                    to={audienceLink(openMobileCategory, audience)}
                    onClick={() => setOpenMobileCategory(null)}
                  >
                    {audience}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {isMoreOpen && (
            <div className="mobile-more-panel" id="mobile-more-panel">
              <div className="mobile-more-links">
                <Link to="/about" onClick={() => setIsMoreOpen(false)} className={location.pathname === "/about" ? "active" : ""}>
                  <FaInfoCircle aria-hidden="true" />
                  <span>About</span>
                </Link>
                <Link to="/contact" onClick={() => setIsMoreOpen(false)} className={location.pathname === "/contact" ? "active" : ""}>
                  <FaEnvelope aria-hidden="true" />
                  <span>Contact</span>
                </Link>
                <Link to="/login" onClick={() => setIsMoreOpen(false)} className={location.pathname === "/login" ? "active" : ""}>
                  <PiSignInBold aria-hidden="true" />
                  <span>Login</span>
                </Link>
                <Link to="/register" onClick={() => setIsMoreOpen(false)} className={location.pathname === "/register" ? "active" : ""}>
                  <FaUserPlus aria-hidden="true" />
                  <span>Register</span>
                </Link>
              </div>
            </div>
          )}
          <nav aria-label="Mobile navigation">
            {mobileLinks.map((item) => item.category ? (
              <button
                type="button"
                key={item.category.slug}
                className={!isMoreOpen && openMobileCategory?.slug === item.category.slug ? "active" : ""}
                aria-expanded={openMobileCategory?.slug === item.category.slug}
                aria-controls="mobile-category-panel"
                onClick={() => {
                  setOpenMobileCategory((current) => current?.slug === item.category.slug ? null : item.category);
                  setIsMoreOpen(false);
                  setIsMobileNavVisible(true);
                }}
              >
                {item.icon}
                <span>{item.title}</span>
              </button>
            ) : (
              <Link
                to={item.link}
                key={item.link}
                onClick={() => {
                  setIsMoreOpen(false);
                  setOpenMobileCategory(null);
                }}
                className={!isMoreOpen && isNavigationLinkActive(item.link, location) ? "active" : ""}
                aria-current={isNavigationLinkActive(item.link, location) ? "page" : undefined}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            ))}
            <button
              type="button"
              className={isMoreOpen ? "active" : ""}
              aria-expanded={isMoreOpen}
              aria-controls="mobile-more-panel"
              onClick={() => {
                setIsMoreOpen((open) => !open);
                setOpenMobileCategory(null);
                setIsMobileNavVisible(true);
              }}
            >
              <FaEllipsisH />
              <span>More</span>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

export default BomHeader;
