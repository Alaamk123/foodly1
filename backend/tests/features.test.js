//اختبارات تكامل يتاكد انو اجزاء backend تعمل مع بعضها بشكل صحيح وapi يطبق قواعد الامان والتحقق من البيانات 
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-not-for-production";

const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const uri = process.env.MONGO_URI_TEST;
if (!uri || !/test/i.test(uri.split("/").pop().split("?")[0])) {
  console.error('Set MONGO_URI_TEST to a database whose NAME contains "test", e.g. mongodb://127.0.0.1:27017/foodly_test');
  process.exit(1);
}

const app = require("../server");
const Recipe = require("../models/Recipe");
const Rating = require("../models/Rating");
const User = require("../models/User");
const Order = require("../models/Order");

let server;
let base;

// 1x1 transparent PNG
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

async function call(method, path, { token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(base + path, { method, headers, body: payload });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON (e.g. image bytes) */
  }
  return { status: res.status, body: json, res };
}

async function register(name) {
  const email = `${name.toLowerCase()}@example.com`;
  const r = await call("POST", "/api/auth/register", { body: { name, email, password: "secret123" } });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return { token: r.body.token, id: r.body.user.id, email };
}

const validRecipe = (over = {}) => ({
  title: "Community Lentil Soup",
  description: "A warm soup.",
  image: "https://example.com/soup.jpg",
  prepTimeMinutes: 10,
  cookTimeMinutes: 30,
  servings: 4,
  calories: 320,
  difficulty: "Easy",
  dietTags: ["Vegan"],
  allergens: [],
  ingredients: [{ name: "Lentils", quantity: "200", unit: "g", category: "Pantry" }],
  steps: ["Rinse the lentils.", "Simmer for 30 minutes."],
  tips: "",
  ...over,
});

let alice, bob, admin, seedRecipe;

test.before(async () => {
  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();
  await Promise.all([User.init(), Recipe.init(), Rating.init(), Order.init()]);
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;

  alice = await register("Alice");
  bob = await register("Bob");
  admin = await register("Boss");
  await User.updateOne({ _id: admin.id }, { $set: { role: "admin" } });

  seedRecipe = await Recipe.create({ ...validRecipe({ title: "Built-in Pasta" }), status: undefined });
});

test.after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await new Promise((r) => server.close(r));
});

// ------------------------------------------------------------------ roles
test("registration returns role 'user'; promoted account is reported as admin by /me", async () => {
  const me = await call("GET", "/api/auth/me", { token: alice.token });
  assert.equal(me.body.user.role, "user");
  const meAdmin = await call("GET", "/api/auth/me", { token: admin.token });
  assert.equal(meAdmin.body.user.role, "admin");
});

// ------------------------------------------------------------------ ratings
test("ratings: guests are rejected", async () => {
  const put = await call("PUT", `/api/recipes/${seedRecipe._id}/rating`, { body: { value: 5 } });
  assert.equal(put.status, 401);
});

test("ratings: invalid values are rejected by the backend", async () => {
  for (const value of [0, 6, 3.5, "abc", null, true, -1]) {
    const r = await call("PUT", `/api/recipes/${seedRecipe._id}/rating`, { token: alice.token, body: { value } });
    assert.equal(r.status, 400, `value ${JSON.stringify(value)} should be 400`);
  }
});

test("ratings: add, average, count, edit (one rating per user)", async () => {
  const url = `/api/recipes/${seedRecipe._id}/rating`;

  let r = await call("PUT", url, { token: alice.token, body: { value: 4 } });
  assert.equal(r.status, 200);
  assert.deepEqual([r.body.ratingAverage, r.body.ratingCount], [4, 1]);

  r = await call("PUT", url, { token: bob.token, body: { value: 5 } });
  assert.deepEqual([r.body.ratingAverage, r.body.ratingCount], [4.5, 2]);

  // Alice changes her mind: count stays 2, average changes
  r = await call("PUT", url, { token: alice.token, body: { value: 2 } });
  assert.deepEqual([r.body.ratingAverage, r.body.ratingCount], [3.5, 2]);
  assert.equal(await Rating.countDocuments({ recipe: seedRecipe._id }), 2);

  const mine = await call("GET", url, { token: alice.token });
  assert.equal(mine.body.myRating, 2);

  // the public recipe endpoint exposes the new numbers
  const pub = await call("GET", `/api/recipes/${seedRecipe._id}`);
  assert.equal(pub.body.ratingAverage, 3.5);
  assert.equal(pub.body.ratingCount, 2);
  const list = await call("GET", "/api/recipes?search=Built-in");
  assert.equal(list.body.data[0].ratingCount, 2);
});

