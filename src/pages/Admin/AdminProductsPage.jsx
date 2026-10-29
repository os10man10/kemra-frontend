import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiArrowRight, FiEdit2, FiPlus, FiSearch, FiStar, FiTrash2 } from "react-icons/fi";
import { getAdminCollections } from "./adminCollections";
import { getProductVariantOptions } from "../../productVariants";
import { createAdminProduct, deleteAdminProduct, saveAdminProduct } from "./adminCatalog";
import { getProducts } from "../../services/products";
import "./AdminProductsPage.css";

const categoryForCollection = (collection, audience) => {
  if (collection === "fragrances") return "fragrances";
  if (collection === "mens-shoes") return audience === "women" ? "womens-shoes" : "mens-shoes";
  if (collection === "mens-watches") return audience === "women" ? "womens-watches" : "mens-watches";
  return collection;
};

function defaultShoeSizes(audience) {
  if (audience === "children") return ["28", "29", "30", "31", "32", "33", "34", "35"];
  if (audience === "women") return ["36", "37", "38", "39", "40", "41", "42"];
  return ["39", "40", "41", "42", "43", "44", "45"];
}

const colorSwatches = { black: "#242321", white: "#f7f4ed", sand: "#c7ad83", gold: "#c6a15b", silver: "#b9bdc0" };

function variantFields(collection) {
  if (collection === "fragrances") return [{ key: "volume", label: "Size" }];
  if (collection === "mens-shoes") return [{ key: "color", label: "Color" }, { key: "size", label: "EU size" }];
  if (collection === "mens-watches") return [{ key: "color", label: "Color" }];
  return [];
}

function normalizeOption(key, value) {
  const trimmedValue = String(value || "").trim();
  return key === "color" ? trimmedValue.toLowerCase().replaceAll(" ", "-") : trimmedValue;
}

function displayOptionValue(value) {
  return String(value || "").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function newVariantEntry(options, price = "", stock = "0", id, compareAtPrice = "", sku = "", barcode = "", costPerItem = "") {
  return { id: id || `variant-${globalThis.crypto?.randomUUID?.() || Date.now()}-${Math.random().toString(36).slice(2, 7)}`, options, price, stock, compareAtPrice, sku, barcode, costPerItem };
}

function profitMetrics(priceValue, costValue) {
  if (costValue === "" || costValue == null) return null;
  const price = Number(priceValue);
  const cost = Number(costValue);
  if (!Number.isFinite(price) || !Number.isFinite(cost)) return null;
  return { profit: price - cost, margin: price > 0 ? ((price - cost) / price) * 100 : null };
}

function combinationsFromGroups(groups) {
  return groups.reduce((combinations, group) => combinations.flatMap((combination) =>
    group.options.map((option) => ({ ...combination, [group.key]: option.value }))
  ), [{}]);
}

function defaultVariantGroups(collection, audience) {
  if (collection === "fragrances") {
    return [{ key: "volume", label: "Size", options: ["30 ml", "50 ml", "100 ml"].map((label) => ({ value: label, label })) }];
  }
  if (collection === "mens-shoes") {
    const colors = ["Black", "White", "Sand"].map((label) => ({ value: normalizeOption("color", label), label, swatch: colorSwatches[normalizeOption("color", label)] }));
    const sizes = defaultShoeSizes(audience).map((label) => ({ value: label, label }));
    return [{ key: "color", label: "Color", options: colors }, { key: "size", label: "EU size", options: sizes }];
  }
  if (collection === "mens-watches") {
    const colors = ["Gold", "Silver", "Black"].map((label) => ({ value: normalizeOption("color", label), label, swatch: colorSwatches[normalizeOption("color", label)] }));
    return [{ key: "color", label: "Color", options: colors }];
  }
  return [];
}

function defaultVariantEntries(collection, audience, previousEntries = []) {
  const groups = defaultVariantGroups(collection, audience);
  const oldEntries = new Map(previousEntries.map((entry) => [variantKey(entry.options || {}), entry]));
  return combinationsFromGroups(groups).map((options, index) => {
    const old = oldEntries.get(variantKey(options));
    return newVariantEntry(options, old?.price ?? "", old?.stock ?? "0", old?.id || `variant-default-${index}-${variantKey(options)}`, old?.compareAtPrice ?? "", old?.sku ?? "", old?.barcode ?? "", old?.costPerItem ?? "");
  });
}

function productVariantOptions(collection, entries) {
  return variantFields(collection).map(({ key, label }) => {
    const uniqueValues = [...new Set(entries.map((entry) => normalizeOption(key, entry.options?.[key])).filter(Boolean))];
    return {
      key,
      label,
      options: uniqueValues.map((value) => ({
        value,
        label: key === "color" ? displayOptionValue(value) : value,
        ...(key === "color" && colorSwatches[value] ? { swatch: colorSwatches[value] } : {}),
      })),
    };
  }).filter((group) => group.options.length > 0);
}

async function prepareDemoImage(file) {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Choose an image smaller than 12 MB.");

  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.readAsDataURL(file);
  });
  const image = await new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("The selected file is not a valid image."));
    element.src = source;
  });

  const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);

  for (const quality of [0.82, 0.72, 0.62, 0.52]) {
    const compressed = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (!compressed) break;
    if (compressed.size <= 350 * 1024) {
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("The compressed image could not be read."));
        reader.readAsDataURL(compressed);
      });
    }
  }
  throw new Error("This image is still too large for the browser demo. Choose a smaller image.");
}

