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
      error("Missing SHOPIFY_STOREFRONT_DOMAIN or SHOPIFY_STOREFRONT_TOKEN.");
      return;
    }

    const lineItems = items.map(i => ({
      variantId: "gid://shopify/ProductVariant/" + i.id,
      quantity: i.quantity
    }));

    log("Creating checkout with:", lineItems);

    const query = `
      mutation CheckoutCreate($lineItems: [CheckoutLineItemInput!]!) {
        checkoutCreate(input: { lineItems: $lineItems }) {
          checkout {
            webUrl
          }
          checkoutUserErrors {
            message
            field
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
        body: JSON.stringify({ query, variables: { lineItems } })
      }).then(r => r.json());
    } catch (err) {
      error("Network failure while calling storefront API:", err);
      return;
    }

    log("Response:", result);

    const checkoutData = result?.data?.checkoutCreate;
    const checkoutUrl = checkoutData?.checkout?.webUrl;

    if (!checkoutUrl) {
      error("Checkout creation failed:");
      error("Full GraphQL Response:", result);
      error("Checkout User Errors:", checkoutData?.checkoutUserErrors || result?.errors);
      return;
    }

    log("Redirecting to:", checkoutUrl);
    window.location.href = checkoutUrl;
  }

  // ---------------------------------------------------------------------
  // Checkout Entire Cart
  // ---------------------------------------------------------------------
  window.ShadowCartCheckout = function () {
    const items = ShadowCart.getItems();
    if (!items.length) {
      alert("Your cart is empty.");
      return;
    }
    createCheckout(items);
  };

  // ---------------------------------------------------------------------
  // Buy Now (Single Item)
  // ---------------------------------------------------------------------
  window.ShadowCartBuyNow = function ({ id, quantity = 1 }) {
    if (!id) return error("Buy Now missing variant ID");
    createCheckout([{ id, quantity }]);
  };

  // ---------------------------------------------------------------------
  // Button Auto-Bind
  // ---------------------------------------------------------------------
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
