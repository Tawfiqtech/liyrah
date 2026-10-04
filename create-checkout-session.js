const PRICE_IDS = {
  "Sereen Abaya": "price_1UMLX4PI3wfDr96NkaAtFjBF",
  "Elara Abaya": "price_1UMLWYPI3wfDr96N1K6vj3jD",
  "Bamboo Hijab": "price_1UMLXEPI3wfDr96N4UjkEM7b"
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

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${process.env.URL || "https://liyrah.netlify.app"}/success.html?session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${process.env.URL || "https://liyrah.netlify.app"}/#shop`);
    params.set("billing_address_collection", "required");
    params.set("shipping_address_collection[allowed_countries][0]", "CA");
    params.set("shipping_address_collection[allowed_countries][1]", "US");
    params.set("phone_number_collection[enabled]", "true");
    params.set("metadata[brand]", "LIYRAH");

    const summary = [];
    cart.forEach((item, i) => {
      const price = PRICE_IDS[item.name];
      const qty = Math.max(1, Math.min(20, Number.parseInt(item.qty, 10) || 1));
      if (!price) throw new Error(`Unknown product: ${item.name}`);
      // Build the Checkout line item server-side so Stripe displays the selected
      // colour and abaya size directly in the Checkout/Payment summary.
      const isAbaya = item.name === "Sereen Abaya" || item.name === "Elara Abaya";
      const allowedSizes = new Set(["52", "54", "56", "58"]);
      const size = isAbaya && allowedSizes.has(String(item.size)) ? String(item.size) : null;
      const color = String(item.color || "Default").replace(/[<>]/g, "").slice(0, 50);
      const unitAmount = item.name === "Bamboo Hijab" ? 2000 : 7000;
      const variant = `${color}${size ? ` • Size ${size}` : ""}`;

      params.set(`line_items[${i}][price_data][currency]`, "cad");
      params.set(`line_items[${i}][price_data][unit_amount]`, String(unitAmount));
      params.set(`line_items[${i}][price_data][product_data][name]`, item.name);
      params.set(`line_items[${i}][price_data][product_data][description]`, variant);
      params.set(`line_items[${i}][quantity]`, String(qty));
      summary.push(`${item.name} (${variant}) x${qty}`);
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

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: err.message }) };
  }
};