test("ratings: the database refuses a duplicate (recipe,user) pair", async () => {
  await assert.rejects(Rating.create({ recipe: seedRecipe._id, user: alice.id, value: 1 }), (e) => e.code === 11000);
});

// ------------------------------------------------------------------ legacy data
test("legacy recipes without a status field are still public", async () => {
  await Recipe.collection.insertOne({
    ...validRecipe({ title: "Legacy Rice" }),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const r = await call("GET", "/api/recipes?search=Legacy");
  assert.equal(r.body.data.length, 1);
});

// ------------------------------------------------------------------ submissions
let pendingId;

test("submissions: guests cannot submit", async () => {
  const r = await call("POST", "/api/submissions", { body: validRecipe() });
  assert.equal(r.status, 401);
});

test("submissions: validation errors come from the backend", async () => {
  const bad = await call("POST", "/api/submissions", {
    token: alice.token,
    body: validRecipe({ title: "x", servings: 0, ingredients: [], steps: [], image: "http://insecure.example/a.jpg" }),
  });
  assert.equal(bad.status, 400);
  const fields = bad.body.errors.map((e) => e.field);
  for (const f of ["title", "servings", "ingredients", "steps", "image"]) assert.ok(fields.includes(f), `missing error for ${f}`);
  assert.equal(await Recipe.countDocuments({ title: "x" }), 0);
});

test("submissions: result is always pending and tied to the sender (body cannot override)", async () => {
  const r = await call("POST", "/api/submissions", {
    token: alice.token,
    body: { ...validRecipe(), status: "approved", submittedBy: bob.id, ratingAverage: 5, ratingCount: 999, rejectionReason: "hack" },
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.status, "pending");
  assert.equal(r.body.submittedBy, alice.id);
  assert.equal(r.body.ratingCount, 0);
  assert.equal(r.body.ratingAverage, 0);
  pendingId = r.body._id;
});

test("pending recipes are NOT public (list, detail, rating, meal plan)", async () => {
  const list = await call("GET", "/api/recipes?search=Community");
  assert.equal(list.body.data.length, 0);
  assert.equal((await call("GET", `/api/recipes/${pendingId}`)).status, 404);
  assert.equal((await call("PUT", `/api/recipes/${pendingId}/rating`, { token: bob.token, body: { value: 5 } })).status, 404);
  const plan = await call("POST", "/api/mealplans/2026-10-05/meals", {
    token: bob.token,
    body: { dayIndex: 0, mealType: "lunch", recipeId: pendingId },
  });
  assert.equal(plan.status, 404);
});

test("owner sees the recipe in /submissions/mine; other users do not", async () => {
  const mine = await call("GET", "/api/submissions/mine", { token: alice.token });
  assert.equal(mine.body.data.length, 1);
  assert.equal(mine.body.data[0].status, "pending");
  const others = await call("GET", "/api/submissions/mine", { token: bob.token });
  assert.equal(others.body.data.length, 0);
});

test("permissions: only admins reach /api/admin and recipe write endpoints", async () => {
  assert.equal((await call("GET", "/api/admin/recipes")).status, 401);
  assert.equal((await call("GET", "/api/admin/recipes", { token: alice.token })).status, 403);
  // the owner cannot approve her own recipe
  assert.equal((await call("PATCH", `/api/admin/recipes/${pendingId}/approve`, { token: alice.token })).status, 403);
  assert.equal((await Recipe.findById(pendingId)).status, "pending");
  // and cannot self-approve through the old public-style endpoints either
  assert.equal((await call("PUT", `/api/recipes/${pendingId}`, { token: alice.token, body: { status: "approved" } })).status, 403);
  assert.equal((await call("PUT", `/api/recipes/${pendingId}`, { body: { status: "approved" } })).status, 401);
  assert.equal((await call("DELETE", `/api/recipes/${seedRecipe._id}`, { token: alice.token })).status, 403);
  assert.equal((await call("POST", "/api/recipes", { token: alice.token, body: validRecipe() })).status, 403);
  assert.equal((await Recipe.findById(pendingId)).status, "pending");
});

test("admin: list/filter/detail show submitter and counts", async () => {
  const list = await call("GET", "/api/admin/recipes?status=pending", { token: admin.token });
  assert.equal(list.status, 200);
  assert.equal(list.body.data.length, 1);
  assert.equal(list.body.data[0].submittedBy.name, "Alice");
  assert.equal(list.body.counts.pending, 1);
  assert.equal((await call("GET", "/api/admin/recipes?status=bogus", { token: admin.token })).status, 400);
  const one = await call("GET", `/api/admin/recipes/${pendingId}`, { token: admin.token });
  assert.equal(one.body.title, "Community Lentil Soup");
  assert.equal(one.body.ingredients.length, 1);
});

test("admin approves -> recipe becomes public and can be rated / planned", async () => {
  const r = await call("PATCH", `/api/admin/recipes/${pendingId}/approve`, { token: admin.token });
  assert.equal(r.status, 200);
  assert.equal(r.body.status, "approved");
  assert.ok(r.body.reviewedAt);

  const list = await call("GET", "/api/recipes?search=Community");
  assert.equal(list.body.data.length, 1);
  assert.equal((await call("GET", `/api/recipes/${pendingId}`)).status, 200);

  const rate = await call("PUT", `/api/recipes/${pendingId}/rating`, { token: bob.token, body: { value: 5 } });
  assert.equal(rate.status, 200);
  // the author may not rate her own recipe
  assert.equal((await call("PUT", `/api/recipes/${pendingId}/rating`, { token: alice.token, body: { value: 5 } })).status, 403);

  const plan = await call("POST", "/api/mealplans/2026-10-05/meals", {
    token: bob.token,
    body: { dayIndex: 0, mealType: "lunch", recipeId: pendingId },
  });
  assert.equal(plan.status, 201);
});

test("admin rejects with a reason -> hidden from public, reason visible to owner", async () => {
  const sub = await call("POST", "/api/submissions", { token: bob.token, body: validRecipe({ title: "Bob Questionable Dish" }) });
  const id = sub.body._id;
  const rej = await call("PATCH", `/api/admin/recipes/${id}/reject`, { token: admin.token, body: { reason: "Photo is unclear." } });
  assert.equal(rej.status, 200);
  assert.equal(rej.body.status, "rejected");

  assert.equal((await call("GET", `/api/recipes/${id}`)).status, 404);
  const mine = await call("GET", "/api/submissions/mine", { token: bob.token });
  const mineRejected = mine.body.data.find((x) => x._id === id);
  assert.equal(mineRejected.status, "rejected");
  assert.equal(mineRejected.rejectionReason, "Photo is unclear.");

  const counts = (await call("GET", "/api/admin/recipes", { token: admin.token })).body.counts;
  assert.equal(counts.rejected, 1);
  assert.equal(counts.approved, 1);
  assert.equal((await call("PATCH", "/api/admin/recipes/not-an-id/approve", { token: admin.token })).status, 404);
  assert.equal((await call("PATCH", `/api/admin/recipes/${seedRecipe._id}/approve`, { token: admin.token })).status, 404); // not a submission
});

// ------------------------------------------------------------------ uploads
test("uploads: auth, content sniffing, size limit and safe file names", async () => {
  const form = (buf, name = "a.png", type = "image/png") => {
    const f = new FormData();
    f.append("image", new Blob([buf], { type }), name);
    return f;
  };

  assert.equal((await call("POST", "/api/uploads/recipe-image", { form: form(PNG) })).status, 401);

  // a text file pretending to be a PNG is refused (we check the real bytes)
  const fake = await call("POST", "/api/uploads/recipe-image", { token: alice.token, form: form(Buffer.from("<script>alert(1)</script>"), "evil.png") });
  assert.equal(fake.status, 400);

  // too large
  const big = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024 + 10)]);
  assert.equal((await call("POST", "/api/uploads/recipe-image", { token: alice.token, form: form(big) })).status, 413);

  // valid image; the server picks the name (the dangerous original name is ignored)
  const ok = await call("POST", "/api/uploads/recipe-image", { token: alice.token, form: form(PNG, "../../evil.php") });
  assert.equal(ok.status, 201, JSON.stringify(ok.body));
  assert.match(ok.body.url, /^\/uploads\/recipes\/[0-9a-f-]{36}\.png$/);

  const served = await fetch(base + ok.body.url);
  assert.equal(served.status, 200);
  assert.equal(served.headers.get("content-type"), "image/png");
  assert.equal(served.headers.get("x-content-type-options"), "nosniff");

  // a submission may use the uploaded file ...
  const good = await call("POST", "/api/submissions", { token: alice.token, body: validRecipe({ title: "With Upload", image: ok.body.url }) });
  assert.equal(good.status, 201, JSON.stringify(good.body));
  // ... but not arbitrary local paths
  for (const image of ["/uploads/recipes/../../server.js", "/etc/passwd", "javascript:alert(1)", "/uploads/recipes/x.png"]) {
    const bad = await call("POST", "/api/submissions", { token: alice.token, body: validRecipe({ title: "Bad Image", image }) });
    assert.equal(bad.status, 400, image);
  }
});

