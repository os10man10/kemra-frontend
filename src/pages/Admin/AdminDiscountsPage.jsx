import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiTag, FiTrash2 } from "react-icons/fi";
import { getAdminDiscounts, saveAdminDiscounts, normalizeDiscountCode } from "./adminDiscounts";
import "./AdminDiscountsPage.css";

const emptyDiscount = {
  code: "",
  type: "percentage",
  value: "",
  minimumSubtotal: "",
  startsAt: "",
  endsAt: "",
  active: true,
};

function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState(() => getAdminDiscounts());
  const [form, setForm] = useState(emptyDiscount);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setError("");
    setNotice("");
  };

  const resetForm = () => {
    setForm(emptyDiscount);
    setEditingId(null);
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const code = normalizeDiscountCode(form.code);
    const value = Number(form.value);
    const minimumSubtotal = form.minimumSubtotal === "" ? 0 : Number(form.minimumSubtotal);
    if (!/^[A-Z0-9][A-Z0-9_-]{2,19}$/.test(code)) {
      setError("Use 3–20 letters, numbers, hyphens, or underscores for the code.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0 || (form.type === "percentage" && value > 100)) {
      setError(form.type === "percentage" ? "Enter a percentage from 1 to 100." : "Enter a fixed discount greater than zero.");
      return;
    }
    if (!Number.isFinite(minimumSubtotal) || minimumSubtotal < 0) {
      setError("The minimum order value must be zero or more.");
      return;
    }
    if (form.startsAt && form.endsAt && form.endsAt < form.startsAt) {
      setError("The end date must be on or after the start date.");
      return;
    }
    if (discounts.some((discount) => normalizeDiscountCode(discount.code) === code && discount.id !== editingId)) {
      setError("That code already exists. Choose a different code.");
      return;
    }

    const nextDiscount = {
      id: editingId || `discount-${Date.now()}`,
      code,
      type: form.type,
      value,
      minimumSubtotal,
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      active: form.active,
    };
    const nextDiscounts = editingId
      ? discounts.map((discount) => discount.id === editingId ? nextDiscount : discount)
      : [nextDiscount, ...discounts];
    if (!saveAdminDiscounts(nextDiscounts)) {
      setError("The browser could not save this discount.");
      return;
    }
    setDiscounts(nextDiscounts);
    setNotice(`${code} ${editingId ? "updated" : "created"}.`);
    resetForm();
  };

  const editDiscount = (discount) => {
    setEditingId(discount.id);
    setForm({ ...emptyDiscount, ...discount, value: String(discount.value), minimumSubtotal: discount.minimumSubtotal ? String(discount.minimumSubtotal) : "" });
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteDiscount = (discount) => {
    const nextDiscounts = discounts.filter((item) => item.id !== discount.id);
    if (!saveAdminDiscounts(nextDiscounts)) {
      setError("The browser could not delete this discount.");
      return;
    }
    setDiscounts(nextDiscounts);
    if (editingId === discount.id) resetForm();
    setNotice(`${discount.code} deleted.`);
  };

  const toggleDiscount = (discount) => {
    const nextDiscounts = discounts.map((item) => item.id === discount.id ? { ...item, active: !item.active } : item);
    if (!saveAdminDiscounts(nextDiscounts)) {
      setError("The browser could not update this discount.");
      return;
    }
    setDiscounts(nextDiscounts);
    setNotice(`${discount.code} ${discount.active ? "paused" : "activated"}.`);
  };

  return (
    <div className="admin-discounts-page">
      <Link className="admin-discounts-back" to="/admin"><FiArrowLeft aria-hidden="true" /> Admin overview</Link>
      <header className="admin-discounts-heading">
        <div>
          <p className="admin-eyebrow">Sales and promotions</p>
          <h1>Discounts</h1>
          <p>Create simple codes customers can use in the cart or at checkout.</p>
        </div>
        <span className="admin-discounts-count"><FiTag aria-hidden="true" /> {discounts.length} codes</span>
      </header>

      <p className="admin-discounts-note">Preview mode: discount codes are stored in this browser. They are not shared with other devices and do not create real orders.</p>
      {notice && <p className="admin-discounts-feedback" role="status">{notice}</p>}
      {error && <p className="admin-discounts-error" role="alert">{error}</p>}

      <form className="admin-discount-form" onSubmit={handleSubmit}>
        <div className="admin-discount-form__heading">
          <span className="admin-discount-form__icon"><FiTag aria-hidden="true" /></span>
          <div><h2>{editingId ? "Edit discount" : "Create discount code"}</h2><p>Choose how much to take off and when the code can be used.</p></div>
        </div>
        <div className="admin-discount-fields">
          <label className="admin-discount-field">
            <span>Discount code</span>
            <input name="code" value={form.code} onChange={updateField} placeholder="e.g. KEMRA10" maxLength={20} autoComplete="off" required />
          </label>
          <label className="admin-discount-field">
            <span>Discount type</span>
            <select name="type" value={form.type} onChange={updateField}>
              <option value="percentage">Percentage off</option>
              <option value="fixed">Fixed amount off</option>
            </select>
          </label>
          <label className="admin-discount-field">
            <span>{form.type === "percentage" ? "Percentage" : "Amount (USD)"}</span>
            <input name="value" type="number" min="0.01" max={form.type === "percentage" ? 100 : undefined} step="0.01" value={form.value} onChange={updateField} required />
          </label>
          <label className="admin-discount-field">
            <span>Minimum order value (USD)</span>
            <input name="minimumSubtotal" type="number" min="0" step="0.01" value={form.minimumSubtotal} onChange={updateField} placeholder="No minimum" />
          </label>
          <label className="admin-discount-field">
            <span>Starts on</span>
            <input name="startsAt" type="date" value={form.startsAt} onChange={updateField} />
          </label>
          <label className="admin-discount-field">
            <span>Ends on</span>
            <input name="endsAt" type="date" value={form.endsAt} onChange={updateField} />
          </label>
        </div>
        <label className="admin-discount-active"><input name="active" type="checkbox" checked={form.active} onChange={updateField} /><span>Active and available to customers</span></label>
        <div className="admin-discount-form__actions">
          {editingId && <button className="admin-discount-secondary" type="button" onClick={resetForm}>Cancel edit</button>}
          <button className="admin-discount-submit" type="submit">{editingId ? "Save discount" : "Create discount"}</button>
        </div>
      </form>

      <section className="admin-discount-list" aria-labelledby="admin-discount-list-title">
        <div className="admin-discount-list__heading"><div><p className="admin-eyebrow">Your promotions</p><h2 id="admin-discount-list-title">Discount codes</h2></div></div>
        {discounts.length === 0 ? (
          <div className="admin-discount-empty"><FiTag aria-hidden="true" /><strong>No discount codes yet</strong><span>Create a code above, then try it in your cart.</span></div>
        ) : (
          <div className="admin-discount-table-wrap">
            <table className="admin-discount-table">
              <thead><tr><th>Code</th><th>Offer</th><th>Minimum</th><th>Validity</th><th>Status</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
              <tbody>{discounts.map((discount) => (
                <tr key={discount.id}>
                  <td><strong className="admin-discount-code">{discount.code}</strong></td>
                  <td>{discount.type === "percentage" ? `${discount.value}% off` : `$${Number(discount.value).toFixed(2)} off`}</td>
                  <td>{Number(discount.minimumSubtotal) > 0 ? `$${Number(discount.minimumSubtotal).toFixed(2)}` : "None"}</td>
                  <td>{discount.startsAt || discount.endsAt ? `${discount.startsAt || "Now"} – ${discount.endsAt || "No end"}` : "Always"}</td>
                  <td><button className={`admin-discount-status${discount.active ? " is-active" : ""}`} type="button" onClick={() => toggleDiscount(discount)}>{discount.active ? "Active" : "Paused"}</button></td>
                  <td className="admin-discount-actions"><button type="button" onClick={() => editDiscount(discount)}>Edit</button><button type="button" aria-label={`Delete ${discount.code}`} onClick={() => deleteDiscount(discount)}><FiTrash2 aria-hidden="true" /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDiscountsPage;
