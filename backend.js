/* ============================================================
   VELOUR ESSENCE — BACKEND (backend.js)
   Powered by Supabase. Include this AFTER the Supabase CDN
   script and BEFORE your main app script in index.html:

   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="backend.js"></script>
   <script src="app.js"></script>   <-- your existing frontend file
   ============================================================ */

// 1. CONNECT TO YOUR SUPABASE PROJECT
// Get these two values from: Supabase Dashboard -> Project Settings -> API
const SUPABASE_URL = "https://rotuabapgrqinlvwtijf.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_h7jyjhto1Ah5UB8m8UI8vA_bGN2GLgu";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Keeps track of who is logged in, everywhere in the app
const Backend = {
  currentUser: null,

  // ---------------- AUTH ----------------

  async signUp(email, password, fullName) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    if (error) return { ok: false, message: error.message };
    Backend.currentUser = data.user;
    return { ok: true, user: data.user };
  },

  async signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: error.message };
    Backend.currentUser = data.user;
    return { ok: true, user: data.user };
  },

  async signOut() {
    await supabaseClient.auth.signOut();
    Backend.currentUser = null;
  },

  // Call this once when the page loads to restore a session
  // (e.g. user refreshed the page but was already logged in)
  async restoreSession() {
    const { data } = await supabaseClient.auth.getSession();
    Backend.currentUser = data.session ? data.session.user : null;
    return Backend.currentUser;
  },

  // ---------------- ORDERS / CHECKOUT ----------------

  // cartItems: the same array your frontend already keeps in state.cart
  // checkoutInfo: { name, address, city, paymentMethod, total }
  async placeOrder(cartItems, checkoutInfo) {
    const { data: order, error: orderErr } = await supabaseClient
      .from("orders")
      .insert({
        user_id: Backend.currentUser ? Backend.currentUser.id : null,
        full_name: checkoutInfo.name,
        address: checkoutInfo.address,
        city: checkoutInfo.city,
        payment_method: checkoutInfo.paymentMethod,
        total: checkoutInfo.total,
        status: "received"
      })
      .select()
      .single();

    if (orderErr) return { ok: false, message: orderErr.message };

    const itemsToInsert = cartItems.map(item => ({
      order_id: order.id,
      title: item.title,
      sub: item.sub,
      price: item.price,
      qty: item.qty
    }));

    const { error: itemsErr } = await supabaseClient.from("order_items").insert(itemsToInsert);
    if (itemsErr) return { ok: false, message: itemsErr.message };

    return { ok: true, orderId: order.id };
  },

  // ---------------- PAYMENT (SIMULATED) ----------------
  // NOTE: Real PayFast / PayPal / Apple Pay integration needs a verified
  // business account + a real server to hold secret keys, which isn't
  // realistic for tomorrow. This simulates the flow end-to-end (order
  // created -> "paid" -> lab status progresses) so the demo works fully,
  // and it's structured so a real gateway call could replace this one
  // function later without touching anything else.
  async simulatePayment(orderId) {
    await new Promise(resolve => setTimeout(resolve, 1200)); // pretend to contact the gateway

    const { error } = await supabaseClient
      .from("orders")
      .update({ status: "formulating" })
      .eq("id", orderId);

    if (error) return { ok: false, message: error.message };
    return { ok: true };
  },

  // Progress the lab tracker further (call this to simulate later stages,
  // e.g. with a setTimeout chain, for a live demo effect)
  async advanceOrderStatus(orderId, newStatus) {
    const { error } = await supabaseClient.from("orders").update({ status: newStatus }).eq("id", orderId);
    return error ? { ok: false, message: error.message } : { ok: true };
  },

  // ---------------- ORDER HISTORY ----------------

  async getMyOrders() {
    if (!Backend.currentUser) return { ok: false, message: "Not logged in" };
    const { data, error } = await supabaseClient
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", Backend.currentUser.id)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: error.message };
    return { ok: true, orders: data };
  },

  // ---------------- PRODUCTS ----------------

  async getProducts() {
    const { data, error } = await supabaseClient.from("products").select("*");
    if (error) return { ok: false, message: error.message };
    return { ok: true, products: data };
  }
};
