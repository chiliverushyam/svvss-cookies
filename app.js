const cart = {};
const $ = id => document.getElementById(id);
const money = n => "₹" + Number(n || 0).toFixed(0);

const fallbackProducts = window.SVVSS_PRODUCTS || [];

function discount(p) {
  return p.original_price && p.original_price > p.price
    ? Math.round((1 - p.price / p.original_price) * 100)
    : 0;
}

function addToCart(p) {
  if (!cart[p.id]) {
    cart[p.id] = {
      id: p.id,
      name: p.name,
      price: Number(p.price || 0),
      qty: 0,
      weight: p.weight,
      category: p.category
    };
  }

  cart[p.id].qty++;

  renderCart();
  openCart();
}

function changeQty(id, d) {
  if (!cart[id]) return;

  cart[id].qty += d;

  if (cart[id].qty <= 0) {
    delete cart[id];
  }

  renderCart();
}

function cartItems() {
  return Object.values(cart);
}

function total() {
  return cartItems().reduce(
    (a, x) => a + x.price * x.qty,
    0
  );
}


/* ================================
   DELHIVERY DELIVERY CALCULATION
================================ */

let deliveryCharge = null;

const DELHIVERY_API =
  "https://srivari-delhivery-api.chiluverushyam8790.workers.dev";

function cartWeightGrams() {
  return cartItems().reduce((sum, item) => {
    const match = String(item.weight || "").match(/[\d.]+/);
    const grams = match ? Number(match[0]) : 0;

    return sum + (
      Number.isFinite(grams)
        ? grams * item.qty
        : 0
    );
  }, 0);
}

async function calculateDeliveryCharge() {

  const pinEl = $("customerPincode");

  if (!pinEl) {
    alert("Pincode field not found.");
    return false;
  }

  const pin = pinEl.value.trim();

  if (!/^\d{6}$/.test(pin)) {
    alert("Please enter a valid 6-digit pincode.");
    return false;
  }

  const weight = cartWeightGrams();

  if (weight <= 0) {
    alert("Unable to calculate package weight.");
    return false;
  }

  const chargeEl = $("deliveryCharge");

  if (chargeEl) {
    chargeEl.textContent = "Calculating...";
  }

  try {

    const url =
      `${DELHIVERY_API}/?pincode=${encodeURIComponent(pin)}&weight=${Math.ceil(weight)}`;

    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Delivery charge calculation failed."
      );
    }

    deliveryCharge = Number(data.shippingCharge);

    if (!Number.isFinite(deliveryCharge)) {
      throw new Error(
        "Invalid delivery charge received."
      );
    }

    renderCart();

    return true;

  } catch (error) {

    console.error("Delhivery error:", error);

    deliveryCharge = null;

    if (chargeEl) {
      chargeEl.textContent = "Unavailable";
    }

    alert(
      "Delivery charge could not be calculated. Please check the pincode and try again."
    );

    return false;
  }
}

function grandTotal() {
  return total() + (deliveryCharge || 0);
}


/* ================================
   CART
================================ */

function renderCart() {

  const e = cartItems();

  const c = e.reduce(
    (a, x) => a + x.qty,
    0
  );

  if ($("cartCount")) {
    $("cartCount").textContent = c;
  }

  if ($("cartItems")) {

    $("cartItems").innerHTML = e.length

      ? e.map(x => `
        <div class="cartLine">

          <div>

            <b>${x.name}</b>

            <small>${x.weight || ""}</small>

            <div class="miniBtns">

              <button
                onclick="changeQty('${x.id}',-1)"
              >
                −
              </button>

              ${x.qty}

              <button
                onclick="changeQty('${x.id}',1)"
              >
                +
              </button>

            </div>

          </div>

          <b>
            ${money(x.price * x.qty)}
          </b>

        </div>
      `).join("")

      : "<p>Your cart is empty. Add some cookies first 🍪</p>";
  }

  if ($("cartTotal")) {
    $("cartTotal").textContent =
      money(total());
  }

  if ($("deliveryCharge")) {
    $("deliveryCharge").textContent =
      deliveryCharge === null
        ? "—"
        : money(deliveryCharge);
  }

  if ($("grandTotal")) {
    $("grandTotal").textContent =
      deliveryCharge === null
        ? money(total())
        : money(grandTotal());
  }
}


/* ================================
   CART OPEN / CLOSE
================================ */

function openCart() {

  if ($("cartOverlay")) {
    $("cartOverlay").classList.add("open");
  }

  renderCart();
}

function closeCart(e) {

  if (
    !e ||
    !$("cartOverlay") ||
    e.target === $("cartOverlay")
  ) {

    if ($("cartOverlay")) {
      $("cartOverlay").classList.remove("open");
    }
  }
}


/* ================================
   CHECKOUT VALIDATION
================================ */