// ------------------------------------------------------------------ orders
const orderBody = (over = {}) => ({
  weekStart: "2026-10-05",
  items: [{ name: "Onion", category: "Produce", unit: "unit", quantity: 2, price: 1.99 }],
  subtotal: 3.98,
  deliveryFee: 3.99,
  serviceFee: 1.5,
  total: 9.47,
  deliveryMethod: "delivery",
  destination: "Street 1, City",
  paymentMethod: "card",
  cardLast4: "4242",
  ...over,
});

let orderA;

test("orders: create (card + cod), validation and totals check", async () => {
  assert.equal((await call("POST", "/api/orders", { body: orderBody() })).status, 401);

  const r = await call("POST", "/api/orders", { token: alice.token, body: orderBody() });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.status, "placed");
  assert.equal(r.body.paymentStatus, "demo_simulated");
  assert.match(r.body.orderNumber, /^FD-[0-9A-F]{6}$/);
  assert.equal(r.body.userId, alice.id);
  orderA = r.body;

  const cod = await call("POST", "/api/orders", { token: alice.token, body: orderBody({ paymentMethod: "cod", cardLast4: undefined }) });
  assert.equal(cod.status, 201);
  assert.equal(cod.body.cardLast4, null);

  assert.equal((await call("POST", "/api/orders", { token: alice.token, body: orderBody({ total: 1 }) })).body.code, "TOTAL_MISMATCH");
  assert.equal((await call("POST", "/api/orders", { token: alice.token, body: orderBody({ items: [] }) })).body.code, "EMPTY_ORDER");
  assert.equal((await call("POST", "/api/orders", { token: alice.token, body: orderBody({ paymentMethod: "bitcoin" }) })).body.code, "INVALID_PAYMENT");
});

