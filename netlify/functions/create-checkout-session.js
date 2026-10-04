const PRODUCTS = {
  "Sereen Abaya": { unitAmount: 7000 },
  "Elara Abaya": { unitAmount: 7000 },
  "Bamboo Hijab": { unitAmount: 2000 }
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return { statusCode: 500, body: JSON.stringify({ error: "Stripe is not configured yet." }) };

  try {
    const { cart = [] } = JSON.parse(event.body || "{}");
    if (!Array.isArray(cart) || cart.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Your cart is empty." }) };
    }

    console.log("LIYRAH_CART_VARIANTS", JSON.stringify(cart.map(({name,color,size,qty}) => ({name,color,size,qty}))));

    const params = new URLSearchParams();
    params.set("mode", "payment");
    const siteUrl = process.env.URL || "https://liyrah.netlify.app";
    params.set("success_url", `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${siteUrl}/#shop`);
    params.set("billing_address_collection", "required");
    params.set("shipping_address_collection[allowed_countries][0]", "CA");
    params.set("shipping_address_collection[allowed_countries][1]", "US");
    params.set("phone_number_collection[enabled]", "true");
    params.set("metadata[brand]", "LIYRAH");

    const summary = [];
    cart.forEach((item, i) => {
      const product = PRODUCTS[item.name];
      if (!product) throw new Error(`Unknown product: ${item.name}`);

      const qty = Math.max(1, Math.min(20, Number.parseInt(item.qty, 10) || 1));
      const isAbaya = item.name === "Sereen Abaya" || item.name === "Elara Abaya";
      const allowedSizes = new Set(["52", "54", "56", "58"]);
      const size = isAbaya && allowedSizes.has(String(item.size)) ? String(item.size) : null;
      const color = String(item.color || "Default").replace(/[<>]/g, "").trim().slice(0, 50);
      const variantName = `${item.name} — ${color}${size ? ` — Size ${size}` : ""}`;

      params.set(`line_items[${i}][price_data][currency]`, "cad");
      params.set(`line_items[${i}][price_data][unit_amount]`, String(product.unitAmount));
      params.set(`line_items[${i}][price_data][product_data][name]`, variantName);
      params.set(`line_items[${i}][quantity]`, String(qty));
      summary.push(`${variantName} x${qty}`);
    });
    params.set("metadata[cart_details]", summary.join(" | ").slice(0, 500));

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    const session = await response.json();
    if (!response.ok || !session.url) throw new Error(session?.error?.message || "Unable to start checkout.");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    console.error("LIYRAH_CHECKOUT_ERROR", err.message);
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
