/* pixel.js — Webflow → Shopify Analytics Bridge */

(function () {

  window.Shopify = window.Shopify || {};
  Shopify.analytics = Shopify.analytics || {};
  Shopify.analytics.replayQueue = Shopify.analytics.replayQueue || [];

  window.analytics = {
    publish: (...args) => Shopify.analytics.replayQueue.push(["publish", ...args]),
    subscribe: (...args) => Shopify.analytics.replayQueue.push(["subscribe", ...args])
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://cdn.shopify.com/shopifycloud/web-pixels-manager/v1/latest/pixels.js";
  document.head.appendChild(script);

  window.Pixel = {
    pageview() {
      window.analytics?.publish("page_viewed");
    },
    cartUpdated(items) {
      window.analytics?.publish("custom_event", {
        name: "shadowcart_cart_updated",
        data: { items }
      });
    },
    checkoutStarted(items) {
      window.analytics?.publish("custom_event", {
        name: "shadowcart_checkout_started",
        data: { items }
      });
    }
  };

  // ✅ Auto-fire page view once pixel runtime loads
  document.addEventListener("DOMContentLoaded", () => {
    if (window.Pixel && typeof Pixel.pageview === "function") {
      Pixel.pageview();
    }
  });

})();
