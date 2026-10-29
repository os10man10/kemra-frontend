import { useCallback, useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper/modules";
import { Link } from "react-router-dom";
import { getAdminBannerMediaUrl, getAdminBanners } from "../pages/Admin/adminBanners";

function HeroSlider() {
  const [banners, setBanners] = useState(() => getAdminBanners().filter((banner) => banner.enabled));
  const [activeBannerId, setActiveBannerId] = useState(null);
  const videoRefs = useRef(new Map());
  const initialBannersRef = useRef(banners);

  useEffect(() => {
    let cancelled = false;
    const objectUrls = [];

    Promise.all(initialBannersRef.current.map(async (banner) => {
      if (!banner.mediaId) return banner;
      try {
        const mediaUrl = await getAdminBannerMediaUrl(banner.mediaId);
        if (mediaUrl) objectUrls.push(mediaUrl);
        return mediaUrl ? { ...banner, mediaUrl } : banner;
      } catch {
        return banner;
      }
    })).then((resolvedBanners) => {
      if (!cancelled) setBanners(resolvedBanners);
      else objectUrls.forEach((url) => URL.revokeObjectURL(url));
    });

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((video, bannerId) => {
      if (!video) return;
      if (bannerId === activeBannerId) video.play().catch(() => {});
      else video.pause();
    });
  }, [activeBannerId, banners]);

  const activateSlide = useCallback((swiper) => {
    setActiveBannerId(banners[swiper.realIndex]?.id || null);
  }, [banners]);

  if (banners.length === 0) return null;

  return (
    <div className="hero">
      <div className="container">
        <Swiper
          loop={banners.length > 1}
          autoplay={banners.length > 1 ? { delay: 5000, disableOnInteraction: false } : false}
          pagination={banners.length > 1}
          modules={[Pagination, Autoplay]}
          onSwiper={activateSlide}
          onSlideChange={activateSlide}
          className="mySwiper"
        >
          {banners.map((banner, index) => {
            const src = banner.mediaUrl || banner.image;
            const isActive = activeBannerId === banner.id;
            return (
              <SwiperSlide key={banner.id}>
                <div className="content">
                  <h4>{banner.eyebrow}</h4>
                  <h3>{String(banner.title || "").split("\n").map((line, lineIndex) => (
                    <span key={`${banner.id}-title-${lineIndex}`}>{line}<br /></span>
                  ))}</h3>
                  <p>{String(banner.description || "").split("\n").map((line, lineIndex, lines) => (
                    <span key={`${banner.id}-description-${lineIndex}`}>{line}{lineIndex < lines.length - 1 && <br />}</span>
                  ))}</p>
                  <Link to={banner.link || "/"} className="btn">{banner.buttonLabel || "Shop Now"}</Link>
                </div>
                {banner.mediaType === "video" && src ? (
                  <video
                    ref={(element) => {
                      if (element) videoRefs.current.set(banner.id, element);
                      else videoRefs.current.delete(banner.id);
                    }}
                    src={src}
                    muted
                    loop
                    playsInline
                    preload={isActive ? "auto" : "none"}
                    aria-label={banner.eyebrow || "Kemra campaign video"}
                  />
                ) : src ? (
                  <img
                    src={src}
                    alt={banner.alt || banner.eyebrow || "Kemra collection"}
                    fetchPriority={index === 0 ? "high" : undefined}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                ) : null}
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </div>
  );
}

export default HeroSlider;
