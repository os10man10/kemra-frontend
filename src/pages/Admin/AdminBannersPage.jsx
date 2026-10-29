import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowDown, FiArrowLeft, FiArrowUp, FiEye, FiEyeOff, FiPlus, FiSave, FiTrash2, FiUpload } from "react-icons/fi";
import { deleteAdminBannerMedia, getAdminBanners, saveAdminBanners, storeAdminBannerMedia } from "./adminBanners";
import "./AdminBannersPage.css";

async function prepareBannerImage(file) {
  if (!file?.type.startsWith("image/")) throw new Error("Choose an image file.");
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
    element.onerror = () => reject(new Error("The selected image is invalid."));
    element.src = source;
  });

  const scale = Math.min(1, 2000 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);

  for (const quality of [0.82, 0.72, 0.62, 0.52]) {
    const compressed = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (compressed && compressed.size <= 450 * 1024) return compressed;
  }
  throw new Error("This image is still too large for the browser demo. Choose a smaller image.");
}

function makeNewBanner() {
  return {
    id: `custom-${globalThis.crypto?.randomUUID?.() || Date.now()}`,
    eyebrow: "KEMRA COLLECTION",
    title: "NEW\nCOLLECTION",
    description: "A NEW CHAPTER\nIN THE KEMRA STORY",
    buttonLabel: "Shop Now",
    link: "/",
    image: "",
    alt: "",
    enabled: false,
    mediaType: "image",
  };
}

