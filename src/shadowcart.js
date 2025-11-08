/* shadowcart.umd.js (with debug logging) */
(function (global, factory) {
  typeof module === "object" && typeof module.exports === "object"
    ? module.exports = factory()
    : global.ShadowCart = factory();
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  // ---------- Config ----------
  const DEFAULTS = {
    storageKey: "shadow_cart",
    debug: false, // default off, can be overridden via window.ShadowCartConfig
    selectors: {
      addBtn: "[data-add-to-cart]",
      qtyInput: "[data-cart-qty]",
      count: "[data-cart-count]",
      subtotal: "[data-cart-subtotal]",
      cartList: "#cart-list",
      cartItemTemplate: "[data-cart-item-template]",
      itemName: "[data-cart-name]",
      itemVar: "[data-cart-variation]",
      itemQty: "[data-cart-quantity]",
      itemPrice: "[data-cart-price]",
      itemImg: "[data-cart-image]",
      itemRemove: "[data-cart-remove]"
    },
    currency: { decimals: 2, locale: undefined }
  };

  const userCfg = (globalThis && globalThis.ShadowCartConfig) || {};
  const cfg = merge({}, DEFAULTS, userCfg);

  // Logger (respects debug switch)
  function log(...args) {
    if (cfg.debug) console.log("%c[ShadowCart]", "color:#7D5FFF;font-weight:bold;", ...args);
  }

  // ---------- Utils ----------
  function merge(target, ...sources) {
    for (const src of sources) {
      if (!src) continue;
      for (const k of Object.keys(src)) {
        if (isPlain(src[k])) { target[k] = merge(target[k] || {}, src[k]); }
        else target[k] = src[k];
      }
    }
    return target;
  }
  function isPlain(x){ return x && typeof x === "object" && !Array.isArray(x); }
  function load(key){ try{ return JSON.parse(localStorage.getItem(key)) || []; } catch{ return []; } }
  function save(key, items){ localStorage.setItem(key, JSON.stringify(items)); }
  function money(val){ const n = Number(val||0); return isNaN(n) ? "0.00" : n.toLocaleString(cfg.currency.locale, { minimumFractionDigits: cfg.currency.decimals, maximumFractionDigits: cfg.currency.decimals }); }
  function keyFor(id, variant){ return `${String(id)}::${variant||""}`; }
  function closestQtyFor(btn){
    const card = btn.closest("[data-product-card]") || btn.parentElement;
    const inp = card ? card.querySelector(cfg.selectors.qtyInput) : null;
    const raw = (inp && (inp.value || inp.getAttribute("value"))) || btn.getAttribute("data-quantity");
    return Math.max(1, parseInt(raw||"1",10) || 1);
  }

  // ---------- Core ----------
  const ShadowCart = {
    _items: load(cfg.storageKey),
    _subs: [],
    _inited: false,

    init(options){
      if (options) merge(cfg, options);
      if (this._inited) return;
      this._inited = true;

      log("Init:", this._items);

      this._notify();
      this._render();

      const bind = () => { this._bindAddButtons(); this._render(); };
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bind, { once: true });
      } else bind();

      const mo = new MutationObserver(() => { this._bindAddButtons(); this._render(); });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    },

    subscribe(fn){
      this._subs.push(fn);
      try { fn(this.getItems()); } catch {}
      return () => { this._subs = this._subs.filter(f => f!==fn); };
    },

    getItems(){ return this._items.map(i => ({...i})); },
    getCount(){ return this._items.reduce((s,i)=>s+i.quantity,0); },
    getSubtotal(){ return this._items.reduce((s,i)=>s+i.price*i.quantity,0); },

    add({ id, name, price, quantity=1, image="", variant="" }){
      log("Add:", { id, name, price, quantity, image, variant });

      if (!id) return;
      const k = keyFor(id, variant);
      const found = this._items.find(i => keyFor(i.id,i.variant)===k);
      if (found) found.quantity += Number(quantity)||1;
      else this._items.push({ id, name, price:Number(price)||0, quantity:Number(quantity)||1, image, variant });

      save(cfg.storageKey, this._items);
      this._notify(); this._render();
    },

    setQuantity(id, variant, quantity){
      log("SetQuantity:", { id, variant, quantity });

      const q = Math.max(0, parseInt(quantity||0,10));
      const k = keyFor(id, variant);
      const it = this._items.find(i => keyFor(i.id,i.variant)===k);
      if (!it) return;
      if (q===0) this.remove(id, variant);
      else { it.quantity = q; save(cfg.storageKey, this._items); this._notify(); this._render(); }
    },

    remove(id, variant=""){
      log("Remove:", { id, variant });

      const k = keyFor(id, variant);
      this._items = this._items.filter(i => keyFor(i.id,i.variant)!==k);
      save(cfg.storageKey, this._items);
      this._notify(); this._render();
    },

    clear(){
      log("Clear Cart");
      this._items = [];
      save(cfg.storageKey, this._items);
      this._notify(); this._render();
    },

    // ---------- Internal ----------
    _notify(){
      log("Notify subscribers");
      for (const fn of this._subs) { try { fn(this.getItems()); } catch {} }
    },

    _bindAddButtons(){
      document.querySelectorAll(cfg.selectors.addBtn).forEach(btn => {
        if (btn._shadowBound) return;
        btn._shadowBound = true;
        log("Bind Add Button:", btn);

        btn.addEventListener("click", () => {
          const id = btn.dataset.productId || btn.getAttribute("data-product-id");
          const name = btn.dataset.productName || btn.getAttribute("data-product-name") || "";
          const price = parseFloat(btn.dataset.productPrice || btn.getAttribute("data-product-price") || "0");
          const image = btn.dataset.productImage || btn.getAttribute("data-product-image") || "";
          const variant = btn.dataset.variant || btn.getAttribute("data-variant") || "";
          const quantity = closestQtyFor(btn);
          this.add({ id, name, price, image, variant, quantity });

          const trigger = document.querySelector("[data-cart-trigger]");
          if (trigger) try { trigger.click(); } catch {}
        });
      });
    },

    _render(){
      log("Render UI");

      const count = this.getCount();
      document.querySelectorAll(cfg.selectors.count).forEach(el => { el.textContent = String(count); });

      const subtotal = this.getSubtotal();
      document.querySelectorAll(cfg.selectors.subtotal).forEach(el => { el.textContent = money(subtotal); });

      const list = document.querySelector(cfg.selectors.cartList);
      if (!list) return;

      const tpl = list.querySelector(cfg.selectors.cartItemTemplate);
      if (!tpl) return;

      list.querySelectorAll("[data-cart-item-rendered]").forEach(el => el.remove());

      const emptyEl = list.querySelector("[data-cart-empty]") || document.querySelector("[data-cart-empty]");
      if (emptyEl) emptyEl.style.display = this._items.length ? "none" : "";

      let running = 0;
      for (const item of this._items) {
        const node = tpl.cloneNode(true);
        node.removeAttribute("data-cart-item-template");
        node.setAttribute("data-cart-item-rendered", "");
        node.style.display = "";

        const n = node.querySelector(cfg.selectors.itemName);  if (n) n.textContent = item.name || "";
        const v = node.querySelector(cfg.selectors.itemVar);   if (v) { v.textContent = item.variant || ""; v.style.display = item.variant ? "" : "none"; }
        const q = node.querySelector(cfg.selectors.itemQty);   if (q) q.textContent = String(item.quantity);
        const p = node.querySelector(cfg.selectors.itemPrice); if (p) p.textContent = money(item.price * item.quantity);
        const im = node.querySelector(cfg.selectors.itemImg);  if (im && item.image) im.src = item.image;

        const rem = node.querySelector(cfg.selectors.itemRemove);
        if (rem) rem.addEventListener("click", () => this.remove(item.id, item.variant||""));

        const plus = node.querySelector("[data-cart-qty-plus]");
        const minus = node.querySelector("[data-cart-qty-minus]");
        if (plus) plus.addEventListener("click", () => this.setQuantity(item.id, item.variant||"", item.quantity + 1));
        if (minus) minus.addEventListener("click", () => this.setQuantity(item.id, item.variant||"", item.quantity - 1));

        list.appendChild(node);
        running += item.price * item.quantity;
      }

      document.querySelectorAll(cfg.selectors.subtotal).forEach(el => { el.textContent = money(running); });
    }
  };

  ShadowCart.init();
  return ShadowCart;
});
