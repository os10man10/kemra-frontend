import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowDown, FiArrowLeft, FiArrowUp, FiEye, FiEyeOff, FiSave } from "react-icons/fi";
import { getAdminCollections, saveAdminCollections } from "./adminCollections";
import "./AdminCollectionsPage.css";

function AdminCollectionsPage() {
  const [collections, setCollections] = useState(() => getAdminCollections());
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const updateCollection = (slug, changes) => {
    setCollections((current) => current.map((collection) => collection.slug === slug
      ? { ...collection, ...changes }
      : collection));
    setNotice("");
  };

  const moveCollection = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= collections.length) return;
    setCollections((current) => {
      const reordered = [...current];
      [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
      return reordered;
    });
    setNotice("");
  };

  const save = () => {
    setError("");
    if (collections.some((collection) => !collection.name.trim())) {
      setError("Every collection needs a display name.");
      return;
    }
    if (!saveAdminCollections(collections)) {
      setError("The browser could not save your collection settings.");
      return;
    }
    setNotice("Collection settings saved. Refresh the storefront to see the changes.");
  };

  return (
    <div className="admin-collections-page">
      <Link className="admin-collections-back" to="/admin"><FiArrowLeft aria-hidden="true" /> Admin overview</Link>
      <header className="admin-collections-heading">
        <div>
          <p className="admin-eyebrow">Catalog organization</p>
          <h1>Collections</h1>
          <p>Control where Kemra collections appear across your storefront.</p>
        </div>
        <button className="admin-collections-save" type="button" onClick={save}><FiSave aria-hidden="true" /> Save changes</button>
      </header>

      <p className="admin-collections-note">This preview manages the three connected collections. New product types such as makeup and accessories need their own product data before they can be activated here.</p>
      {notice && <p className="admin-collections-feedback" role="status">{notice}</p>}
      {error && <p className="admin-collections-error" role="alert">{error}</p>}

      <section className="admin-collections-list" aria-label="Store collections">
        {collections.map((collection, index) => (
          <article className="admin-collection-card" key={collection.slug}>
            <div className="admin-collection-card__identity">
              <span className="admin-collection-number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <span className="admin-collection-kind">{collection.slug}</span>
                <h2>{collection.name}</h2>
                <p>{collection.audiences.join(" · ")}</p>
              </div>
            </div>
            <div className="admin-collection-card__settings">
              <label className="admin-collection-name">
                <span>Store display name</span>
                <input value={collection.name} maxLength={45} onChange={(event) => updateCollection(collection.slug, { name: event.target.value })} />
              </label>
              <label className="admin-collection-toggle">
                <input type="checkbox" checked={collection.navigationEnabled} onChange={(event) => updateCollection(collection.slug, { navigationEnabled: event.target.checked })} />
                <span className="admin-collection-toggle__icon">{collection.navigationEnabled ? <FiEye aria-hidden="true" /> : <FiEyeOff aria-hidden="true" />}</span>
                <span><strong>Show in navigation</strong><small>Header and category menu</small></span>
              </label>
              <label className="admin-collection-toggle">
                <input type="checkbox" checked={collection.homeEnabled} onChange={(event) => updateCollection(collection.slug, { homeEnabled: event.target.checked })} />
                <span className="admin-collection-toggle__icon">{collection.homeEnabled ? <FiEye aria-hidden="true" /> : <FiEyeOff aria-hidden="true" />}</span>
                <span><strong>Show on home page</strong><small>Collection product slider</small></span>
              </label>
            </div>
            <div className="admin-collection-card__order" aria-label={`Order controls for ${collection.name}`}>
              <button type="button" aria-label={`Move ${collection.name} up`} disabled={index === 0} onClick={() => moveCollection(index, -1)}><FiArrowUp aria-hidden="true" /></button>
              <button type="button" aria-label={`Move ${collection.name} down`} disabled={index === collections.length - 1} onClick={() => moveCollection(index, 1)}><FiArrowDown aria-hidden="true" /></button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default AdminCollectionsPage;
