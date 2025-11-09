(function () {

  async function shopifyCheckout(items) {
    const domain = window.SHOPIFY_STORE_DOMAIN;
    if (!domain) {
      console.error("[ShadowCart] Missing SHOPIFY_STORE_DOMAIN. Add to Webflow Head:");
      console.error(`<script>window.SHOPIFY_STORE_DOMAIN = "yourstore.myshopify.com";</script>`);
      return;
    }

    // 1) Clear Shopify cart
    try {
      await fetch(`https://${domain}/cart/clear.js`, {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.warn("[ShadowCart] cart clear failed (can be ignored on first run).", err);
    }

    // 2) Add each item to Shopify cart
    for (const item of items) {
      try {
        await fetch(`https://${domain}/cart/add.js`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.id,          // ✅ Shopify VARIANT ID
            quantity: item.quantity
          })
        });
      } catch (err) {
        console.error("[ShadowCart] Failed adding item:", item, err);
      }
    }

    // 3) Redirect to checkout (works universally)
    window.location.href = `https://${domain}/checkout`;
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
    shopifyCheckout(items);
  };

  // -----------------------------------------------------------
  // Buy Now (Single Item)
  // -----------------------------------------------------------
  window.ShadowCartBuyNow = function (opts) {
    const id = opts.id;
    if (!id) return console.error("[ShadowCartBuyNow] Missing product (variant) ID.");

    const quantity = parseInt(opts.quantity || 1);
    shopifyCheckout([{ id, quantity }]);
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
  // Auto-bind Buy Now: <a data-buy-now data-product-id="123">
  // -----------------------------------------------------------
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-buy-now]");
    if (!btn) return;
    e.preventDefault();
    window.ShadowCartBuyNow({
      id: btn.dataset.productId,
      quantity: parseInt(btn.dataset.quantity || "1")
    });
  });

})();
