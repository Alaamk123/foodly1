import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  Truck,
  Store,
  CreditCard,
  Banknote,
  Lock,
  CheckCircle2,
  Clock,
  PackageCheck,
  Receipt,
} from "lucide-react";
import { fetchGroceryList, createOrder, fetchOrders } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import { formatWeekRangeLabel } from "../utils/date";
import { priceForItem, formatPrice } from "../utils/fakePricing";
import LoadingSpinner from "../components/LoadingSpinner";

const DELIVERY_FEE = 3.99;
const SERVICE_FEE = 1.5;

// Payment methods. The chosen id is sent to the server and saved with the order.
const PAYMENT_OPTIONS = [
  { id: "cod", icon: Banknote },
  { id: "visa", icon: CreditCard },
  { id: "mastercard", icon: CreditCard },
];

// Canonical (English) pickup names are what gets saved; the UI shows the translated list (checkout.stores).
const STORE_NAMES = ["Foodly Market — Downtown", "Foodly Market — Uptown", "Foodly Market — Riverside"];

function groceryStorageKey(userId, weekStart) {
  return `foodly_checked_${userId}_${weekStart}`;
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}
function matchesBrand(brand, number) {
  const d = number.replace(/\D/g, "");
  if (!d) return true; // nothing typed yet
  if (brand === "visa") return d.startsWith("4");
  if (brand === "mastercard") {
    if (d.length === 1) return d === "5" || d === "2";
    const p2 = parseInt(d.slice(0, 2), 10);
    const p4 = parseInt(d.slice(0, 4), 10);
    return (p2 >= 51 && p2 <= 55) || (d.length >= 4 && p4 >= 2221 && p4 <= 2720) || (d.length < 4 && d.startsWith("2"));
  }
  return true;
}
function validExpiry(value) {
  const m = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}