function AdminBannersPage() {
  const [banners, setBanners] = useState(() => getAdminBanners());
  const [mediaUrls, setMediaUrls] = useState({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busyBanner, setBusyBanner] = useState("");
  const previewUrlsRef = useRef([]);
  const initialBannersRef = useRef(getAdminBanners());

  useEffect(() => () => previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const updateBanner = (id, changes) => {
    setBanners((current) => current.map((banner) => banner.id === id ? { ...banner, ...changes } : banner));
    setNotice("");
  };

  const addBanner = () => {
    setBanners((current) => [...current, makeNewBanner()]);
    setNotice("");
    setError("");
  };

  const removeBanner = (banner) => {
    setBanners((current) => current.filter((item) => item.id !== banner.id));
    setNotice("");
  };

  const moveBanner = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= banners.length) return;
    setBanners((current) => {
      const reordered = [...current];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered;
    });
    setNotice("");
  };

  const handleMedia = async (banner, file) => {
    if (!file) return;
    setBusyBanner(banner.id);
    setError("");
    try {
      let media;
      if (banner.mediaType === "video") {
        if (!file.type.startsWith("video/")) throw new Error("Choose an MP4, WebM, or Ogg video file.");
        if (file.size > 50 * 1024 * 1024) throw new Error("Choose a video smaller than 50 MB for this browser demo.");
        media = file;
      } else {
        media = await prepareBannerImage(file);
      }

      const mediaId = await storeAdminBannerMedia(media);
      const previewUrl = URL.createObjectURL(media);
      previewUrlsRef.current.push(previewUrl);
      setMediaUrls((current) => ({ ...current, [banner.id]: previewUrl }));
      updateBanner(banner.id, { image: "", mediaId, mediaType: banner.mediaType });
    } catch (mediaError) {
      setError(mediaError.message || "The selected media could not be prepared.");
    } finally {
      setBusyBanner("");
    }
  };

  const save = () => {
    setError("");
    if (banners.some((banner) => !banner.eyebrow.trim() || !banner.title.trim() || !banner.link.trim())) {
      setError("Complete the brand name, headline, and destination link for each banner.");
      return;
    }
    if (banners.some((banner) => banner.enabled && !banner.image && !banner.mediaId)) {
      setError("Add an image or video before showing a new banner on the storefront.");
      return;
    }
    if (!saveAdminBanners(banners)) {
      setError("The browser could not save these banners. Try a smaller image or video.");
      return;
    }
    const retainedMedia = new Set(banners.map((banner) => banner.mediaId).filter(Boolean));
    const unusedMedia = new Set(initialBannersRef.current.map((banner) => banner.mediaId).filter(Boolean));
    retainedMedia.forEach((id) => unusedMedia.delete(id));
    unusedMedia.forEach((id) => deleteAdminBannerMedia(id).catch(() => {}));
    initialBannersRef.current = banners;
    setNotice("Banner changes are saved. Open or refresh the storefront to see them.");
  };

  return (
    <div className="admin-banners-page">
      <Link className="admin-banners-back" to="/admin"><FiArrowLeft aria-hidden="true" /> Admin overview</Link>
      <header className="admin-banners-heading">
        <div>
          <p className="admin-eyebrow">Storefront content</p>
          <h1>Hero banners</h1>
          <p>Add campaign slides, edit their content, and choose an image or video.</p>
        </div>
        <div className="admin-banners-heading__actions">
          <button className="admin-banners-add" type="button" onClick={addBanner}><FiPlus aria-hidden="true" /> Add banner</button>
          <button className="admin-banners-save" type="button" onClick={save}><FiSave aria-hidden="true" /> Save changes</button>
        </div>
      </header>

      <p className="admin-banners-note">This is a browser-only preview. Images and videos stay in this browser; live editing across devices needs backend and media storage.</p>
      {notice && <p className="admin-banners-feedback" role="status">{notice}</p>}
      {error && <p className="admin-banners-error" role="alert">{error}</p>}

      <div className="admin-banners-list">
        {banners.map((banner, index) => {
          const mediaType = banner.mediaType || "image";
          const previewSrc = mediaUrls[banner.id] || banner.image;
          return (
            <article className={`admin-banner-card${banner.enabled ? "" : " is-disabled"}`} key={banner.id}>
              <div className="admin-banner-card__top">
                <div><span className="admin-banner-index">{String(index + 1).padStart(2, "0")}</span><div><h2>{banner.eyebrow || "Untitled banner"}</h2><p>{banner.enabled ? "Visible on the home page" : "Hidden from the home page"}</p></div></div>
                <div className="admin-banner-actions">
                  <button type="button" aria-label={`Move ${banner.eyebrow} up`} disabled={index === 0} onClick={() => moveBanner(index, -1)}><FiArrowUp aria-hidden="true" /></button>
                  <button type="button" aria-label={`Move ${banner.eyebrow} down`} disabled={index === banners.length - 1} onClick={() => moveBanner(index, 1)}><FiArrowDown aria-hidden="true" /></button>
                  <button className="admin-banner-toggle" type="button" onClick={() => updateBanner(banner.id, { enabled: !banner.enabled })}>{banner.enabled ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}{banner.enabled ? "Hide" : "Show"}</button>
                  {banner.id.startsWith("custom-") && <button className="admin-banner-delete" type="button" aria-label={`Delete ${banner.eyebrow}`} onClick={() => removeBanner(banner)}><FiTrash2 aria-hidden="true" /></button>}
                </div>
              </div>

              <div className="admin-banner-card__body">
                <div className="admin-banner-preview">
                  {previewSrc && mediaType === "video" ? <video src={previewSrc} muted controls playsInline preload="metadata" /> : previewSrc ? <img src={previewSrc} alt={banner.alt || "Banner preview"} /> : <div className="admin-banner-preview__empty">Choose an image or video to preview this banner</div>}
                  <span>{busyBanner === banner.id ? "Preparing media…" : `${mediaType === "video" ? "Video" : "Image"} preview`}</span>
                </div>
                <div className="admin-banner-fields">
                  <label><span>Brand line</span><input value={banner.eyebrow} maxLength={60} onChange={(event) => updateBanner(banner.id, { eyebrow: event.target.value })} /></label>
                  <label><span>Headline <small>Use a new line to split it</small></span><textarea rows="3" value={banner.title} maxLength={120} onChange={(event) => updateBanner(banner.id, { title: event.target.value })} /></label>
                  <label><span>Supporting text <small>Use a new line to split it</small></span><textarea rows="2" value={banner.description} maxLength={120} onChange={(event) => updateBanner(banner.id, { description: event.target.value })} /></label>
                  <div className="admin-banner-fields__row">
                    <label><span>Button label</span><input value={banner.buttonLabel} maxLength={30} onChange={(event) => updateBanner(banner.id, { buttonLabel: event.target.value })} /></label>
                    <label><span>Button destination</span><input value={banner.link} placeholder="/category/fragrances" onChange={(event) => updateBanner(banner.id, { link: event.target.value })} /></label>
                  </div>
                  <label><span>Media type</span><select value={mediaType} onChange={(event) => updateBanner(banner.id, { mediaType: event.target.value, mediaId: "", image: "" })}><option value="image">Image</option><option value="video">Video</option></select></label>
                  {mediaType === "image" && <label><span>Image description</span><input value={banner.alt || ""} maxLength={120} onChange={(event) => updateBanner(banner.id, { alt: event.target.value })} /></label>}
                  <label className="admin-banner-upload"><FiUpload aria-hidden="true" /><span>Choose {mediaType === "video" ? "a video" : "an image"}</span><input type="file" accept={mediaType === "video" ? "video/mp4,video/webm,video/ogg" : "image/*"} onChange={(event) => { handleMedia(banner, event.target.files?.[0]); event.target.value = ""; }} /></label>
                  <small className="admin-banner-hint">{mediaType === "video" ? "MP4, WebM, or Ogg · up to 50 MB. The storefront plays it muted and loops it while its slide is active." : "Images are compressed for this preview · choose an image up to 12 MB."}</small>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default AdminBannersPage;