function variantKey(options) {
  return Object.entries(options).sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${normalizeOption(key, value)}`).join("|");
}

function normalizedOptions(options) {
  return Object.fromEntries(Object.entries(options).map(([key, value]) => [key, normalizeOption(key, value)]));
}

function variantRowsForForm(form) {
  return Array.isArray(form.variantEntries) ? form.variantEntries : [];
}

const initialForm = {
  title: "",
  description: "",
  collection: "",
  audience: "",
  publicationStatus: "active",
  price: "",
  compareAtPrice: "",
  costPerItem: "",
  stock: "",
  sku: "",
  barcode: "",
  thumbnail: "",
  images: [],
  tags: [],
  variantEntries: [],
};

function formFromProduct(product) {
  const groups = getProductVariantOptions(product);
  const form = {
    ...initialForm,
    title: product.title || "",
    description: product.description || "",
    collection: product.storeCollection || "fragrances",
    audience: String(product.audience || "women").toLowerCase(),
    publicationStatus: product.publicationStatus || "active",
    price: String(product.price ?? ""),
    compareAtPrice: String(product.compareAtPrice ?? ""),
    costPerItem: String(product.costPerItem ?? ""),
    stock: String(product.stock ?? ""),
    sku: product.sku || "",
    barcode: product.barcode || "",
    thumbnail: product.images?.[0] || product.thumbnail || "",
    images: Array.isArray(product.images) && product.images.length
      ? product.images.filter((image) => typeof image === "string" && image.trim())
      : product.thumbnail ? [product.thumbnail] : [],
    tags: Array.isArray(product.tags) ? product.tags.filter((tag) => typeof tag === "string" && tag.trim()) : [],
  };
  const existingVariants = Array.isArray(product.variants) ? product.variants : [];
  const sourceGroups = groups.length ? groups : defaultVariantGroups(form.collection, form.audience);
  const combinations = combinationsFromGroups(sourceGroups);
  form.variantEntries = combinations.map((options, index) => {
    const match = existingVariants.find((variant) => variantKey(variant.options || {}) === variantKey(options));
    const count = combinations.length || 1;
    const stock = Math.floor(Number(product.stock || 0) / count)
      + (index < Number(product.stock || 0) % count ? 1 : 0);
    return newVariantEntry(
      options,
      String(match?.price ?? product.price ?? ""),
      String(match?.stock ?? stock),
      match?.id || `variant-edit-${index}-${variantKey(options)}`,
      String(match?.compareAtPrice ?? ""),
      String(match?.sku ?? ""),
      String(match?.barcode ?? ""),
      String(match?.costPerItem ?? "")
    );
  });
  return form;
}

function AdminProductsPage() {
  const storeCategories = getAdminCollections();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [publicationFilter, setPublicationFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [tagDraft, setTagDraft] = useState("");
  const [imageUrlDraft, setImageUrlDraft] = useState("");
  const [isPreparingImages, setIsPreparingImages] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const catalog = await getProducts({ includeUnpublished: true });
      setProducts(catalog);
    } catch {
      setLoadError("Products could not be loaded. Check your connection and try again.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getProducts({ signal: controller.signal, includeUnpublished: true })
      .then((catalog) => {
        if (!controller.signal.aborted) setProducts(catalog);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadError("Products could not be loaded. Check your connection and try again.");
          setProducts([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCollection = collectionFilter === "all" || product.storeCollection === collectionFilter;
      const matchesStatus = publicationFilter === "all" || (product.publicationStatus || "active") === publicationFilter;
      const matchesSearch = !normalizedSearch
        || `${product.title} ${product.brand || ""} ${(product.tags || []).join(" ")}`.toLowerCase().includes(normalizedSearch);
      return matchesCollection && matchesStatus && matchesSearch;
    });
  }, [products, search, collectionFilter, publicationFilter]);
  const availableProductTags = useMemo(() => [...new Set(products.flatMap((product) => product.tags || []))].sort(), [products]);

  const openCreateForm = () => {
    setEditingProduct(null);
    setForm(initialForm);
    setTagDraft("");
    setImageUrlDraft("");
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (product) => {
    setEditingProduct(product);
    setForm(formFromProduct(product));
    setTagDraft("");
    setImageUrlDraft("");
    setFormError("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    setFormError("");
    setImageUrlDraft("");
    setTagDraft("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setNotice("");
    const collection = storeCategories.find((item) => item.slug === form.collection);
    const audience = form.audience.toLowerCase();
    const variantRows = variantRowsForForm(form);
    const hasVariantFields = variantFields(form.collection).length > 0;
    if (form.images.length === 0) {
      setFormError("Add at least one product image by choosing a file or entering an image URL.");
      return;
    }
    if (!hasVariantFields && (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0)) {
      setFormError("Stock must be a whole number of pieces, such as 0, 1, 2, or 3.");
      return;
    }
    if (hasVariantFields && variantRows.length === 0) {
      setFormError("Add at least one size or color option.");
      return;
    }
    const variantKeys = variantRows.map((row) => variantKey(row.options));
    if (variantRows.some((row) => variantFields(form.collection).some(({ key }) => !row.options[key]?.trim())
      || !Number.isFinite(Number(row.price)) || Number(row.price) < 0
      || (row.compareAtPrice !== "" && (!Number.isFinite(Number(row.compareAtPrice)) || Number(row.compareAtPrice) <= Number(row.price)))
      || (row.costPerItem !== "" && (!Number.isFinite(Number(row.costPerItem)) || Number(row.costPerItem) < 0))
      || !Number.isInteger(Number(row.stock)) || Number(row.stock) < 0)
      || new Set(variantKeys).size !== variantKeys.length) {
      setFormError("Enter valid price, cost, and whole-number stock for every option. Compare-at price must be higher than selling price; cost cannot be negative.");
      return;
    }
    if (!hasVariantFields && form.costPerItem !== "" && (!Number.isFinite(Number(form.costPerItem)) || Number(form.costPerItem) < 0)) {
      setFormError("Cost per item must be zero or higher.");
      return;
    }
    if (!hasVariantFields && form.compareAtPrice !== "" && (!Number.isFinite(Number(form.compareAtPrice)) || Number(form.compareAtPrice) <= Number(form.price))) {
      setFormError("The compare-at price must be higher than the selling price.");
      return;
    }
    const variantSkus = variantRows.map((row) => row.sku.trim().toLowerCase()).filter(Boolean);
    const variantBarcodes = variantRows.map((row) => row.barcode.trim()).filter(Boolean);
    if (new Set(variantSkus).size !== variantSkus.length || new Set(variantBarcodes).size !== variantBarcodes.length) {
      setFormError("Each variant must have a unique SKU and barcode. Leave a field blank if you do not use it.");
      return;
    }
    const variants = variantRows.map((row, index) => ({
      id: `${editingProduct?.id || "new"}-${index + 1}`,
      options: normalizedOptions(row.options),
      price: Number(row.price),
      compareAtPrice: row.compareAtPrice === "" ? null : Number(row.compareAtPrice),
      stock: Number(row.stock),
      sku: row.sku.trim(),
      barcode: row.barcode.trim(),
      costPerItem: row.costPerItem === "" ? null : Number(row.costPerItem),
    }));
    const product = {
      ...(editingProduct || {}),
      title: form.title.trim(),
      description: form.description.trim(),
      brand: editingProduct?.brand || "Kemra",
      price: variants.length ? Math.min(...variants.map((variant) => variant.price)) : Number(form.price),
      compareAtPrice: variants.length ? null : (form.compareAtPrice === "" ? null : Number(form.compareAtPrice)),
      costPerItem: variants.length ? null : (form.costPerItem === "" ? null : Number(form.costPerItem)),
      stock: variants.length ? variants.reduce((total, variant) => total + variant.stock, 0) : Number(form.stock),
      category: categoryForCollection(form.collection, audience),
      storeCollection: form.collection,
      audience,
      publicationStatus: form.publicationStatus,
      sku: form.sku.trim(),
      barcode: form.barcode.trim(),
      tags: form.tags,
      thumbnail: form.images[0],
      images: form.images,
      rating: editingProduct?.rating ?? 0,
      tags: editingProduct?.tags || [],
      variantOptions: productVariantOptions(form.collection, variantRows),
      ...(variants.length ? { variants } : { variants: undefined }),
    };

    if (!collection?.audiences.some((option) => option.toLowerCase() === audience)) {
      setFormError("Choose an audience available for this collection.");
      return;
    }

    try {
      if (editingProduct) saveAdminProduct(product);
      else createAdminProduct(product);
      closeForm();
      setNotice(editingProduct ? "Product changes saved in this browser." : "Product added to this browser’s demo catalog.");
      await loadProducts();
    } catch (error) {
      setFormError(error.message || "The product could not be saved.");
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Remove “${product.title}” from this browser’s demo catalog?`)) return;
    setNotice("");
    try {
      deleteAdminProduct(product.id);
      setNotice("Product removed from this browser’s demo catalog.");
      await loadProducts();
    } catch (error) {
      setLoadError(error.message || "The product could not be removed.");
    }
  };

  const updateForm = (event) => {
    const { name, value } = event.target;
    if (name === "stock" && value !== "" && !/^\d+$/.test(value)) return;
    setForm((current) => {
      const nextForm = { ...current, [name]: value };
      if (name === "collection") {
        const selectedCategory = storeCategories.find((category) => category.slug === value);
        const isAudienceAvailable = selectedCategory?.audiences.some(
          (audience) => audience.toLowerCase() === current.audience
        );
        if (!isAudienceAvailable) nextForm.audience = selectedCategory?.audiences[0]?.toLowerCase() || "";
        nextForm.variantEntries = defaultVariantEntries(value, nextForm.audience);
      }
      if (name === "audience" && current.collection === "mens-shoes") {
        const untouched = current.variantEntries.every((entry) => !entry.price && Number(entry.stock || 0) === 0);
        if (untouched) nextForm.variantEntries = defaultVariantEntries("mens-shoes", value, current.variantEntries);
      }
      return nextForm;
    });
  };

  const updateVariantValue = (rowId, field, value) => {
    if (field === "stock" && value !== "" && !/^\d+$/.test(value)) return;
    const isOptionField = variantFields(form.collection).some((variantField) => variantField.key === field);
    setForm((current) => ({
      ...current,
      variantEntries: current.variantEntries.map((entry) => entry.id === rowId
        ? isOptionField
          ? { ...entry, options: { ...entry.options, [field]: value } }
          : { ...entry, [field]: value }
        : entry),
    }));
  };

  const addVariantRow = () => {
    const options = Object.fromEntries(variantFields(form.collection).map(({ key }) => [key, ""]));
    setForm((current) => ({ ...current, variantEntries: [...current.variantEntries, newVariantEntry(options)] }));
  };

  const removeVariantRow = (rowId) => {
    setForm((current) => ({
      ...current,
      variantEntries: current.variantEntries.filter((entry) => entry.id !== rowId),
    }));
  };

  const handleImageSelection = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    if (form.images.length + files.length > 6) {
      setFormError("The browser preview supports up to 6 images per product.");
      return;
    }
    setFormError("");
    setIsPreparingImages(true);
    try {
      const imageData = await Promise.all(files.map(prepareDemoImage));
      setForm((current) => {
        const images = [...current.images, ...imageData];
        return { ...current, images, thumbnail: images[0] || "" };
      });
    } catch (error) {
      setFormError(error.message || "The image could not be prepared.");
    } finally {
      setIsPreparingImages(false);
    }
  };

  const addImageUrl = () => {
    const value = imageUrlDraft.trim();
    if (!value) return;
    if (form.images.length >= 6) {
      setFormError("The browser preview supports up to 6 images per product.");
      return;
    }
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid protocol");
    } catch {
      setFormError("Enter a valid http or https image URL.");
      return;
    }
    if (form.images.includes(value)) {
      setFormError("This image is already in the gallery.");
      return;
    }
    const images = [...form.images, value];
    setForm((current) => ({ ...current, images, thumbnail: images[0] || "" }));
    setImageUrlDraft("");
    setFormError("");
  };

  const reorderImage = (imageIndex, destination) => {
    setForm((current) => {
      if (destination < 0 || destination >= current.images.length) return current;
      const images = [...current.images];
      const [image] = images.splice(imageIndex, 1);
      images.splice(destination, 0, image);
      return { ...current, images, thumbnail: images[0] || "" };
    });
  };

  const removeImage = (imageIndex) => {
    setForm((current) => {
      const images = current.images.filter((_, index) => index !== imageIndex);
      return { ...current, images, thumbnail: images[0] || "" };
    });
  };

  const addTag = () => {
    const tag = tagDraft.trim().replace(/,$/, "").trim();
    if (!tag) return;
    if (tag.length > 255) {
      setFormError("Product tags can be up to 255 characters.");
      return;
    }
    if (form.tags.length >= 250) {
      setFormError("A product can have up to 250 tags.");
      return;
    }
    if (form.tags.some((existingTag) => existingTag.toLowerCase() === tag.toLowerCase())) {
      setTagDraft("");
      return;
    }
    setForm((current) => ({ ...current, tags: [...current.tags, tag] }));
    setTagDraft("");
    setFormError("");
  };

  const removeTag = (tagToRemove) => {
    setForm((current) => ({ ...current, tags: current.tags.filter((tag) => tag !== tagToRemove) }));
  };

  const variantRows = variantRowsForForm(form);
  const currentVariantFields = variantFields(form.collection);

  return (
    <div className="admin-products-page">
      <header className="admin-products-heading">
        <div>
          <Link className="admin-products-back" to="/admin"><FiArrowLeft aria-hidden="true" /> Overview</Link>
          <p className="admin-eyebrow">Catalog management</p>
          <h1>Products</h1>
          <p>Manage the demo catalog shown in the storefront on this browser.</p>
        </div>
        <button className="admin-products-add" type="button" onClick={openCreateForm}>
          <FiPlus aria-hidden="true" /> Add product
        </button>
      </header>

      <div className="admin-products-notice" role="note">
        Demo mode: product changes are saved in this browser and appear in the storefront here. They are not uploaded to a live store.
      </div>
      {notice && <p className="admin-products-feedback" role="status">{notice}</p>}

      <section className="admin-products-panel" aria-label="Product catalog">
        <div className="admin-products-toolbar">
          <label className="admin-products-search">
            <FiSearch aria-hidden="true" />
            <span className="visually-hidden">Search products</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" />
          </label>
          <label className="admin-products-filter">
            <span className="visually-hidden">Filter by collection</span>
            <select value={collectionFilter} onChange={(event) => setCollectionFilter(event.target.value)}>
              <option value="all">All collections</option>
              {storeCategories.map((category) => <option value={category.slug} key={category.slug}>{category.name}</option>)}
            </select>
          </label>
          <label className="admin-products-filter">
            <span className="visually-hidden">Filter by publication status</span>
            <select value={publicationFilter} onChange={(event) => setPublicationFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="unlisted">Unlisted</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <span className="admin-products-count">{visibleProducts.length} products</span>
        </div>

        {loadError && (
          <div className="admin-products-error" role="alert">
            <p>{loadError}</p>
            <button type="button" onClick={loadProducts}>Try again</button>
          </div>
        )}

        {isLoading ? (
          <p className="admin-products-state" role="status">Loading catalog…</p>
        ) : visibleProducts.length === 0 ? (
          <p className="admin-products-state">No products match this search.</p>
        ) : (
          <div className="admin-products-table-wrap">
            <table className="admin-products-table">
              <thead>
                <tr><th scope="col">Product</th><th scope="col">Collection</th><th scope="col">Price</th><th scope="col">Stock</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr>
              </thead>
              <tbody>
                {visibleProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="admin-products-table__product-cell">
                      <div className="admin-product-cell">
                        <img src={product.thumbnail || product.images?.[0]} alt="" loading="lazy" />
                        <span><strong>{product.title}</strong><small>{product.audience || product.brand || "Kemra"}</small></span>
                      </div>
                    </td>
                    <td data-label="Collection">{storeCategories.find((item) => item.slug === product.storeCollection)?.name || product.storeCollection}</td>
                    <td data-label="Price">${Number(product.price).toFixed(2)}</td>
                    <td data-label="Stock"><span className={`admin-stock-pill${product.stock <= 0 ? " is-empty" : ""}`}>{product.stock ?? "—"}</span></td>
                    <td data-label="Status"><span className={`admin-product-status is-${product.publicationStatus || "active"}`}>{(product.publicationStatus || "active").replace(/^./, (letter) => letter.toUpperCase())}</span></td>
                    <td className="admin-products-table__actions" data-label="Actions">
                      <div className="admin-product-actions">
                        <button type="button" aria-label={`Edit ${product.title}`} onClick={() => openEditForm(product)}><FiEdit2 aria-hidden="true" /></button>
                        <button type="button" aria-label={`Delete ${product.title}`} onClick={() => handleDelete(product)}><FiTrash2 aria-hidden="true" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isFormOpen && (
        <div className="admin-product-form-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeForm();
        }}>
          <section className="admin-product-form-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-product-form-title">
            <header>
              <div><p className="admin-eyebrow">Catalog item</p><h2 id="admin-product-form-title">{editingProduct ? "Edit product" : "Add product"}</h2></div>
              <button className="admin-product-form-close" type="button" onClick={closeForm} aria-label="Close form">×</button>
            </header>
            <form onSubmit={handleSubmit}>
              <label className="admin-form-field admin-form-field--full"><span>What type of product are you adding?</span><select name="collection" value={form.collection} onChange={updateForm} required><option value="">Select a product type</option>{storeCategories.map((category) => <option value={category.slug} key={category.slug}>{category.name}</option>)}</select></label>
              {form.collection && <>
                <label className="admin-form-field admin-form-field--full"><span>Product name</span><input name="title" value={form.title} onChange={updateForm} required maxLength={100} /></label>
                <label className="admin-form-field admin-form-field--full"><span>Product status</span><select name="publicationStatus" value={form.publicationStatus} onChange={updateForm}><option value="active">Active · visible in the storefront</option><option value="draft">Draft · hidden from customers</option><option value="unlisted">Unlisted · direct link only</option><option value="archived">Archived · removed from the storefront</option></select><small>Unlisted products stay out of collections and search but can open by direct link. Inventory stock remains separate.</small></label>
                <div className="admin-form-grid">
                <label className="admin-form-field"><span>Audience</span><select name="audience" value={form.audience} onChange={updateForm}>{(storeCategories.find((category) => category.slug === form.collection)?.audiences || []).map((audience) => <option value={audience.toLowerCase()} key={audience}>{audience}</option>)}</select></label>
                <div className="admin-form-field admin-form-field--full">
                  <span>Product tags</span>
                  <div className="admin-tags-entry">
                    <input list="admin-product-tag-suggestions" value={tagDraft} maxLength={255} onChange={(event) => setTagDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} placeholder="Type a tag, then press Enter" aria-label="Enter a product tag" />
                    <datalist id="admin-product-tag-suggestions">{availableProductTags.map((tag) => <option value={tag} key={tag} />)}</datalist>
                    <button type="button" onClick={addTag} disabled={!tagDraft.trim()}>Add tag</button>
                  </div>
                  <small>Tags help you organize and find products. They can also match customers’ store searches, but they aren’t shown on product pages. Up to 250 tags, 255 characters each.</small>
                  {form.tags.length > 0 && <div className="admin-product-tags" aria-label="Added product tags">{form.tags.map((tag) => <span className="admin-product-tag" key={tag}>{tag}<button type="button" aria-label={`Remove tag ${tag}`} onClick={() => removeTag(tag)}>×</button></span>)}</div>}
                </div>
                {currentVariantFields.length === 0 && <>
                  <label className="admin-form-field"><span>Price ($)</span><input name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateForm} required /></label>
                  <label className="admin-form-field"><span>Compare-at price ($)</span><input name="compareAtPrice" type="number" min={Number(form.price) + 0.01} step="0.01" value={form.compareAtPrice} onChange={updateForm} placeholder="Optional original price" /><small>Must be higher than the selling price.</small></label>
                  <label className="admin-form-field"><span>Cost per item ($)</span><input name="costPerItem" type="number" min="0" step="0.01" value={form.costPerItem} onChange={updateForm} placeholder="Optional internal cost" /></label>
                  <div className="admin-form-field"><span>Profit and margin</span>{profitMetrics(form.price, form.costPerItem) ? <p className="admin-profit-preview">${profitMetrics(form.price, form.costPerItem).profit.toFixed(2)} profit · {profitMetrics(form.price, form.costPerItem).margin == null ? "—" : `${profitMetrics(form.price, form.costPerItem).margin.toFixed(1)}%`} margin</p> : <p className="admin-profit-preview is-empty">Enter a cost to calculate.</p>}</div>
                  <label className="admin-form-field"><span>Stock (whole pieces)</span><input name="stock" type="number" min="0" step="1" value={form.stock} onChange={updateForm} required /></label>
                  <label className="admin-form-field"><span>SKU (optional)</span><input name="sku" value={form.sku} onChange={updateForm} maxLength={64} placeholder="e.g. KEM-ACC-001" /></label>
                  <label className="admin-form-field"><span>Barcode (optional)</span><input name="barcode" value={form.barcode} onChange={updateForm} maxLength={64} placeholder="UPC, EAN, or other code" /></label>
                </>}
                <div className="admin-form-field admin-form-field--full">
                  <span>Product images</span>
                  <label className="admin-image-upload">
                    <span>{isPreparingImages ? "Preparing images…" : "Choose images from this device"}</span>
                    <input type="file" accept="image/*" multiple disabled={isPreparingImages || form.images.length >= 6} onChange={handleImageSelection} />
                  </label>
                  <small className="admin-image-upload-hint">Add up to 6 images for this browser preview. The first image is the main product image. Uploaded files are resized; each file must be under 12 MB.</small>
                  <div className="admin-image-url-row">
                    <input aria-label="Direct image URL" type="url" value={imageUrlDraft} onChange={(event) => setImageUrlDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addImageUrl(); } }} placeholder="Paste a direct image URL (https://…)" />
                    <button type="button" onClick={addImageUrl} disabled={form.images.length >= 6}>Add URL</button>
                  </div>
                  {form.images.length > 0 ? (
                    <div className="admin-product-gallery__grid">
                      {form.images.map((image, index) => (
                        <article className={`admin-product-gallery__item${index === 0 ? " is-main" : ""}`} key={`${image.slice(0, 40)}-${index}`}>
                          <img src={image} alt={`Product view ${index + 1}`} />
                          {index === 0 && <span className="admin-product-gallery__badge"><FiStar aria-hidden="true" /> Main image</span>}
                          <div className="admin-product-gallery__controls">
                            {index !== 0 && <button type="button" title="Set as main image" aria-label={`Set image ${index + 1} as main image`} onClick={() => reorderImage(index, 0)}><FiStar aria-hidden="true" /></button>}
                            <button type="button" title="Move earlier" aria-label={`Move image ${index + 1} earlier`} disabled={index === 0} onClick={() => reorderImage(index, index - 1)}><FiArrowLeft aria-hidden="true" /></button>
                            <button type="button" title="Move later" aria-label={`Move image ${index + 1} later`} disabled={index === form.images.length - 1} onClick={() => reorderImage(index, index + 1)}><FiArrowRight aria-hidden="true" /></button>
                            <button type="button" title="Remove image" aria-label={`Remove image ${index + 1}`} onClick={() => removeImage(index)}><FiTrash2 aria-hidden="true" /></button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : <p className="admin-product-gallery__empty">No product images added yet.</p>}
                </div>
                {currentVariantFields.length > 0 && <div className="admin-form-field admin-form-field--full">
                  <span>Variants · option, pricing, inventory, and identifiers</span>
                  <small>Compare-at price is optional and higher than the selling price. Cost is internal and can be higher than the price to show a loss. SKUs and barcodes must be unique when entered.</small>
                  <div className="admin-variant-table-wrap"><table className="admin-variant-table">
                    <thead><tr>{currentVariantFields.map((field) => <th key={field.key}>{field.label}</th>)}<th>Price ($)</th><th>Compare-at ($)</th><th>Cost ($)</th><th>Profit</th><th>Margin</th><th>Stock (pieces)</th><th>SKU</th><th>Barcode</th><th><span className="visually-hidden">Remove</span></th></tr></thead>
                    <tbody>{variantRows.map((row) => {
                      const metrics = profitMetrics(row.price, row.costPerItem);
                      return <tr key={row.id}>
                        {currentVariantFields.map((field) => <td key={field.key}><input aria-label={`${field.label} for variant ${row.id}`} type="text" required value={field.key === "color" ? displayOptionValue(row.options[field.key]) : row.options[field.key] || ""} onChange={(event) => updateVariantValue(row.id, field.key, event.target.value)} /></td>)}
                        <td><input aria-label={`Price for variant ${row.id}`} type="number" min="0" step="0.01" required value={row.price} onChange={(event) => updateVariantValue(row.id, "price", event.target.value)} /></td>
                        <td><input aria-label={`Compare-at price for variant ${row.id}`} type="number" min={Number(row.price) + 0.01} step="0.01" value={row.compareAtPrice || ""} onChange={(event) => updateVariantValue(row.id, "compareAtPrice", event.target.value)} placeholder="Optional" /></td>
                        <td><input aria-label={`Cost per item for variant ${row.id}`} type="number" min="0" step="0.01" value={row.costPerItem || ""} onChange={(event) => updateVariantValue(row.id, "costPerItem", event.target.value)} placeholder="Optional" /></td>
                        <td className="admin-variant-metric">{metrics ? `$${metrics.profit.toFixed(2)}` : "—"}</td>
                        <td className="admin-variant-metric">{metrics?.margin == null ? "—" : `${metrics.margin.toFixed(1)}%`}</td>
                        <td><input aria-label={`Stock for variant ${row.id}`} type="number" min="0" step="1" required value={row.stock} onChange={(event) => updateVariantValue(row.id, "stock", event.target.value)} /></td>
                        <td><input aria-label={`SKU for variant ${row.id}`} type="text" maxLength={64} value={row.sku || ""} onChange={(event) => updateVariantValue(row.id, "sku", event.target.value)} placeholder="Optional" /></td>
                        <td><input aria-label={`Barcode for variant ${row.id}`} type="text" maxLength={64} value={row.barcode || ""} onChange={(event) => updateVariantValue(row.id, "barcode", event.target.value)} placeholder="Optional" /></td>
                        <td><button className="admin-variant-remove" type="button" aria-label="Remove variant" onClick={() => removeVariantRow(row.id)}><FiTrash2 aria-hidden="true" /></button></td>
                      </tr>;
                    })}</tbody>
                  </table></div>
                  <button className="admin-variant-add" type="button" onClick={addVariantRow}><FiPlus aria-hidden="true" /> Add option</button>
                </div>}
                <label className="admin-form-field admin-form-field--full"><span>Description</span><textarea name="description" rows="3" value={form.description} onChange={updateForm} required maxLength={600} /></label>
              </div>
              </>}
              {formError && <p className="admin-product-form-error" role="alert">{formError}</p>}
              <p className="admin-product-form-hint">Each row is one sellable option with its own selling price, cost, and whole-piece stock. Profit and margin are internal estimates based on selling price minus item cost. Changes are saved in this browser only.</p>
              <footer><button className="admin-product-form-cancel" type="button" onClick={closeForm}>Cancel</button><button className="admin-product-form-save" type="submit" disabled={isPreparingImages}>{editingProduct ? "Save changes" : "Add product"}</button></footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminProductsPage;