const shortOrderId = (id) => `FD-${String(id).slice(-6).toUpperCase()}`;

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export default function Checkout() {
  const { user, currentWeekStart } = useAuth();
  const { t, isRTL, locale, apiError } = useLanguage();
  const userId = user.id;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [step, setStep] = useState("review");
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");
  const [address, setAddress] = useState("");
  const [pickupStore, setPickupStore] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvc: "" });
  const [order, setOrder] = useState(null);
  const [pastOrders, setPastOrders] = useState([]);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchGroceryList(currentWeekStart)
      .then((list) => {
        const checkedRaw = localStorage.getItem(groceryStorageKey(userId, currentWeekStart));
        const checked = checkedRaw ? JSON.parse(checkedRaw) : {};
        const flattened = (list.categories || []).flatMap((cat) =>
          cat.items
            .filter((it) => !checked[`${cat.category}:${it.name}`])
            .map((it) => ({
              key: `${cat.category}:${it.name}`,
              category: cat.category,
              name: it.name,
              unit: it.unit,
              quantity: it.quantity,
              price: priceForItem(it.name, cat.category),
            }))
        );
        setItems(flattened);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Recent orders now come from the server (they used to live only in localStorage)
    fetchOrders()
      .then((orders) => setPastOrders(orders.map((o) => ({ id: shortOrderId(o._id), date: o.createdAt, total: o.total }))))
      .catch(() => setPastOrders([]));
  }, [userId, currentWeekStart]);

  const subtotal = useMemo(() => items.reduce((sum, it) => sum + it.price * it.quantity, 0), [items]);
  const deliveryFee = deliveryMethod === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee + SERVICE_FEE;

  const isCard = paymentMethod === "visa" || paymentMethod === "mastercard";
  const brandOk = !isCard || matchesBrand(paymentMethod, card.number);
  const expiryOk = validExpiry(card.expiry);
  const cardValid =
    card.number.replace(/\s/g, "").length === 16 &&
    brandOk &&
    expiryOk &&
    card.cvc.length >= 3 &&
    card.name.trim().length > 1;

  const canContinueReview = deliveryMethod === "pickup" || address.trim().length > 5;
  const canPlaceOrder = paymentMethod === "cod" || cardValid;

  const placeOrder = async () => {
    setOrderError("");
    setStep("placing");

    const cardDigits = card.number.replace(/\s/g, "");
    const payload = {
      weekStart: currentWeekStart,
      items: items.map(({ name, category, unit, quantity, price }) => ({
        name,
        category,
        unit,
        quantity: Number(quantity),
        price,
      })),
      subtotal,
      deliveryFee,
      serviceFee: SERVICE_FEE,
      total,
      deliveryMethod,
      destination: deliveryMethod === "delivery" ? address.trim() : STORE_NAMES[pickupStore],
      paymentMethod, // "cod" | "visa" | "mastercard" -> saved with the order
      // Only the last 4 digits are sent. The full number, name and CVC never leave this form.
      cardLast4: isCard ? cardDigits.slice(-4) : undefined,
    };

    try {
      const saved = await createOrder(payload);

      try {
        const checkedRaw = localStorage.getItem(groceryStorageKey(userId, currentWeekStart));
        const checked = checkedRaw ? JSON.parse(checkedRaw) : {};
        items.forEach((it) => (checked[it.key] = true));
        localStorage.setItem(groceryStorageKey(userId, currentWeekStart), JSON.stringify(checked));
      } catch (err) {
        console.error(err);
      }

      const newOrder = {
        id: shortOrderId(saved._id),
        date: saved.createdAt,
        itemCount: items.length,
        total: saved.total,
        deliveryMethod: saved.deliveryMethod,
        paymentMethod: saved.paymentMethod,
        cardLast4: saved.cardLast4,
        storeIndex: pickupStore,
        destination: saved.destination,
      };
      setPastOrders((prev) => [{ id: newOrder.id, date: newOrder.date, total: newOrder.total }, ...prev].slice(0, 10));
      setOrder(newOrder);
      setStep("done");
    } catch (err) {
      console.error(err);
      setOrderError(apiError(err, "checkout.orderFailed"));
      setStep("payment");
    }
  };

  if (loading) return <LoadingSpinner label={t("checkout.loading")} />;

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
          <Lock size={13} /> {t("checkout.demoBanner")}
        </div>
      </div>

      {step !== "done" && (
        <Link
          to="/grocery-list"
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:underline"
        >
          <BackArrow size={16} /> {t("checkout.back")}
        </Link>
      )}

      {items.length === 0 && step === "review" ? (
        <EmptyState />
      ) : step === "done" ? (
        <Confirmation order={order} pastOrders={pastOrders} />
      ) : (
        <>
          <h1 className="section-title flex items-center gap-2">
            <ShoppingCart size={24} /> {t("checkout.title")}
          </h1>
          <p className="mb-6 text-sm text-primary-500">
            {t("checkout.weekOf")} {formatWeekRangeLabel(currentWeekStart, locale)} — {t("checkout.itemsNeeded", { n: items.length })}
          </p>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              {step === "review" && (
                <ReviewStep
                  deliveryMethod={deliveryMethod}
                  setDeliveryMethod={setDeliveryMethod}
                  address={address}
                  setAddress={setAddress}
                  pickupStore={pickupStore}
                  setPickupStore={setPickupStore}
                  onContinue={() => setStep("payment")}
                  canContinue={canContinueReview}
                />
              )}

              {step === "payment" && (
                <PaymentStep
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  card={card}
                  setCard={setCard}
                  brandOk={brandOk}
                  expiryOk={expiryOk}
                  orderError={orderError}
                  onBack={() => setStep("review")}
                  onPlaceOrder={placeOrder}
                  canPlaceOrder={canPlaceOrder}
                />
              )}

              {step === "placing" && (
                <div className="card flex flex-col items-center gap-3 py-16 text-center">
                  <LoadingSpinner label={t("checkout.placing")} />
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <OrderSummary items={items} subtotal={subtotal} deliveryFee={deliveryFee} total={total} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  const { t } = useLanguage();
  return (
    <div className="card p-10 text-center">
      <PackageCheck size={32} className="mx-auto mb-3 text-primary-300" />
      <p className="font-display font-bold text-primary-800">{t("checkout.emptyTitle")}</p>
      <p className="mt-1 text-sm text-primary-500">{t("checkout.emptyText")}</p>
      <Link to="/grocery-list" className="btn-primary mt-5 inline-flex">
        {t("checkout.backToGrocery")}
      </Link>
    </div>
  );
}

function ReviewStep({ deliveryMethod, setDeliveryMethod, address, setAddress, pickupStore, setPickupStore, onContinue, canContinue }) {
  const { t } = useLanguage();
  return (
    <div className="card flex flex-col gap-5 p-6">
      <h2 className="font-display font-bold text-primary-900">{t("checkout.howGetIt")}</h2>

      <div className="grid grid-cols-2 gap-3">
        <OptionTile icon={Truck} label={t("checkout.delivery")} active={deliveryMethod === "delivery"} onClick={() => setDeliveryMethod("delivery")} />
        <OptionTile icon={Store} label={t("checkout.pickup")} active={deliveryMethod === "pickup"} onClick={() => setDeliveryMethod("pickup")} />
      </div>

      {deliveryMethod === "delivery" ? (
        <div>
          <label className="mb-1 block text-sm font-semibold text-primary-700">{t("checkout.deliveryAddress")}</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            placeholder={t("checkout.addressPlaceholder")}
            className="w-full rounded-xl border border-primary-100 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm font-semibold text-primary-700">{t("checkout.pickupLocation")}</label>
          <select
            value={pickupStore}
            onChange={(e) => setPickupStore(Number(e.target.value))}
            className="w-full rounded-xl border border-primary-100 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          >
            {t("checkout.stores").map((s, i) => (
              <option key={s} value={i}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      <button onClick={onContinue} disabled={!canContinue} className="btn-primary self-end">
        {t("checkout.continueToPayment")}
      </button>
    </div>
  );
}

function PaymentStep({ paymentMethod, setPaymentMethod, card, setCard, brandOk, expiryOk, orderError, onBack, onPlaceOrder, canPlaceOrder }) {
  const { t } = useLanguage();
  const isCard = paymentMethod !== "cod";
  const inputClass =
    "w-full rounded-xl border border-primary-100 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100";

  return (
    <div className="card flex flex-col gap-5 p-6">
      <h2 className="font-display font-bold text-primary-900">{t("checkout.howPay")}</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label={t("checkout.howPay")}>
        {PAYMENT_OPTIONS.map(({ id, icon }) => (
          <OptionTile
            key={id}
            icon={icon}
            label={t(`checkout.methods.${id}`)}
            active={paymentMethod === id}
            onClick={() => setPaymentMethod(id)}
          />
        ))}
      </div>

      {isCard ? (
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-primary-700">{t("checkout.cardNumber")}</label>
            <input
              inputMode="numeric"
              autoComplete="off"
              dir="ltr"
              placeholder="1234 5678 9012 3456"
              value={card.number}
              onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
              className={`${inputClass} text-start`}
            />
            {!brandOk && (
              <p className="mt-1 text-xs text-red-600">
                {paymentMethod === "visa" ? t("checkout.brandMismatchVisa") : t("checkout.brandMismatchMastercard")}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-primary-700">{t("checkout.nameOnCard")}</label>
            <input
              autoComplete="off"
              value={card.name}
              onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
              placeholder={t("checkout.namePlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-semibold text-primary-700">{t("checkout.expiry")}</label>
              <input
                inputMode="numeric"
                autoComplete="off"
                dir="ltr"
                placeholder="MM/YY"
                value={card.expiry}
                onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                className={`${inputClass} text-start`}
              />
              {card.expiry.length === 5 && !expiryOk && (
                <p className="mt-1 text-xs text-red-600">{t("checkout.invalidExpiry")}</p>
              )}
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-semibold text-primary-700">{t("checkout.cvc")}</label>
              <input
                inputMode="numeric"
                autoComplete="off"
                dir="ltr"
                placeholder="123"
                value={card.cvc}
                onChange={(e) => setCard((c) => ({ ...c, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                className={`${inputClass} text-start`}
              />
            </div>
          </div>
          <p className="flex items-center gap-1 text-xs text-primary-400">
            <Lock size={12} /> {t("checkout.cardNote")}
          </p>
        </div>
      ) : (
        <p className="rounded-xl bg-primary-50 p-4 text-sm text-primary-700">{t("checkout.codNote")}</p>
      )}

      {orderError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {orderError}
        </p>
      )}

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-secondary">
          {t("checkout.backStep")}
        </button>
        <button onClick={onPlaceOrder} disabled={!canPlaceOrder} className="btn-accent">
          {t("checkout.placeOrder")}
        </button>
      </div>
    </div>
  );
}

function OptionTile({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-xl2 border-2 p-4 transition-colors ${
        active ? "border-primary-500 bg-primary-50" : "border-primary-100 bg-white hover:border-primary-300"
      }`}
    >
      <Icon size={20} className={active ? "text-primary-600" : "text-primary-400"} />
      <span className="text-sm font-semibold text-primary-800">{label}</span>
    </button>
  );
}

function OrderSummary({ items, subtotal, deliveryFee, total }) {
  const { t, term, ingredient } = useLanguage();
  return (
    <div className="card sticky top-20 p-5">
      <h2 className="mb-3 font-display font-bold text-primary-900">{t("checkout.summary")}</h2>
      <ul className="mb-3 flex max-h-64 flex-col gap-2 overflow-y-auto pe-1">
        {items.map((it) => (
          <li key={it.key} className="flex items-center justify-between text-sm">
            <span className="text-primary-700">
              {ingredient(it.name)} <span className="text-primary-400">× {it.quantity} {term("units", it.unit)}</span>
            </span>
            <bdi className="font-semibold text-primary-800">{formatPrice(it.price * it.quantity)}</bdi>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-1.5 border-t border-primary-100 pt-3 text-sm">
        <Row label={t("checkout.subtotal")} value={formatPrice(subtotal)} />
        <Row label={t("checkout.deliveryFee")} value={deliveryFee ? formatPrice(deliveryFee) : t("checkout.free")} />
        <Row label={t("checkout.serviceFee")} value={formatPrice(SERVICE_FEE)} />
        <Row label={t("checkout.total")} value={formatPrice(total)} bold />
      </div>
      <p className="mt-3 text-[11px] text-primary-400">{t("checkout.priceNote")}</p>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-display font-bold text-primary-900" : "text-primary-500"}`}>
      <span>{label}</span>
      <bdi>{value}</bdi>
    </div>
  );
}

function Confirmation({ order, pastOrders }) {
  const { t, locale } = useLanguage();
  if (!order) return null;
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="card w-full max-w-md p-8">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white">
          <CheckCircle2 size={28} />
        </span>
        <h1 className="font-display text-2xl font-extrabold text-primary-900">{t("checkout.orderPlaced")}</h1>
        <p className="mt-1 text-sm text-primary-500">
          {t("checkout.order")} {order.id}
        </p>

        <div className="mt-6 flex flex-col gap-2 rounded-xl bg-primary-50 p-4 text-sm">
          <Row label={t("checkout.items")} value={order.itemCount} />
          <Row label={t("checkout.total")} value={formatPrice(order.total)} />
          <Row
            label={t("checkout.payingWith")}
            value={
              order.paymentMethod === "cod"
                ? t("checkout.methods.cod")
                : t("checkout.cardEnding", { brand: t(`checkout.methods.${order.paymentMethod}`), last4: order.cardLast4 })
            }
          />
          <Row
            label={order.deliveryMethod === "delivery" ? t("checkout.deliveringTo") : t("checkout.pickupAt")}
            value={order.deliveryMethod === "delivery" ? order.destination : t("checkout.stores")[order.storeIndex]}
          />
          <div className="flex items-center justify-between text-primary-700">
            <span className="flex items-center gap-1">
              <Clock size={14} /> {t("checkout.estimated")}
            </span>
            <span className="font-semibold">{order.deliveryMethod === "delivery" ? t("checkout.etaDelivery") : t("checkout.etaPickup")}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/grocery-list" className="btn-primary">
            {t("checkout.backToGrocery")}
          </Link>
          <Link to="/planner" className="btn-secondary">
            {t("checkout.planNextWeek")}
          </Link>
        </div>
      </div>

      {pastOrders.length > 1 && (
        <div className="w-full max-w-md text-start">
          <h2 className="mb-3 flex items-center gap-1.5 font-display text-sm font-bold text-primary-700">
            <Receipt size={15} /> {t("checkout.recentOrders")}
          </h2>
          <div className="flex flex-col gap-2">
            {pastOrders.slice(1, 4).map((o) => (
              <div key={o.id} className="card flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-primary-800">{o.id}</p>
                  <p className="text-xs text-primary-400">{new Date(o.date).toLocaleDateString(locale)}</p>
                </div>
                <span className="font-semibold text-primary-700">{formatPrice(o.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
