import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiMail, FiSave } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa6";
import { defaultStoreSettings, getAdminStoreSettings, saveAdminStoreSettings } from "./adminStoreSettings";
import "./AdminStoreSettingsPage.css";

const socialFields = [
  { key: "instagram", label: "Instagram", icon: <FaInstagram aria-hidden="true" /> },
  { key: "facebook", label: "Facebook", icon: <FaFacebookF aria-hidden="true" /> },
  { key: "whatsapp", label: "WhatsApp", icon: <FaWhatsapp aria-hidden="true" /> },
  { key: "tiktok", label: "TikTok", icon: <FaTiktok aria-hidden="true" /> },
];

function isWebUrl(value) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function AdminStoreSettingsPage() {
  const [settings, setSettings] = useState(() => getAdminStoreSettings());
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const updateSocial = (key, value) => {
    setSettings((current) => ({ ...current, socials: { ...current.socials, [key]: value } }));
    setNotice("");
  };

  const save = (event) => {
    event.preventDefault();
    setError("");
    if (!settings.supportEmail.trim() || !/^\S+@\S+\.\S+$/.test(settings.supportEmail.trim())) {
      setError("Enter a valid customer support email address.");
      return;
    }
    const invalidSocial = socialFields.find(({ key }) => !isWebUrl(settings.socials[key] || ""));
    if (invalidSocial) {
      setError(`${invalidSocial.label} needs a valid http or https link, or leave it empty to hide it.`);
      return;
    }
    if (!saveAdminStoreSettings(settings)) {
      setError("The browser could not save these store settings.");
      return;
    }
    setNotice("Store settings saved. Refresh the storefront to see the updated contact and footer links.");
  };

  const reset = () => {
    setSettings(defaultStoreSettings);
    setNotice("");
    setError("");
  };

  return (
    <div className="admin-store-settings-page">
      <Link className="admin-store-settings-back" to="/admin"><FiArrowLeft aria-hidden="true" /> Admin overview</Link>
      <header className="admin-store-settings-heading">
        <div>
          <p className="admin-eyebrow">Store configuration</p>
          <h1>Store settings</h1>
          <p>Manage how customers reach Kemra and the links shown in your footer.</p>
        </div>
        <button className="admin-store-settings-save" type="submit" form="admin-store-settings-form"><FiSave aria-hidden="true" /> Save changes</button>
      </header>

      <p className="admin-store-settings-note">These settings are saved in this browser for the current preview. Once the backend is connected, the same controls can save store-wide settings for every device.</p>
      {notice && <p className="admin-store-settings-feedback" role="status">{notice}</p>}
      {error && <p className="admin-store-settings-error" role="alert">{error}</p>}

      <form id="admin-store-settings-form" className="admin-store-settings-form" onSubmit={save}>
        <section className="admin-settings-card" aria-labelledby="admin-contact-settings-title">
          <div className="admin-settings-card__heading">
            <span><FiMail aria-hidden="true" /></span>
            <div><h2 id="admin-contact-settings-title">Customer contact</h2><p>Used by the contact form when a customer sends a message.</p></div>
          </div>
          <label className="admin-settings-field">
            <span>Support email</span>
            <input type="email" value={settings.supportEmail} onChange={(event) => { setSettings((current) => ({ ...current, supportEmail: event.target.value })); setNotice(""); }} required />
          </label>
        </section>

        <section className="admin-settings-card" aria-labelledby="admin-social-settings-title">
          <div className="admin-settings-card__heading">
            <span><FaInstagram aria-hidden="true" /></span>
            <div><h2 id="admin-social-settings-title">Social channels</h2><p>These links appear on the contact section and in the footer.</p></div>
          </div>
          <div className="admin-social-settings-grid">
            {socialFields.map((field) => (
              <label className="admin-settings-field" key={field.key}>
                <span>{field.icon}{field.label}</span>
                <input type="url" value={settings.socials[field.key] || ""} onChange={(event) => updateSocial(field.key, event.target.value)} placeholder={`https://${field.key}.com/…`} />
              </label>
            ))}
          </div>
          <p className="admin-settings-hint">Leave a social link empty to hide that channel from customers.</p>
        </section>

        <section className="admin-settings-card" aria-labelledby="admin-footer-settings-title">
          <div className="admin-settings-card__heading">
            <span>K</span>
            <div><h2 id="admin-footer-settings-title">Footer brand description</h2><p>A short line about Kemra shown beside the logo.</p></div>
          </div>
          <label className="admin-settings-field">
            <span>Description</span>
            <textarea rows="3" maxLength={220} value={settings.footerDescription} onChange={(event) => { setSettings((current) => ({ ...current, footerDescription: event.target.value })); setNotice(""); }} />
          </label>
          <p className="admin-settings-character-count">{settings.footerDescription.length} / 220</p>
        </section>

        <div className="admin-store-settings-bottom-actions">
          <button type="button" className="admin-settings-reset" onClick={reset}>Restore current defaults</button>
          <button type="submit" className="admin-store-settings-save"><FiSave aria-hidden="true" /> Save changes</button>
        </div>
      </form>
    </div>
  );
}

export default AdminStoreSettingsPage;
