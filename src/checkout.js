(function () {

  async function createCheckout(items) {
    const domain = window.SHOPIFY_STOREFRONT_DOMAIN;
    const token = window.SHOPIFY_STOREFRONT_TOKEN;

    if (!domain || !token) {
      console.error("[ShadowCart] Missing SHOPIFY_STOREFRONT_DOMAIN or TOKEN");
      return;
    }

    const lineItems = items.map(i => ({
      variantId: "gid://shopify/ProductVariant/" + i.id, // Storefront API expects Global IDs
      quantity: i.quantity
    }));

    const query = `
      mutation CheckoutCreate($lineItems: [CheckoutLineItemInput!]!) {
        checkoutCreate(input: { lineItems: $lineItems }) {
          checkout {
            webUrl
          }
          checkoutUserErrors {
            message
          }
        }
      }
    `;

    const result = await fetch(`https://${domain}/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Storefront-Access-Token": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query, variables: { lineItems } })
    }).then(r => r.json());

    const url = result?.data?.checkoutCreate?.checkout?.webUrl;
    if (!url) {
      console.error("Checkout creation failed:", result);
      return;
    }

    window.location.href = url;
  }

  window.ShadowCartCheckout = function () {
    const items = ShadowCart.getItems();
    if (!items.length) {
      alert("Your cart is empty.");
      return;
    }
    createCheckout(items);
  };

  window.ShadowCartBuyNow = function ({ id, quantity = 1 }) {
    createCheckout([{ id, quantity }]);
  };

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-checkout]");
    if (btn) {
      e.preventDefault();
      ShadowCartCheckout();
    }
  });

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
