import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HeroSlider from "../../components/HeroSlider";
import CategoryHighlights from "../../components/CategoryHighlights";
import SlideProduct from "../../components/slide Products/SlideProduct";
import AboutPage from "../AboutPage";
import ContactPage from "../ContactPage";
import { getProducts, getProductsByCategory } from "../../services/products";
import { getAdminCollections } from "../Admin/adminCollections";
import "./Home.css";

const collectionDescriptions = {
  fragrances: "Discover fragrances inspired by the timeless elegance of ancient Egypt.",
  "mens-shoes": "Find your stride with sneakers chosen for style and everyday comfort.",
  "mens-watches": "Explore timepieces that bring refined design and everyday precision together.",
  "all-products": "Browse every piece in the Kemra collection, all in one place.",
};

function Home() {
  const [collections] = useState(() => getAdminCollections().filter((collection) => collection.homeEnabled));
  const categories = useMemo(() => collections.map((collection) => collection.slug), [collections]);
  const collectionTitles = useMemo(() => Object.fromEntries(collections.map(({ slug, name }) => [slug, name])), [collections]);
  const [products, setProducts] = useState({});
  const [allProducts, setAllProducts] = useState([]);
  const [errors, setErrors] = useState({});
  const [isAllProductsLoading, setIsAllProductsLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(() =>
    Object.fromEntries(categories.map((category) => [category, true]))
  );
  const requestControllers = useRef({});

  const loadCategory = useCallback(async (category, controller) => {
    try {
      const categoryProducts = await getProductsByCategory(category, { signal: controller.signal });
      if (!controller.signal.aborted) {
        setProducts((current) => ({ ...current, [category]: categoryProducts }));
      }
    } catch (error) {
      if (error.name !== "AbortError" && !controller.signal.aborted) {
        console.error(`Error fetching ${category}`, error);
        setErrors((current) => ({
          ...current,
          [category]: "We couldn’t load these products. Please try again.",
        }));
        setProducts((current) => ({ ...current, [category]: [] }));
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingCategories((current) => ({ ...current, [category]: false }));
      }
    }
  }, []);

  const loadAllProducts = useCallback(async (controller) => {
    try {
      const productsList = await getProducts({ signal: controller.signal });
      if (!controller.signal.aborted) setAllProducts(productsList);
    } catch (error) {
      if (error.name !== "AbortError" && !controller.signal.aborted) {
        console.error("Error fetching all products", error);
        setErrors((current) => ({
          ...current,
          "all-products": "We couldn’t load all products. Please try again.",
        }));
        setAllProducts([]);
      }
    } finally {
      if (!controller.signal.aborted) setIsAllProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controllers = Object.fromEntries(
      [...categories, "all-products"].map((key) => [key, new AbortController()])
    );
    requestControllers.current = controllers;

    queueMicrotask(() => {
      if (Object.values(controllers).some((controller) => controller.signal.aborted)) return;
      categories.forEach((category) => loadCategory(category, controllers[category]));
      loadAllProducts(controllers["all-products"]);
    });

    return () => {
      Object.values(controllers).forEach((controller) => controller.abort());
    };
  }, [categories, loadAllProducts, loadCategory]);

  const retryCategory = (category) => {
    const controller = new AbortController();
    requestControllers.current[category]?.abort();
    requestControllers.current[category] = controller;
    setLoadingCategories((current) => ({ ...current, [category]: true }));
    setErrors((current) => ({ ...current, [category]: "" }));
    loadCategory(category, controller);
  };

  const retryAllProducts = () => {
    const controller = new AbortController();
    requestControllers.current["all-products"]?.abort();
    requestControllers.current["all-products"] = controller;
    setIsAllProductsLoading(true);
    setErrors((current) => ({ ...current, "all-products": "" }));
    loadAllProducts(controller);
  };

  return (
    <div>
      <HeroSlider />
      <CategoryHighlights />

      {categories.map((category) => (
        <SlideProduct
          key={category}
          id={category}
          data={products[category] || []}
          title={collectionTitles[category] || category}
          description={collectionDescriptions[category]}
          loading={loadingCategories[category]}
          error={errors[category]}
          onRetry={() => retryCategory(category)}
        />
      ))}

      <SlideProduct
        id="all-products"
        data={allProducts}
        title="All Products"
        description={collectionDescriptions["all-products"]}
        loading={isAllProductsLoading}
        error={errors["all-products"]}
        onRetry={retryAllProducts}
      />

      <AboutPage />
      <ContactPage />
    </div>
  );
}

export default Home;
