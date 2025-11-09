(function () {
  function buildShopifyCheckoutURL(items) {
    if (!items || !items.length) return null;
    const domain = window.SHOPIFY_STORE_DOMAIN;
    if (!domain) {
      console.error("[ShadowCart] Missing SHOPIFY_STORE_DOMAIN");
      return null;
    }

    const lineItems = items
      .map(i => `${i.id}:${i.quantity}`)
      .join(",");

    return `${domain}/cart/${lineItems}`;
  }

  // Normal checkout (entire ShadowCart)
  window.ShadowCartCheckout = function () {
    const items = ShadowCart.getItems();
    if (!items.length) {
      alert("Your cart is empty.");
      return;
    }
    window.location.href = buildShopifyCheckoutURL(items);
  };

  // Buy Now (single item)
  window.ShadowCartBuyNow = function ({ id, name, price, quantity = 1, image = "", variant = "" }) {
    if (!id) return console.error("BuyNow requires product ID (Shopify variant ID).");
    const url = buildShopifyCheckoutURL([{ id, name, price, quantity, image, variant }]);
    window.location.href = url;
  };

  // Bind checkout button automatically
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-checkout]");
    if (!btn) return;
    e.preventDefault();
    window.ShadowCartCheckout();
  });

  // Bind buy-now automatically
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-buy-now]");
    if (!btn) return;
    e.preventDefault();
    const id = btn.dataset.productId;
    const name = btn.dataset.productName || "";
    const price = parseFloat(btn.dataset.productPrice || "0");
    const image = btn.dataset.productImage || "";
    const variant = btn.dataset.variant || "";
    const quantity = parseInt(btn.dataset.quantity || "1");
    window.ShadowCartBuyNow({ id, name, price, quantity, image, variant });
  });

})();