function validateCheckout() {

  if (!cartItems().length) {

    alert(
      "Please add at least one cookie to your cart."
    );

    return false;
  }

  const n =
    $("customerName").value.trim();

  const ph =
    $("customerPhone").value.trim();

  const a =
    $("customerAddress").value.trim();

  const pin =
    $("customerPincode").value.trim();

  if (!n || !ph || !a || !pin) {

    alert(
      "Please fill name, mobile number, address and pincode."
    );

    return false;
  }

  if (
    !/^\d{10}$/.test(
      ph.replace(/\D/g, "")
    )
  ) {

    alert(
      "Please enter a valid 10-digit mobile number."
    );

    return false;
  }

  if (!/^\d{6}$/.test(pin)) {

    alert(
      "Please enter a valid 6-digit pincode."
    );

    return false;
  }

  return true;
}


/* ================================
   PAYMENT
================================ */

async function startPayment() {

  if (!validateCheckout()) {
    return;
  }

  const deliveryReady =
    await calculateDeliveryCharge();

  if (!deliveryReady) {
    return;
  }

  const order = {

    name:
      $("customerName").value.trim(),

    phone:
      $("customerPhone").value.trim(),

    address:
      $("customerAddress").value.trim(),

    pincode:
      $("customerPincode").value.trim(),

    items:
      cartItems(),

    subtotal:
      total(),

    deliveryCharge:
      deliveryCharge,

    total:
      grandTotal(),

    createdAt:
      new Date().toISOString()
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


/* ================================
   WHATSAPP ORDER
================================ */

async function sendOrderWhatsApp() {

  if (!validateCheckout()) {
    return;
  }

  const deliveryReady =
    await calculateDeliveryCharge();

  if (!deliveryReady) {
    return;
  }

  const order = {

    name:
      $("customerName").value.trim(),

    phone:
      $("customerPhone").value.trim(),

    address:
      $("customerAddress").value.trim(),

    pincode:
      $("customerPincode").value.trim(),

    items:
      cartItems(),

    subtotal:
      total(),

    deliveryCharge:
      deliveryCharge,

    total:
      grandTotal(),

    createdAt:
      new Date().toISOString()
  };

  localStorage.setItem(
    "svvss_pending_order",
    JSON.stringify(order)
  );

  const lines = order.items
    .map(x =>
      `• ${x.name} ${x.weight || ""} × ${x.qty} = ${money(x.price * x.qty)}`
    )
    .join("%0A");

  const text =
    `SVVSS Cookies Order%0A%0A` +

    `Name: ${encodeURIComponent(order.name)}%0A` +

    `Mobile: ${encodeURIComponent(order.phone)}%0A` +

    `Address: ${encodeURIComponent(order.address)}%0A` +

    `Pincode: ${encodeURIComponent(order.pincode)}%0A%0A` +

    `${lines}%0A%0A` +

    `Subtotal: ${encodeURIComponent(money(order.subtotal))}%0A` +

    `Delivery Charge: ${encodeURIComponent(money(order.deliveryCharge))}%0A` +

    `Grand Total: ${encodeURIComponent(money(order.total))}%0A%0A` +

    `Payment: UPI`;

  const number =
    (
      window.SVVSS_CONFIG &&
      window.SVVSS_CONFIG.WHATSAPP_NUMBER
    ) || "";

  if (!number) {

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


/* ================================
   PRODUCTS
================================ */

function renderProducts(items) {

  const b = $("products");

  if (!b) {
    return;
  }

  b.innerHTML = items.map(p => {

    const d = discount(p);

    const image =
      p.image || "assets/classic-chip.jpg";

    return `
      <article class="card">

        <div class="cardImg">

          <img
            src="${image}"
            alt="${p.name || "SVVSS Cookies"}"
            loading="lazy"
          >

          ${
            p.badge
              ? `<span class="sale">${p.badge}</span>`
              : d
                ? `<span class="sale">${d}% OFF</span>`
                : ""
          }

        </div>

        <h3>
          ${p.name || "Cookie"}
        </h3>

        <p class="category">

          ${p.weight || ""}

          ${
            p.weight && p.category
              ? " · "
              : ""
          }

          ${p.category || "Freshly baked"}

        </p>

        <p class="price">

          <b>
            ${money(p.price)}
          </b>

          ${
            p.original_price
              ? `<del>${money(p.original_price)}</del>`
              : ""
          }

        </p>

        <button
          class="add"
          onclick='addToCart(${JSON.stringify(p).replace(/'/g, "&#39;")})'
        >
          🛒 Add to Cart
        </button>

      </article>
    `;

  }).join("");
}


/* ================================
   START
================================ */

(async () => {

  const s = $("status");

  try {

    renderProducts(
      fallbackProducts
    );

    if (s) {
      s.textContent =
        `${fallbackProducts.length} fresh treats`;
    }

  } catch (e) {

    console.error(e);

    renderProducts(
      fallbackProducts
    );

    if (s) {
      s.textContent =
        `${fallbackProducts.length} fresh treats`;
    }
  }

})();

renderCart();
