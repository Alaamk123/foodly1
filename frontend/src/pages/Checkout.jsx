import { createContext, useContext, useEffect, useMemo, useState } from "react";
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
  Languages,
} from "lucide-react";
import { fetchGroceryList } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatWeekRangeLabel } from "../utils/date";
import { priceForItem, formatPrice } from "../utils/fakePricing";
import LoadingSpinner from "../components/LoadingSpinner";

/* ===================== Bilingual text (EN / AR) =====================
   Self-contained to this page on purpose: switching languages here does
   not affect the rest of the site. See the chat message for how to reuse
   this same pattern on other pages later. */
const STRINGS = {
  en: {
    demoBanner: "Demo checkout — no real payment is processed or stored.",
    back: "Back to grocery list",
    title: "Checkout",
    weekOf: "Week of",
    itemsNeeded: (n) => `${n} item${n !== 1 ? "s" : ""} still needed.`,
    emptyTitle: "Nothing left to buy this week.",
    emptyText: "Everything on your grocery list is already checked off, or your list is empty.",
    backToGrocery: "Back to Grocery List",
    howGetIt: "How do you want to get it?",
    delivery: "Delivery",
    pickup: "Pickup",
    deliveryAddress: "Delivery address",
    addressPlaceholder: "Street, city, apartment/floor...",
    pickupLocation: "Pickup location",
    continueToPayment: "Continue to payment",
    howPay: "How do you want to pay?",
    card: "Card",
    cod: "Cash on delivery",
    cardNumber: "Card number",
    nameOnCard: "Name on card",
    namePlaceholder: "As printed on the card",
    expiry: "Expiry",
    cvc: "CVC",
    cardNote: "This is a demo form — don't enter a real card number.",
    codNote: "Pay in cash when your order arrives (or when you pick it up). No card details needed.",
    backStep: "Back",
    placeOrder: "Place order",
    placing: "Placing your order...",
    placingNote: "(Simulated — just a moment)",
    summary: "Order summary",
    subtotal: "Subtotal",
    deliveryFee: "Delivery fee",
    free: "Free",
    serviceFee: "Service fee",
    total: "Total",
    priceNote: "Prices are illustrative demo estimates, not real store prices.",
    orderPlaced: "Order placed!",
    order: "Order",
    items: "Items",
    payingWith: "Paying with",
    cardEnding: (n) => `Card •••• ${n}`,
    deliveringTo: "Delivering to",
    pickupAt: "Pickup at",
    estimated: "Estimated",
    planNextWeek: "Plan next week",
    recentOrders: "Recent orders",
    stores: ["Foodly Market — Downtown", "Foodly Market — Uptown", "Foodly Market — Riverside"],
  },
  ar: {
    demoBanner: "عملية دفع تجريبية — ما في أي دفع حقيقي بيصير أو بينحفظ.",
    back: "رجوع لقائمة التسوق",
    title: "إتمام الطلب",
    weekOf: "أسبوع",
    itemsNeeded: (n) => `${n} غرض لسا لازم تشتريه.`,
    emptyTitle: "ما في شي لازم تشتريه هاد الأسبوع.",
    emptyText: "كل شي بقائمة التسوق متحدّد أصلاً، أو القائمة فاضية.",
    backToGrocery: "رجوع لقائمة التسوق",
    howGetIt: "كيف بدك تستلم الطلب؟",
    delivery: "توصيل",
    pickup: "استلام من الفرع",
    deliveryAddress: "عنوان التوصيل",
    addressPlaceholder: "الشارع، المدينة، الطابق/الشقة...",
    pickupLocation: "فرع الاستلام",
    continueToPayment: "المتابعة للدفع",
    howPay: "كيف بدك تدفع؟",
    card: "بطاقة",
    cod: "الدفع عند الاستلام",
    cardNumber: "رقم البطاقة",
    nameOnCard: "الاسم على البطاقة",
    namePlaceholder: "متل ما هو مكتوب على البطاقة",
    expiry: "تاريخ الانتهاء",
    cvc: "رمز التحقق",
    cardNote: "هاد فورم تجريبي — لا تدخل رقم بطاقة حقيقي.",
    codNote: "بتدفع كاش وقت ما يوصلك الطلب (أو وقت الاستلام). ما بدك تدخل أي بيانات بطاقة.",
    backStep: "رجوع",
    placeOrder: "تأكيد الطلب",
    placing: "عم نسجّل طلبك...",
    placingNote: "(عملية تجريبية — لحظات)",
    summary: "ملخص الطلب",
    subtotal: "المجموع الفرعي",
    deliveryFee: "رسوم التوصيل",
    free: "مجاني",
    serviceFee: "رسوم الخدمة",
    total: "الإجمالي",
    priceNote: "الأسعار تقديرية لأغراض العرض فقط، مش أسعار حقيقية من المتجر.",
    orderPlaced: "تم تأكيد الطلب!",
    order: "رقم الطلب",
    items: "عدد الأغراض",
    payingWith: "طريقة الدفع",
    cardEnding: (n) => `بطاقة •••• ${n}`,
    deliveringTo: "التوصيل لـ",
    pickupAt: "الاستلام من",
    estimated: "الوقت التقديري",
    planNextWeek: "خطط للأسبوع الجاي",
    recentOrders: "طلبات سابقة",
    stores: ["فودلي ماركت — وسط البلد", "فودلي ماركت — الحي العلوي", "فودلي ماركت — جانب النهر"],
  },
};

