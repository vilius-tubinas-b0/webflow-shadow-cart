(function () {

  function buildShopifyCheckoutURL(items) {
    if (!items || !items.length) return null;

    // Must be full domain, set in Webflow Project Settings → Custom Code:
    // <script>window.SHOPIFY_STORE_DOMAIN = "k0shdq-mm.myshopify.com";</script>
    const domain = window.SHOPIFY_STORE_DOMAIN;
    if (!domain) {
      console.error("[ShadowCart] Missing SHOPIFY_STORE_DOMAIN. Example:");
      console.error(`window.SHOPIFY_STORE_DOMAIN = "your-store.myshopify.com"`);
      return null;
    }

    // Build line items: variantId:qty,variantId:qty
    const lineItems = items
      .map(i => `${i.id}:${i.quantity}`)
      .join(",");

    // ✅ Direct-to-checkout (no Shopify cart page)
    return `https://${domain}/cart/${lineItems}?checkout=1`;
  }

  // -----------------------------------------------------------
  // Checkout Entire Cart
  // -----------------------------------------------------------
  window.ShadowCartCheckout = function () {
    const items = ShadowCart.getItems();
    if (!items.length) {
      alert("Your cart is empty.");
      return;
    }
    const url = buildShopifyCheckoutURL(items);
    if (url) window.location.href = url;
  };

  // -----------------------------------------------------------
  // Buy Now (Single Item → Instant Checkout)
  // -----------------------------------------------------------
  window.ShadowCartBuyNow = function ({ id, name, price, quantity = 1, image = "", variant = "" }) {
    if (!id) return console.error("[ShadowCart] BuyNow requires variant ID (data-product-id).");
    const url = buildShopifyCheckoutURL([{ id, name, price, quantity, image, variant }]);
    if (url) window.location.href = url;
  };

  // -----------------------------------------------------------
  // Auto-bind Checkout Button:  <a data-checkout>
  // -----------------------------------------------------------
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-checkout]");
    if (!btn) return;
    e.preventDefault();
    window.ShadowCartCheckout();
  });

  // -----------------------------------------------------------
  // Auto-bind Buy Now Button:
  // <a data-buy-now data-product-id="123" data-product-price="29.99">
  // -----------------------------------------------------------
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-buy-now]");
    if (!btn) return;
    e.preventDefault();

    window.ShadowCartBuyNow({
      id: btn.dataset.productId,
      name: btn.dataset.productName || "",
      price: parseFloat(btn.dataset.productPrice || "0"),
      image: btn.dataset.productImage || "",
      variant: btn.dataset.variant || "",
      quantity: parseInt(btn.dataset.quantity || "1")
    });
  });

})();