test("orders: users see only their own orders (list and details)", async () => {
  const mine = await call("GET", "/api/orders", { token: alice.token });
  assert.equal(mine.body.data.length, 2);
  assert.ok(mine.body.data.every((o) => o.userId === alice.id));

  const bobs = await call("GET", "/api/orders", { token: bob.token });
  assert.equal(bobs.body.data.length, 0);

  assert.equal((await call("GET", `/api/orders/${orderA._id}`, { token: alice.token })).status, 200);
  assert.equal((await call("GET", `/api/orders/${orderA._id}`, { token: bob.token })).status, 404); // someone else's
  assert.equal((await call("GET", `/api/orders/${orderA._id}`)).status, 401);
  assert.equal((await call("GET", "/api/orders/not-an-id", { token: alice.token })).status, 404);
});

test("orders: users cannot change status; only admin can (and not after final states)", async () => {
  // no user-level update route exists
  assert.equal((await call("PATCH", `/api/orders/${orderA._id}`, { token: alice.token, body: { status: "completed" } })).status, 404);
  assert.equal((await call("PATCH", `/api/admin/orders/${orderA._id}/status`, { token: alice.token, body: { status: "completed" } })).status, 403);
  assert.equal((await call("PATCH", `/api/admin/orders/${orderA._id}/status`, { body: { status: "completed" } })).status, 401);
  assert.equal((await Order.findById(orderA._id)).status, "placed");

  const list = await call("GET", "/api/admin/orders", { token: admin.token });
  assert.equal(list.body.data.length, 2);
  assert.equal(list.body.data[0].customer.name, "Alice");

  assert.equal((await call("PATCH", `/api/admin/orders/${orderA._id}/status`, { token: admin.token, body: { status: "weird" } })).status, 400);
  const proc = await call("PATCH", `/api/admin/orders/${orderA._id}/status`, { token: admin.token, body: { status: "processing" } });
  assert.equal(proc.body.status, "processing");
  const done = await call("PATCH", `/api/admin/orders/${orderA._id}/status`, { token: admin.token, body: { status: "completed" } });
  assert.equal(done.body.status, "completed");
  assert.equal((await call("PATCH", `/api/admin/orders/${orderA._id}/status`, { token: admin.token, body: { status: "cancelled" } })).status, 409);

  // the owner sees the new status
  assert.equal((await call("GET", `/api/orders/${orderA._id}`, { token: alice.token })).body.status, "completed");
});

// ------------------------------------------------------------------ search escaping
test("recipe search treats special characters literally (no regex errors)", async () => {
  const r = await call("GET", "/api/recipes?search=" + encodeURIComponent("(("));
  assert.equal(r.status, 200);
  assert.equal(r.body.data.length, 0);
});
