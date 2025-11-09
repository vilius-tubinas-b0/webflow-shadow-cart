/* pixel.js */
(function(){

  const log = (...a)=> window.SHADOWCART_DEBUG && console.log("%c[Pixel]","color:#00E5FF;font-weight:bold;",...a);

  window.Shopify = window.Shopify || {};
  Shopify.analytics = Shopify.analytics || {};
  Shopify.analytics.replayQueue = Shopify.analytics.replayQueue || [];

  window.analytics = {
    publish:(...a)=>Shopify.analytics.replayQueue.push(["publish",...a]),
    subscribe:(...a)=>Shopify.analytics.replayQueue.push(["subscribe",...a])
  };

  const s=document.createElement("script");
  s.async=true;
  s.src="https://cdn.shopify.com/shopifycloud/web-pixels-manager/v1/latest/pixels.js";
  document.head.appendChild(s);

  window.Pixel = {
    pageview(){
      log("pageview");
      analytics.publish("page_viewed");
    },
    cartUpdated(items){
      log("cartUpdated:",items);
      analytics.publish("custom_event",{name:"shadowcart_cart_updated",data:{items}});
    },
    checkoutStarted(items){
      log("checkoutStarted:",items);
      analytics.publish("custom_event",{name:"shadowcart_checkout_started",data:{items}});
    }
  };

  // Automatically send pageview
  Pixel.pageview();

})();
