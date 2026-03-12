// ═══════════════════════════════════════════
// BLESSING HOGAR — CART SYSTEM
// Incluir este script en todas las páginas
// ═══════════════════════════════════════════

const BlessingCart = (() => {
  let items = JSON.parse(localStorage.getItem('blessing_cart') || '[]');

  function save() { localStorage.setItem('blessing_cart', JSON.stringify(items)); render(); updateBadge(); }

  function add(product) {
    const key = `${product.id}_${product.medida}_${product.color}`;
    const existing = items.find(i => i.key === key);
    if (existing) { existing.qty++; }
    else { items.push({ ...product, key, qty: 1 }); }
    save(); openCart();
    showToast(`${product.name} agregado al carrito`);
    if (window.fbq) fbq('track','AddToCart',{content_name:product.name,currency:'ARS',value:product.price});
  }

  function remove(key) { items = items.filter(i => i.key !== key); save(); }

  function updateQty(key, delta) {
    const item = items.find(i => i.key === key);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) remove(key); else save();
  }

  function total() { return items.reduce((s, i) => s + i.price * i.qty, 0); }
  function count() { return items.reduce((s, i) => s + i.qty, 0); }
  function clear() { items = []; save(); }
  function getItems() { return items; }
  function fmt(n) { return '$' + Math.round(n).toLocaleString('es-AR'); }

  function updateBadge() {
    document.querySelectorAll('.cart-dot, .cart-badge, #cartCountBadge').forEach(el => {
      const c = count(); el.textContent = c;
      el.style.display = c === 0 ? 'none' : 'flex';
    });
  }

  function openCart() { document.getElementById('cartOverlay')?.classList.add('open'); }
  function closeCart() { document.getElementById('cartOverlay')?.classList.remove('open'); }

  function showToast(msg) {
    const t = document.getElementById('blessing-toast');
    if (!t) return;
    t.querySelector('.toast-msg').textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 3000);
  }

  function render() {
    const list = document.getElementById('cartItems');
    const emptyEl = document.getElementById('cartEmpty');
    const footerEl = document.getElementById('cartFooter');
    if (!list) return;

    if (items.length === 0) {
      list.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'flex';
      if (footerEl) footerEl.style.display = 'none';
      updateBadge(); return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (footerEl) footerEl.style.display = 'flex';

    list.innerHTML = items.map(item => `
      <div class="cart-item" data-key="${item.key}">
        <div class="ci-img">${item.emoji || '🛏️'}</div>
        <div class="ci-info">
          <div class="ci-name">${item.name}</div>
          <div class="ci-var">${item.medida} · ${item.color}</div>
          <div class="ci-price">${fmt(item.price * item.qty)}</div>
        </div>
        <div class="ci-actions">
          <button class="ci-qty-btn" onclick="BlessingCart.updateQty('${item.key}',-1)">−</button>
          <span class="ci-qty">${item.qty}</span>
          <button class="ci-qty-btn" onclick="BlessingCart.updateQty('${item.key}',1)">+</button>
          <button class="ci-remove" onclick="BlessingCart.remove('${item.key}')" title="Eliminar">🗑</button>
        </div>
      </div>
    `).join('');

    const t = total();
    const setEl = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = v; };
    setEl('cartTotal', fmt(t));
    setEl('cartCuota', fmt(t/12) + '/mes');
    setEl('cartTransf', fmt(t * 0.7));
  }

  function inject() {
    if (document.getElementById('cartOverlay')) { render(); updateBadge(); return; }

    const style = document.createElement('style');
    style.textContent = `
      .cart-overlay{display:none;position:fixed;inset:0;z-index:900;}
      .cart-overlay.open{display:flex;}
      .cart-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);cursor:pointer;}
      .cart-drawer{position:absolute;top:0;right:0;bottom:0;width:min(440px,100vw);background:#F7F5F2;display:flex;flex-direction:column;animation:slideInCart .3s cubic-bezier(.25,.46,.45,.94);overflow:hidden;box-shadow:-20px 0 60px rgba(0,0,0,.2);}
      @keyframes slideInCart{from{transform:translateX(100%)}to{transform:translateX(0)}}
      .cart-head{display:flex;align-items:center;justify-content:space-between;padding:22px 24px 18px;border-bottom:1px solid rgba(0,0,0,.08);background:#F7F5F2;flex-shrink:0;}
      .cart-head h3{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:#141414;display:flex;align-items:center;gap:10px;}
      .cart-count-badge{background:#E8621A;color:#fff;font-family:'Outfit',sans-serif;font-size:11px;font-weight:700;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
      .cart-close{width:36px;height:36px;border-radius:9px;background:rgba(0,0,0,.06);border:none;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:background .18s;}
      .cart-close:hover{background:rgba(0,0,0,.14);}
      .cart-items{flex:1;overflow-y:auto;padding:12px 24px;scrollbar-width:thin;}
      .cart-empty{flex:1;display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#909090;text-align:center;padding:40px;}
      .cart-empty .ce-icon{font-size:52px;opacity:.35;}
      .cart-empty p{font-size:14px;line-height:1.65;}
      .cart-empty a{margin-top:8px;background:#141414;color:#fff;font-family:'Outfit',sans-serif;font-size:13.5px;font-weight:500;padding:12px 24px;border-radius:10px;text-decoration:none;}
      .cart-item{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid rgba(0,0,0,.06);animation:fadeItem .25s ease;}
      @keyframes fadeItem{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      .ci-img{width:64px;height:64px;border-radius:10px;background:#EFECE8;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;}
      .ci-info{flex:1;min-width:0;}
      .ci-name{font-size:13.5px;font-weight:500;color:#141414;line-height:1.35;margin-bottom:3px;}
      .ci-var{font-size:11.5px;color:#909090;margin-bottom:6px;}
      .ci-price{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;color:#141414;}
      .ci-actions{display:flex;flex-direction:column;align-items:center;gap:5px;flex-shrink:0;}
      .ci-qty-btn{width:28px;height:28px;border-radius:7px;background:#fff;border:1.5px solid rgba(0,0,0,.12);cursor:pointer;font-size:16px;font-weight:500;display:flex;align-items:center;justify-content:center;transition:all .15s;color:#141414;font-family:'Outfit',sans-serif;line-height:1;}
      .ci-qty-btn:hover{border-color:#141414;background:#141414;color:#fff;}
      .ci-qty{font-size:14px;font-weight:600;color:#141414;min-width:20px;text-align:center;}
      .ci-remove{background:none;border:none;cursor:pointer;font-size:14px;opacity:.35;transition:opacity .15s;padding:2px;}
      .ci-remove:hover{opacity:.75;}
      .cart-footer{display:flex;flex-direction:column;border-top:1px solid rgba(0,0,0,.08);background:#fff;flex-shrink:0;padding:18px 24px 24px;}
      .cs-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:13.5px;}
      .cs-row .label{color:#555;}
      .cs-row .val{font-weight:500;color:#141414;}
      .cs-naranja{background:linear-gradient(135deg,#FEF3ED,#FDE8DA);border:1.5px solid #F0C0A8;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:12px;margin:10px 0;}
      .cs-naranja-badge{background:#E8621A;color:#fff;font-size:9px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;padding:4px 7px;border-radius:5px;flex-shrink:0;line-height:1.3;text-align:center;}
      .cs-naranja-num{font-size:17px;font-weight:700;color:#E8621A;line-height:1;}
      .cs-naranja-desc{font-size:11px;color:#C8724A;margin-top:2px;}
      .cs-transf{background:#E6F4EE;border-radius:8px;padding:9px 12px;font-size:12.5px;color:#2E7D5B;font-weight:500;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
      .cs-transf strong{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;}
      .cs-total-row{display:flex;justify-content:space-between;align-items:baseline;padding:12px 0 14px;border-top:1.5px solid rgba(0,0,0,.08);margin-top:4px;}
      .cs-total-label{font-size:15px;font-weight:600;color:#141414;}
      .cs-total-val{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:600;color:#141414;}
      .btn-checkout{background:#141414;color:#fff;font-family:'Outfit',sans-serif;font-size:15px;font-weight:600;border:none;border-radius:12px;padding:16px;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:10px;text-decoration:none;transition:background .2s,transform .18s;letter-spacing:.1px;}
      .btn-checkout:hover{background:#333;transform:translateY(-1px);}
      .btn-continue{background:none;border:none;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;color:#909090;margin-top:10px;width:100%;text-align:center;text-decoration:underline;transition:color .18s;}
      .btn-continue:hover{color:#141414;}
      #blessing-toast{position:fixed;bottom:90px;right:24px;z-index:9999;background:#141414;color:#fff;font-family:'Outfit',sans-serif;font-size:13.5px;font-weight:500;padding:13px 18px;border-radius:12px;display:flex;align-items:center;gap:9px;box-shadow:0 8px 28px rgba(0,0,0,.25);transform:translateY(20px);opacity:0;transition:all .3s cubic-bezier(.25,.46,.45,.94);pointer-events:none;max-width:320px;}
      #blessing-toast.show{transform:translateY(0);opacity:1;}
    `;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('beforeend', `
      <div class="cart-overlay" id="cartOverlay">
        <div class="cart-backdrop" onclick="BlessingCart.closeCart()"></div>
        <div class="cart-drawer">
          <div class="cart-head">
            <h3>Tu carrito <span class="cart-count-badge" id="cartCountBadge">0</span></h3>
            <button class="cart-close" onclick="BlessingCart.closeCart()">✕</button>
          </div>
          <div class="cart-empty" id="cartEmpty">
            <div class="ce-icon">🛒</div>
            <p>Tu carrito está vacío.<br>¡Encontrá tu sommier ideal!</p>
            <a href="index.html" onclick="BlessingCart.closeCart()">Ver productos</a>
          </div>
          <div class="cart-items" id="cartItems"></div>
          <div class="cart-footer" id="cartFooter" style="display:none">
            <div class="cs-row"><span class="label">Subtotal</span><span class="val" id="cartTotal">$0</span></div>
            <div class="cs-row"><span class="label">Envío</span><span class="val" style="color:#2E7D5B;font-weight:600;">Gratis 🚚</span></div>
            <div class="cs-naranja">
              <div class="cs-naranja-badge">NARANJA<br>12x</div>
              <div>
                <div class="cs-naranja-num" id="cartCuota">$0/mes</div>
                <div class="cs-naranja-desc">sin interés con Tarjeta Naranja</div>
              </div>
            </div>
            <div class="cs-transf">
              <span>💸 Con transferencia (30% off)</span>
              <strong id="cartTransf">$0</strong>
            </div>
            <div class="cs-total-row">
              <span class="cs-total-label">Total</span>
              <span class="cs-total-val" id="cartTotalFull">$0</span>
            </div>
            <a href="checkout.html" class="btn-checkout">Ir al checkout &rarr;</a>
            <button class="btn-continue" onclick="BlessingCart.closeCart()">Seguir comprando</button>
          </div>
        </div>
      </div>
      <div id="blessing-toast"><span>✅</span><span class="toast-msg"></span></div>
    `);
    render(); updateBadge();
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', inject); }
  else { inject(); }

  return { add, remove, updateQty, total, count, clear, getItems, fmt, openCart, closeCart, showToast, render };
})();
