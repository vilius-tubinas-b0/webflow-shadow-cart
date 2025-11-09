


/* pixel.js — Webflow → Shopify Analytics Bridge */

(function () {

  // Ensure Shopify Pixel runtime state exists
  window.Shopify = window.Shopify || {};
  Shopify.analytics = Shopify.analytics || {};
  Shopify.analytics.replayQueue = Shopify.analytics.replayQueue || [];

  // Queue-safe publish/subscribe helpers
  window.analytics = {
    publish: (...args) => Shopify.analytics.replayQueue.push(["publish", ...args]),
    subscribe: (...args) => Shopify.analytics.replayQueue.push(["subscribe", ...args])
  };

  // Load Shopify Pixel manager script
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://cdn.shopify.com/shopifycloud/web-pixels-manager/v1/latest/pixels.js";
  document.head.appendChild(script);

  // ---- Pixel Event Sender ----

  window.Pixel = {

    // Page View — required for sessions, geo, new/returning, live view
    pageview() {
      window.analytics?.publish("page_viewed");
    },

    // Cart Updated — called by ShadowCart when items change
    cartUpdated(items) {
      window.analytics?.publish("custom_event", {
        name: "shadowcart_cart_updated",
        data: { items }
      });
    },

    // Checkout Started — called right before redirect to Shopify checkout
    checkoutStarted(items) {
      window.analytics?.publish("custom_event", {
        name: "shadowcart_checkout_started",
        data: { items }
      });
    }

  };

})();