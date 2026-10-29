import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FaArrowUp, FaCheck } from "react-icons/fa6";
import BtmHeader from "./components/header/BtmHeader";
import TopHeader from "./components/header/TopHeader";
import { Route, Routes, useLocation, useNavigationType } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Home from "./pages/Home/Home";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import FavoritesPage from "./pages/FavoritesPage";
import ProductDetails from "./pages/productDetails/productDetails";
import SearchResults from "./pages/SearchResults";
import CategoryPage from "./pages/CategoryPage";
import NotFoundPage from "./pages/NotFoundPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
const AdminPage = lazy(() => import("./pages/Admin/AdminPage"));
const AdminProductsPage = lazy(() => import("./pages/Admin/AdminProductsPage"));
const AdminBannersPage = lazy(() => import("./pages/Admin/AdminBannersPage"));
const AdminCollectionsPage = lazy(() => import("./pages/Admin/AdminCollectionsPage"));
const AdminStoreSettingsPage = lazy(() => import("./pages/Admin/AdminStoreSettingsPage"));
const AdminDiscountsPage = lazy(() => import("./pages/Admin/AdminDiscountsPage"));
const AdminOrdersPage = lazy(() => import("./pages/Admin/AdminOrdersPage"));
import SiteFooter from "./components/SiteFooter";
import { CartProvider, useCart } from "./context/CartContext";
import { FavoritesProvider } from "./FavoritesContext";
import { RatingProvider } from "./RatingContext";

function CartToast() {
  const { notification } = useCart();
  const [dismissedNotificationId, setDismissedNotificationId] = useState(null);

  useEffect(() => {
    if (!notification) return undefined;
    const timeoutId = window.setTimeout(() => setDismissedNotificationId(notification.id), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [notification]);

  if (!notification || notification.id === dismissedNotificationId) return null;

  return (
    <div className="cart-toast" role="status" aria-live="polite">
      <span className="cart-toast-check">{notification.type === "limit" ? "!" : <FaCheck />}</span>
      <span>
        <strong>{notification.type === "limit" ? "Stock limit reached" : "Added to cart"}</strong>
        <small>{notification.productTitle}</small>
      </span>
    </div>
  );
}

function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY > 420);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  const scrollToTop = () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, left: 0, behavior: reducedMotion ? "instant" : "smooth" });
  };

  return (
    <button
      className={`back-to-top${isVisible ? " is-visible" : ""}`}
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
      tabIndex={isVisible ? 0 : -1}
      aria-hidden={!isVisible}
    >
      <FaArrowUp aria-hidden="true" />
    </button>
  );
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType === "POP") return undefined;

    if (hash) {
      let secondFrame = 0;
      const firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          const target = document.getElementById(hash.slice(1));
          if (!target) {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
            return;
          }

          const headerHeight = document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
          const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
          window.scrollTo({ top: targetTop, left: 0, behavior: "smooth" });
        });
      });

      return () => {
        window.cancelAnimationFrame(firstFrame);
        window.cancelAnimationFrame(secondFrame);
      };
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return undefined;
  }, [pathname, hash, navigationType]);

  return null;
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const headerRef = useRef(null);
  const mainRef = useRef(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    const main = mainRef.current;
    if (!main) return undefined;

    const syncMainOffset = () => {
      main.style.paddingTop = header
        ? `${Math.ceil(header.getBoundingClientRect().height)}px`
        : "0px";
    };

    syncMainOffset();
    const resizeObserver = header ? new ResizeObserver(syncMainOffset) : null;
    resizeObserver?.observe(header);
    window.addEventListener("resize", syncMainOffset);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", syncMainOffset);
      main.style.paddingTop = "";
    };
  }, [isAdminRoute]);

  return (
    <CartProvider>
      <FavoritesProvider>
        <RatingProvider>
          <>
            <ScrollToTop />
            {!isAdminRoute && (
              <>
                <header className="site-header" ref={headerRef}>
                  <TopHeader />
                  <BtmHeader />
                </header>
                <CartToast />
                <BackToTopButton />
              </>
            )}
            <main className={isAdminRoute ? "admin-app-main" : undefined} ref={mainRef}>
              <Suspense fallback={<p className="route-loading" role="status">Loading page…</p>}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/products" element={<AdminProductsPage />} />
                  <Route path="/admin/banners" element={<AdminBannersPage />} />
                  <Route path="/admin/collections" element={<AdminCollectionsPage />} />
                  <Route path="/admin/settings" element={<AdminStoreSettingsPage />} />
                  <Route path="/admin/discounts" element={<AdminDiscountsPage />} />
                  <Route path="/admin/orders" element={<AdminOrdersPage />} />
                  <Route path="/login" element={<AuthPage mode="login" />} />
                  <Route path="/register" element={<AuthPage mode="register" />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/category/:category" element={<CategoryPage />} />
                  <Route path="/products/:id" element={<ProductDetails />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </main>
            {!isAdminRoute && <SiteFooter />}
          </>
        </RatingProvider>
      </FavoritesProvider>
    </CartProvider>
  );
}

export default App;
