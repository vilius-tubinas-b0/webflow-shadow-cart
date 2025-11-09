(function () {

  const debug = () => !!window.SHADOWCART_DEBUG;

  function log(...args) {
    if (debug()) console.log("[ShadowCart Checkout]", ...args);
  }

  function error(...args) {
    if (debug()) console.error("[ShadowCart Checkout ERROR]", ...args);
  }

  async function createCheckout(items) {
    const domain = window.SHOPIFY_STOREFRONT_DOMAIN;
    const token = window.SHOPIFY_STOREFRONT_TOKEN;

    if (!domain || !token) {
      error("Missing SHOPIFY_STOREFRONT_DOMAIN or SHOPIFY_STOREFRONT_TOKEN");
      return;
    }

 const lineItems = items.map(i => ({
   // i.id should already be the GID (gid://shopify/ProductVariant/…)
   merchandiseId: i.id,
   quantity: i.quantity
 }));

    log("Creating cart with:", lineItems);

    const query = `
      mutation CartCreate($lines: [CartLineInput!]!) {
        cartCreate(input: { lines: $lines }) {
          cart {
            checkoutUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    let result;

    try {
      result = await fetch(`https://${domain}/api/2024-01/graphql.json`, {
        method: "POST",
        headers: {
          "X-Shopify-Storefront-Access-Token": token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query,
          variables: { lines: lineItems }
        })
      }).then(r => r.json());
    } catch (err) {
      return error("Network error:", err);
    }

    log("Response:", result);

    const cart = result?.data?.cartCreate?.cart;
    const userErrors = result?.data?.cartCreate?.userErrors;

    if (userErrors && userErrors.length > 0) {
      console.group("[ShadowCart Checkout USER ERRORS]");
      userErrors.forEach((e, i) => console.log(`#${i + 1}`, e.message, e.field));
      console.groupEnd();
      return;
    }

    if (!cart?.checkoutUrl) {
      error("No checkout URL returned.");
      return;
    }

    log("Redirecting to:", cart.checkoutUrl);
    window.location.href = cart.checkoutUrl;
  }

  // Checkout whole cart
  window.ShadowCartCheckout = function () {
    const items = ShadowCart.getItems();
    if (!items.length) return alert("Your cart is empty.");
    createCheckout(items);
  };

  // Buy Now
  window.ShadowCartBuyNow = function ({ id, quantity = 1 }) {
    createCheckout([{ id, quantity }]);
  };

  // Auto-bind checkout button
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-checkout]");
    if (btn) {
      e.preventDefault();
      ShadowCartCheckout();
    }
  });

  // Auto-bind buy-now button
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-buy-now]");
    if (btn) {
      e.preventDefault();
      ShadowCartBuyNow({
        id: btn.dataset.productId,
        quantity: parseInt(btn.dataset.quantity || "1")
      });
    }
  });

})();
