import Product, { ProductSkeleton } from "./Product";
import { Swiper, SwiperSlide } from "swiper/react";
import "./SlideProduct.css";

import 'swiper/css';

import { Autoplay } from "swiper/modules";


function SlideProduct({data, title, description, id, loading = false, error = "", onRetry}) {
  const skeletonSlides = Array.from({ length: 8 }, (_, index) => index);

  return (
    <section className="slide_products slide" id={id} aria-label={`${title} products`}>
      <div className="container">
        <div className="top_slide">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {loading && (
          <span className="visually-hidden" role="status">
            Loading {title} products
          </span>
        )}
        {error ? (
          <div className="product-load-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={onRetry}>
              Try again
            </button>
          </div>
        ) : (
        <Swiper
          loop={true}
          autoplay={{
            delay: 4500,
            disableOnInteraction: false,
          }}
          slidesPerView={1.5}
          spaceBetween={12}
          aria-busy={loading}
          modules={[Autoplay]}
          className="mySwiper"
          breakpoints={{
            768: { slidesPerView: 3, spaceBetween: 18 },
            1200: { slidesPerView: 4, spaceBetween: 20 },
            1440: { slidesPerView: 5, spaceBetween: 20 },
          }}
        >

          {loading
            ? skeletonSlides.map((index) => (
                <SwiperSlide key={`product-skeleton-${index}`}>
                  <ProductSkeleton />
                </SwiperSlide>
              ))
            : data.map((item) => (
                <SwiperSlide key={item.id}>
                  <Product item={item} />
                </SwiperSlide>
              ))}

        </Swiper>
        )}
      </div>
    </section>
  );
}

export default SlideProduct;
