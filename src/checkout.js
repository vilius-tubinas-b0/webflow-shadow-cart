(function () {

  const debug = () =>
    (typeof window.SHADOWCART_DEBUG === "boolean") ? window.SHADOWCART_DEBUG : false;

  function log(...a){ if(debug()) console.log("%c[Checkout]","color:#00CFFF;font-weight:bold;",...a); }
  function err(...a){ if(debug()) console.error("%c[Checkout ERROR]","color:#FF3B3B;font-weight:bold;",...a); }

  async function createCheckout(items){
    const domain = window.SHOPIFY_STOREFRONT_DOMAIN;
    const token  = window.SHOPIFY_STOREFRONT_TOKEN;
    if(!domain || !token) return err("Missing Shopify credentials.");

    const lines = items.map(i=>({
      merchandiseId:`gid://shopify/ProductVariant/${i.id}`,
      quantity:i.quantity
    }));

    const query=`
      mutation CartCreate($lines:[CartLineInput!]!){
        cartCreate(input:{lines:$lines}){
          cart{ checkoutUrl }
          userErrors{ field message }
        }
      }
    `;

    let response;
    try{
      response = await fetch(`https://${domain}/api/2024-01/graphql.json`,{
        method:"POST",
        headers:{
          "X-Shopify-Storefront-Access-Token": token,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({query,variables:{lines}})
      }).then(r=>r.json());
    }catch(e){ return err("Network failure:",e); }

    log("Response:",response);

    const errors = response?.data?.cartCreate?.userErrors;
    if(errors?.length){
      err("Checkout Errors:", errors);
      return;
    }

    const url=response?.data?.cartCreate?.cart?.checkoutUrl;
    if(!url) return err("No checkout URL returned.");
    log("Redirect →",url);
    window.location.href=url;
  }

  window.ShadowCartCheckout = function(){
    const items = ShadowCart.getItems();
    if(!items.length) return alert("Your cart is empty.");
    ShadowCart._notify("checkout");
    createCheckout(items);
  };

  window.ShadowCartBuyNow = function({id,quantity=1}){
    ShadowCart._notify("checkout");
    createCheckout([{id,quantity}]);
  };

  document.addEventListener("click",e=>{
    const btn=e.target.closest("[data-checkout]");
    if(!btn) return;
    e.preventDefault();
    ShadowCartCheckout();
  });

  document.addEventListener("click",e=>{
    const btn=e.target.closest("[data-buy-now]");
    if(!btn) return;
    e.preventDefault();
    ShadowCartBuyNow({
      id:btn.dataset.productId,
      quantity:parseInt(btn.dataset.quantity||"1")
    });
  });

})();
