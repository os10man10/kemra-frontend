import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getProducts } from "../services/products";
import { storeProductCategories } from "../data/storeCategories";
import { getProductVariant, getProductVariantInventory } from "../productVariants";
import { checkDiscountCode, normalizeDiscountCode } from "../pages/Admin/adminDiscounts";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "kemra-demo-cart";
const CART_DISCOUNT_KEY = "kemra-demo-cart-discount";
const EMPTY_CART_ITEMS = [];

function readStoredCart() {
  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = storedCart ? JSON.parse(storedCart) : [];
    return Array.isArray(parsedCart)
      ? parsedCart.map((item) => ({ ...item, quantity: Math.max(0, Math.floor(Number(item.quantity) || 0)) }))
      : [];
  } catch {
    return [];
  }
}

function readStoredDiscountCode() {
  try {
    return normalizeDiscountCode(window.localStorage.getItem(CART_DISCOUNT_KEY));
  } catch {
    return "";
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart);
  const [discountCode, setDiscountCode] = useState(readStoredDiscountCode);
  const [isCatalogValidated, setIsCatalogValidated] = useState(false);
  const [notification, setNotification] = useState(null);
  const notificationId = useRef(0);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    try {
      if (discountCode) window.localStorage.setItem(CART_DISCOUNT_KEY, discountCode);
      else window.localStorage.removeItem(CART_DISCOUNT_KEY);
    } catch {
      // The discount remains available for the current session if storage is unavailable.
    }
  }, [discountCode]);

  useEffect(() => {
    const controller = new AbortController();

    getProducts({ signal: controller.signal, includeUnpublished: true })
      .then((products) => {
        const purchasableProducts = products.filter((product) => !["draft", "archived"].includes(product.publicationStatus));
        const productsById = new Map(purchasableProducts.map((product) => [String(product.id), product]));
        setItems((currentItems) => {
          const quantitiesByProduct = new Map();
          return currentItems.flatMap((item) => {
            const product = productsById.get(String(item.productId));
            if (!product) return [];

            const managedVariants = Array.isArray(product.variants) && product.variants.length > 0;
            const variant = managedVariants ? getProductVariant(product, item.variants || {}) : null;
            if (managedVariants && !variant) return [];
            const inventory = managedVariants
              ? getProductVariantInventory(product, item.variants || {})
              : { stock: Number.isFinite(Number(product.stock)) ? Math.max(0, Number(product.stock)) : null, price: Number(product.price) };
            const inventoryKey = managedVariants
              ? `${product.id}:${Object.entries(item.variants || {}).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}:${value}`).join("|")}`
              : String(item.productId);
            const stock = inventory.stock;
            const alreadyKept = quantitiesByProduct.get(inventoryKey) || 0;
            const savedQuantity = Math.max(0, Math.floor(Number(item.quantity) || 0));
            const quantity = stock === null ? savedQuantity : Math.min(savedQuantity, Math.max(0, stock - alreadyKept));
            quantitiesByProduct.set(inventoryKey, alreadyKept + quantity);
            return [{ ...item, price: inventory.price, stock, inventoryKey, quantity }];
          });
        });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setItems((currentItems) => currentItems.filter((item) => storeProductCategories.has(item.category)));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsCatalogValidated(true);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // The cart still works for the current session if browser storage is unavailable.
    }
  }, [items]);

  const addToCart = (product, variants, quantity) => {
    const requestedQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
    const managedVariants = Array.isArray(product.variants) && product.variants.length > 0;
    const matchingVariant = managedVariants ? getProductVariant(product, variants) : null;
    const inventory = managedVariants
      ? getProductVariantInventory(product, variants)
      : { stock: Number.isFinite(Number(product.stock)) ? Math.max(0, Number(product.stock)) : null, price: Number(product.price) };
    const stock = managedVariants && !matchingVariant ? 0 : inventory.stock;
    const price = inventory.price;
    const variantKey = Object.keys(variants)
      .sort()
      .map((key) => `${key}:${variants[key]}`)
      .join("|");
    const cartKey = `${product.id}:${variantKey}`;
    const inventoryKey = managedVariants ? cartKey : String(product.id);
    const currentQuantity = itemsRef.current
      .filter((item) => (item.inventoryKey ?? String(item.productId)) === inventoryKey)
      .reduce((total, item) => total + item.quantity, 0);
    const allowedQuantity = stock === null ? requestedQuantity : Math.min(requestedQuantity, Math.max(0, stock - currentQuantity));

    notificationId.current += 1;
    setNotification({
      id: notificationId.current,
      productTitle: product.title,
      type: allowedQuantity > 0 ? "added" : "limit",
    });

    if (allowedQuantity <= 0) return 0;

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.cartKey === cartKey);

      if (existingItem) {
        return currentItems.map((item) =>
          item.cartKey === cartKey
            ? { ...item, stock, price, inventoryKey, quantity: Math.min(item.quantity + allowedQuantity, stock ?? Infinity) }
            : item
        );
      }

      return [
        ...currentItems,
        {
          cartKey,
          productId: product.id,
          title: product.title,
          category: product.category,
          thumbnail: product.thumbnail,
          price,
          stock,
          inventoryKey,
          variants,
          quantity: allowedQuantity,
        },
      ];
    });

    return allowedQuantity;
  };

  const updateQuantity = (cartKey, quantity) => {
    const requestedQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
    setItems((currentItems) => {
      const targetItem = currentItems.find((item) => item.cartKey === cartKey);
      if (!targetItem) return currentItems;

      const quantityOfOtherOptions = currentItems
        .filter((item) => item.cartKey !== cartKey
          && (item.inventoryKey ?? String(item.productId)) === (targetItem.inventoryKey ?? String(targetItem.productId)))
        .reduce((total, item) => total + item.quantity, 0);
      const maxQuantity = targetItem.stock == null
        ? Infinity
        : Math.max(0, targetItem.stock - quantityOfOtherOptions);
      const nextQuantity = Math.min(requestedQuantity, maxQuantity);

      return currentItems.map((item) =>
        item.cartKey === cartKey ? { ...item, quantity: nextQuantity } : item
      );
    });
  };

  const removeFromCart = (cartKey) => {
    setItems((currentItems) => currentItems.filter((item) => item.cartKey !== cartKey));
  };

  const applyDiscountCode = (code) => {
    const subtotal = itemsRef.current.reduce(
      (total, item) => total + (item.stock === 0 || item.quantity <= 0 ? 0 : item.price * item.quantity),
      0
    );
    const result = checkDiscountCode(code, subtotal);
    if (result.valid) setDiscountCode(normalizeDiscountCode(code));
    return result;
  };

  const removeDiscountCode = () => setDiscountCode("");
  const clearCart = () => {
    setItems([]);
    setDiscountCode("");
  };

  const visibleItems = isCatalogValidated ? items : EMPTY_CART_ITEMS;
  const itemCount = visibleItems.reduce((total, item) => total + (item.stock === 0 ? 0 : item.quantity), 0);
  const subtotal = visibleItems.reduce(
    (total, item) => total + (item.stock === 0 || item.quantity <= 0 ? 0 : item.price * item.quantity),
    0
  );
  const discountResult = discountCode ? checkDiscountCode(discountCode, subtotal) : null;
  const discountAmount = discountResult?.valid ? discountResult.discountAmount : 0;
  const value = useMemo(() => ({
    items: visibleItems,
    itemCount,
    subtotal,
    discountCode,
    discountAmount,
    discountMessage: discountResult?.valid ? discountResult.message : discountResult?.message || "",
    applyDiscountCode,
    removeDiscountCode,
    clearCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    notification,
  }), [visibleItems, itemCount, subtotal, discountCode, discountAmount, discountResult?.valid, discountResult?.message, notification]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// The provider and its consumer hook intentionally live together with the context.
// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
