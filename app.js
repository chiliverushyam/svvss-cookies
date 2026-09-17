const cart={};
const $=id=>document.getElementById(id);
const money=n=>"₹"+Number(n||0).toFixed(0);
const fallbackProducts=window.SVVSS_PRODUCTS||[];

function discount(p){
  return p.original_price&&p.original_price>p.price
    ?Math.round((1-p.price/p.original_price)*100)
    :0;
}

function addToCart(p){
  if(!cart[p.id]){
    cart[p.id]={
      id:p.id,
      name:p.name,
      price:Number(p.price||0),
      qty:0,
      weight:p.weight,
      category:p.category
    };
  }

  cart[p.id].qty++;
  renderCart();
  openCart();
}

function changeQty(id,d){
  if(!cart[id])return;

  cart[id].qty+=d;

  if(cart[id].qty<=0){
    delete cart[id];
  }

  renderCart();
}

function cartItems(){
  return Object.values(cart);
}

function total(){
  return cartItems().reduce((a,x)=>a+x.price*x.qty,0);
}

function renderCart(){
  const e=cartItems();
  const c=e.reduce((a,x)=>a+x.qty,0);

  $("cartCount").textContent=c;

  $("cartItems").innerHTML=e.length
    ?e.map(x=>`
      <div class="cartLine">
        <div>
          <b>${x.name}</b>
          <small>${x.weight||""}</small>

          <div class="miniBtns">
            <button onclick="changeQty('${x.id}',-1)">−</button>
            ${x.qty}
            <button onclick="changeQty('${x.id}',1)">+</button>
          </div>
        </div>

        <b>${money(x.price*x.qty)}</b>
      </div>
    `).join("")
    :"<p>Your cart is empty. Add some cookies first 🍪</p>";

  $("cartTotal").textContent=money(total());
}

function openCart(){
  $("cartOverlay").classList.add("open");
  renderCart();
}

function closeCart(e){
  if(!e||e.target===$("cartOverlay")){
    $("cartOverlay").classList.remove("open");
  }
}

function validateCheckout(){
  if(!cartItems().length){
    alert("Please add at least one cookie to your cart.");
    return false;
  }

  const n=$("customerName").value.trim();
  const ph=$("customerPhone").value.trim();
  const a=$("customerAddress").value.trim();
  const pin=$("customerPincode").value.trim();

  if(!n||!ph||!a||!pin){
    alert("Please fill name, mobile number, address and pincode.");
    return false;
  }

  if(!/^\d{10}$/.test(ph.replace(/\D/g,""))){
    alert("Please enter a valid 10-digit mobile number.");
    return false;
  }

  if(!/^\d{6}$/.test(pin)){
    alert("Please enter a valid 6-digit pincode.");
    return false;
  }

  return true;
}

function startPayment(){
  if(!validateCheckout())return;

  const order={
    name:$("customerName").value.trim(),
    phone:$("customerPhone").value.trim(),
    address:$("customerAddress").value.trim(),
    pincode:$("customerPincode").value.trim(),
    items:cartItems(),
    total:total(),
    createdAt:new Date().toISOString()
  };

  localStorage.setItem(
    "svvss_pending_order",
    JSON.stringify(order)
  );

  window.open(
    "https://razorpay.me/@shyamchiliveru",
    "_blank",
    "noopener"
  );
}

function sendOrderWhatsApp(){
  if(!validateCheckout())return;

  const order={
    name:$("customerName").value.trim(),
    phone:$("customerPhone").value.trim(),
    address:$("customerAddress").value.trim(),
    pincode:$("customerPincode").value.trim(),
    items:cartItems(),
    total:total(),
    createdAt:new Date().toISOString()
  };

  localStorage.setItem(
    "svvss_pending_order",
    JSON.stringify(order)
  );

  const lines=order.items
    .map(x=>
      `• ${x.name} ${x.weight||""} × ${x.qty} = ${money(x.price*x.qty)}`
    )
    .join("%0A");

  const text=
    `SVVSS Cookies Order%0A%0A`+
    `Name: ${encodeURIComponent(order.name)}%0A`+
    `Mobile: ${encodeURIComponent(order.phone)}%0A`+
    `Address: ${encodeURIComponent(order.address)}%0A`+
    `Pincode: ${encodeURIComponent(order.pincode)}%0A%0A`+
    `${lines}%0A%0A`+
    `Total: ${encodeURIComponent(money(order.total))}%0A%0A`+
    `Payment: Please verify in Razorpay.`;

  const number=
    (window.SVVSS_CONFIG&&window.SVVSS_CONFIG.WHATSAPP_NUMBER)||"";

  if(!number){
    alert(
      "WhatsApp number is not configured yet. Add WHATSAPP_NUMBER in config.js."
    );
    return;
  }

  window.open(
    `https://wa.me/${number}?text=${text}`,
    "_blank",
    "noopener"
  );
}

function renderProducts(items){
  const b=$("products");

  b.innerHTML=items.map(p=>{
    const d=discount(p);
    const image=p.image||"assets/classic-chip.jpg";

    return `
      <article class="card">

        <div class="cardImg">
          <img
            src="${image}"
            alt="${p.name||"SVVSS Cookies"}"
            loading="lazy"
          >

          ${
            p.badge
              ?`<span class="sale">${p.badge}</span>`
              :d
                ?`<span class="sale">${d}% OFF</span>`
                :""
          }
        </div>

        <h3>${p.name||"Cookie"}</h3>

        <p class="category">
          ${p.weight||""}
          ${p.weight&&p.category?" · ":""}
          ${p.category||"Freshly baked"}
        </p>

        <p class="price">
          <b>${money(p.price)}</b>
          ${
            p.original_price
              ?`<del>${money(p.original_price)}</del>`
              :""
          }
        </p>

        <button
          class="add"
          onclick='addToCart(${JSON.stringify(p).replace(/'/g,"&#39;")})'
        >
          🛒 Add to Cart
        </button>

      </article>
    `;
  }).join("");
}

/*
  IMPORTANT:
  The storefront now uses products.js directly.
  Old products from Supabase will NOT replace these products.
*/

(async()=>{
  const s=$("status");

  try{
    renderProducts(fallbackProducts);
    s.textContent=`${fallbackProducts.length} fresh treats`;
  }catch(e){
    console.error(e);
    renderProducts(fallbackProducts);
    s.textContent=`${fallbackProducts.length} fresh treats`;
  }
})();

renderCart();
