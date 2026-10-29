import perfumeBanner from "../../img/banner_2.webp";
import footwearBanner from "../../img/banner_1.webp";
import watchesBanner from "../../img/banner_3.webp";

export const defaultHeroBanners = [
  {
    id: "perfumes",
    eyebrow: "KEMRA PERFUMES",
    title: "TIMELESS\nESSENCE",
    description: "FOUR FRAGRANCES\nONE LEGACY",
    buttonLabel: "Shop Now",
    link: "/category/fragrances",
    image: perfumeBanner,
    alt: "Kemra Perfumes collection",
    enabled: true,
  },
  {
    id: "sneakers",
    eyebrow: "KEMRA FOOTWEAR",
    title: "STEP\nINTO\nLEGACY",
    description: "MODERN STYLES\nANCIENT SOUL",
    buttonLabel: "Shop Now",
    link: "/category/mens-shoes",
    image: footwearBanner,
    alt: "Kemra footwear collection",
    enabled: true,
  },
  {
    id: "watches",
    eyebrow: "KEMRA WATCHES",
    title: "TIME\nBUILDS\nLEGACY",
    description: "MORE THAN A WATCH\nIT’S A STATEMENT",
    buttonLabel: "Shop Now",
    link: "/category/mens-watches",
    image: watchesBanner,
    alt: "Kemra watches collection",
    enabled: true,
  },
];
