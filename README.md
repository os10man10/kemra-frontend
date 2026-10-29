# Kemra storefront

Kemra is a React and Vite storefront for the perfume, sneaker, and watch collections. This repository contains the frontend; account, order, payment, and inventory actions are not connected to a backend yet.

## Run locally

```sh
npm install
npm run dev
```

## Project checks

```sh
npm run lint
npm run build
```

## Product data

Product requests are centralized in `src/services/products.js`. By default, the demo uses DummyJSON. Copy `.env.example` to `.env.local` to set a different API base URL:

```env
VITE_API_BASE_URL=https://dummyjson.com
```

Changing the base URL alone will not make a different backend compatible; its product, category, search, and detail response shapes must match or be mapped in the service layer.

Cart, favorites, and ratings currently use browser `localStorage` for frontend demos. Checkout only previews the flow and does not create or save an order. The contact form opens an email app; it does not send a message directly from the site.