const LangContext = createContext(null);
const useLang = () => useContext(LangContext);

function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-primary-600 shadow-card ring-1 ring-primary-100 hover:bg-primary-50"
    >
      <Languages size={14} />
      {lang === "en" ? "العربية" : "English"}
    </button>
  );
}

const DELIVERY_FEE = 3.99;
const SERVICE_FEE = 1.5;

function groceryStorageKey(userId, weekStart) {
  return `foodly_checked_${userId}_${weekStart}`;
}
function ordersStorageKey(userId) {
  return `foodly_orders_${userId}`;
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export default function Checkout() {
  const { user, currentWeekStart } = useAuth();
  const userId = user.id;
  const [lang, setLang] = useState(() => localStorage.getItem("foodly_checkout_lang") || "en");

  useEffect(() => {
    localStorage.setItem("foodly_checkout_lang", lang);
  }, [lang]);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [step, setStep] = useState("review");
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");
  const [address, setAddress] = useState("");
  const [pickupStore, setPickupStore] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvc: "" });
  const [order, setOrder] = useState(null);
  const [pastOrders, setPastOrders] = useState([]);

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

    try {
      const raw = localStorage.getItem(ordersStorageKey(userId));
      setPastOrders(raw ? JSON.parse(raw) : []);
    } catch {
      setPastOrders([]);
    }
  }, [userId, currentWeekStart]);

  const subtotal = useMemo(() => items.reduce((sum, it) => sum + it.price * it.quantity, 0), [items]);
  const deliveryFee = deliveryMethod === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee + SERVICE_FEE;

 const cardValid =
  card.number.replace(/\s/g, "").length === 16 &&
  /^\d{2}\/\d{2}$/.test(card.expiry) &&
  card.cvc.length >= 3 &&
  card.name.trim().length > 1;
  
  const canContinueReview = deliveryMethod === "pickup" || address.trim().length > 5;
  const canPlaceOrder = paymentMethod === "cod" || cardValid;

  const t = STRINGS[lang];

  const placeOrder = () => {
    setStep("placing");
    setTimeout(() => {
      const newOrder = {
        id: `FD-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString(),
        itemCount: items.length,
        total,
        deliveryMethod,
        paymentMethod,
        cardLast4: paymentMethod === "card" ? card.number.replace(/\s/g, "").slice(-4) : null,
        eta: deliveryMethod === "delivery" ? "35–50 min" : "~20 min",
        destination: deliveryMethod === "delivery" ? address.trim() : t.stores[pickupStore],
      };

      try {
        const checkedRaw = localStorage.getItem(groceryStorageKey(userId, currentWeekStart));
        const checked = checkedRaw ? JSON.parse(checkedRaw) : {};
        items.forEach((it) => (checked[it.key] = true));
        localStorage.setItem(groceryStorageKey(userId, currentWeekStart), JSON.stringify(checked));

        const updatedOrders = [newOrder, ...pastOrders].slice(0, 10);
        localStorage.setItem(ordersStorageKey(userId), JSON.stringify(updatedOrders));
        setPastOrders(updatedOrders);
      } catch (err) {
        console.error(err);
      }

      setOrder(newOrder);
      setStep("done");
    }, 1400);
  };

  if (loading) return <LoadingSpinner label={lang === "ar" ? "عم نحمّل قائمتك..." : "Loading your list..."} />;

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
            <Lock size={13} /> {t.demoBanner}
          </div>
          <LanguageToggle />
        </div>

        {step !== "done" && (
          <Link
            to="/grocery-list"
            className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:underline"
          >
            {lang === "ar" ? <ArrowRight size={16} /> : <ArrowLeft size={16} />} {t.back}
          </Link>
        )}

        {items.length === 0 && step === "review" ? (
          <EmptyState t={t} />
        ) : step === "done" ? (
          <Confirmation order={order} pastOrders={pastOrders} t={t} />
        ) : (
          <>
            <h1 className="section-title flex items-center gap-2">
              <ShoppingCart size={24} /> {t.title}
            </h1>
            <p className="mb-6 text-sm text-primary-500">
              {t.weekOf} {formatWeekRangeLabel(currentWeekStart)} — {t.itemsNeeded(items.length)}
            </p>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                {step === "review" && (
                  <ReviewStep
                    t={t}
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
                    t={t}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    card={card}
                    setCard={setCard}
                    onBack={() => setStep("review")}
                    onPlaceOrder={placeOrder}
                    canPlaceOrder={canPlaceOrder}
                  />
                )}

                {step === "placing" && (
                  <div className="card flex flex-col items-center gap-3 py-16 text-center">
                    <LoadingSpinner label={t.placing} />
                    <p className="text-xs text-primary-400">{t.placingNote}</p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2">
                <OrderSummary t={t} items={items} subtotal={subtotal} deliveryFee={deliveryFee} total={total} />
              </div>
            </div>
          </>
        )}
      </div>
    </LangContext.Provider>
  );
}

function EmptyState({ t }) {
  return (
    <div className="card p-10 text-center">
      <PackageCheck size={32} className="mx-auto mb-3 text-primary-300" />
      <p className="font-display font-bold text-primary-800">{t.emptyTitle}</p>
      <p className="mt-1 text-sm text-primary-500">{t.emptyText}</p>
      <Link to="/grocery-list" className="btn-primary mt-5 inline-flex">
        {t.backToGrocery}
      </Link>
    </div>
  );
}

function ReviewStep({ t, deliveryMethod, setDeliveryMethod, address, setAddress, pickupStore, setPickupStore, onContinue, canContinue }) {
  return (
    <div className="card flex flex-col gap-5 p-6">
      <h2 className="font-display font-bold text-primary-900">{t.howGetIt}</h2>

      <div className="grid grid-cols-2 gap-3">
        <OptionTile icon={Truck} label={t.delivery} active={deliveryMethod === "delivery"} onClick={() => setDeliveryMethod("delivery")} />
        <OptionTile icon={Store} label={t.pickup} active={deliveryMethod === "pickup"} onClick={() => setDeliveryMethod("pickup")} />
      </div>

      {deliveryMethod === "delivery" ? (
        <div>
          <label className="mb-1 block text-sm font-semibold text-primary-700">{t.deliveryAddress}</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            placeholder={t.addressPlaceholder}
            className="w-full rounded-xl border border-primary-100 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm font-semibold text-primary-700">{t.pickupLocation}</label>
          <select
            value={pickupStore}
            onChange={(e) => setPickupStore(Number(e.target.value))}
            className="w-full rounded-xl border border-primary-100 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          >
            {t.stores.map((s, i) => (
              <option key={s} value={i}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      <button onClick={onContinue} disabled={!canContinue} className="btn-primary self-end">
        {t.continueToPayment}
      </button>
    </div>
  );
}

function PaymentStep({ t, paymentMethod, setPaymentMethod, card, setCard, onBack, onPlaceOrder, canPlaceOrder }) {
  const inputClass =
    "w-full rounded-xl border border-primary-100 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100";

  return (
    <div className="card flex flex-col gap-5 p-6">
      <h2 className="font-display font-bold text-primary-900">{t.howPay}</h2>

      <div className="grid grid-cols-2 gap-3">
        <OptionTile icon={CreditCard} label={t.card} active={paymentMethod === "card"} onClick={() => setPaymentMethod("card")} />
        <OptionTile icon={Banknote} label={t.cod} active={paymentMethod === "cod"} onClick={() => setPaymentMethod("cod")} />
      </div>

      {paymentMethod === "card" ? (
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-primary-700">{t.cardNumber}</label>
            <input
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              value={card.number}
              onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-primary-700">{t.nameOnCard}</label>
            <input
              value={card.name}
              onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
              placeholder={t.namePlaceholder}
              className={inputClass}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-semibold text-primary-700">{t.expiry}</label>
              <input
                inputMode="numeric"
                placeholder="MM/YY"
                value={card.expiry}
                onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                className={inputClass}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-semibold text-primary-700">{t.cvc}</label>
              <input
                inputMode="numeric"
                placeholder="123"
                value={card.cvc}
                onChange={(e) => setCard((c) => ({ ...c, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                className={inputClass}
              />
            </div>
          </div>
          <p className="flex items-center gap-1 text-xs text-primary-400">
            <Lock size={12} /> {t.cardNote}
          </p>
        </div>
      ) : (
        <p className="rounded-xl bg-primary-50 p-4 text-sm text-primary-700">{t.codNote}</p>
      )}

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-secondary">
          {t.backStep}
        </button>
        <button onClick={onPlaceOrder} disabled={!canPlaceOrder} className="btn-accent">
          {t.placeOrder}
        </button>
      </div>
    </div>
  );
}

function OptionTile({ icon: Icon, label, active, onClick }) {
  return (
    <button
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

function OrderSummary({ t, items, subtotal, deliveryFee, total }) {
  return (
    <div className="card sticky top-20 p-5">
      <h2 className="mb-3 font-display font-bold text-primary-900">{t.summary}</h2>
      <ul className="mb-3 flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
        {items.map((it) => (
          <li key={it.key} className="flex items-center justify-between text-sm">
            <span className="text-primary-700">
              {it.name} <span className="text-primary-400">× {it.quantity} {it.unit}</span>
            </span>
            <span className="font-semibold text-primary-800">{formatPrice(it.price * it.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-1.5 border-t border-primary-100 pt-3 text-sm">
        <Row label={t.subtotal} value={formatPrice(subtotal)} />
        <Row label={t.deliveryFee} value={deliveryFee ? formatPrice(deliveryFee) : t.free} />
        <Row label={t.serviceFee} value={formatPrice(1.5)} />
        <Row label={t.total} value={formatPrice(total)} bold />
      </div>
      <p className="mt-3 text-[11px] text-primary-400">{t.priceNote}</p>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-display font-bold text-primary-900" : "text-primary-500"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Confirmation({ order, pastOrders, t }) {
  if (!order) return null;
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="card w-full max-w-md p-8">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white">
          <CheckCircle2 size={28} />
        </span>
        <h1 className="font-display text-2xl font-extrabold text-primary-900">{t.orderPlaced}</h1>
        <p className="mt-1 text-sm text-primary-500">
          {t.order} {order.id}
        </p>

        <div className="mt-6 flex flex-col gap-2 rounded-xl bg-primary-50 p-4 text-sm">
          <Row label={t.items} value={order.itemCount} />
          <Row label={t.total} value={formatPrice(order.total)} />
          <Row label={t.payingWith} value={order.paymentMethod === "card" ? t.cardEnding(order.cardLast4) : t.cod} />
          <Row label={order.deliveryMethod === "delivery" ? t.deliveringTo : t.pickupAt} value={order.destination} />
          <div className="flex items-center justify-between text-primary-700">
            <span className="flex items-center gap-1">
              <Clock size={14} /> {t.estimated}
            </span>
            <span className="font-semibold">{order.eta}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/grocery-list" className="btn-primary">
            {t.backToGrocery}
          </Link>
          <Link to="/planner" className="btn-secondary">
            {t.planNextWeek}
          </Link>
        </div>
      </div>

      {pastOrders.length > 1 && (
        <div className="w-full max-w-md text-left">
          <h2 className="mb-3 flex items-center gap-1.5 font-display text-sm font-bold text-primary-700">
            <Receipt size={15} /> {t.recentOrders}
          </h2>
          <div className="flex flex-col gap-2">
            {pastOrders.slice(1, 4).map((o) => (
              <div key={o.id} className="card flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-primary-800">{o.id}</p>
                  <p className="text-xs text-primary-400">{new Date(o.date).toLocaleDateString()}</p>
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
