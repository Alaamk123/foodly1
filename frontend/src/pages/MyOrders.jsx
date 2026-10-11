import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronDown, ChevronUp, Truck, Store, CreditCard, Banknote, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchMyOrders, errorMessage } from "../api/client";
import { formatPrice } from "../utils/fakePricing";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";

const formatDate = (iso) =>
  new Date(iso).toLocaleString("ar-u-nu-latn", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function MyOrders() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ data: [], pagination: { totalPages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchMyOrders({ page, limit: 10 })
      .then(setData)
      .catch((err) => setError(errorMessage(err, "تعذّر تحميل طلباتك.")))
      .finally(() => setLoading(false));
  }, [page]);

  const { totalPages, total } = data.pagination;

  return (
    <div dir="rtl" className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="section-title flex items-center gap-2">
        <Package size={24} /> طلباتي
      </h1>
      <p className="mb-6 mt-1 text-sm text-primary-500">{total ? `لديك ${total} طلب.` : "جميع طلباتك السابقة وحالتها تظهر هنا."}</p>

      {loading ? (
        <LoadingSpinner label="جارٍ تحميل طلباتك..." />
      ) : error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : data.data.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="font-display font-bold text-primary-800">لا توجد طلبات حتى الآن.</p>
          <p className="mt-1 text-sm text-primary-500">خطّط لوجباتك الأسبوعية ثم أتمّ طلب قائمة التسوق.</p>
          <Link to="/planner" className="btn-primary mt-4">
            ابدأ التخطيط
          </Link>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {data.data.map((o) => (
              <OrderCard key={o._id} order={o} open={openId === o._id} onToggle={() => setOpenId(openId === o._id ? null : o._id)} />
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button className="btn-secondary !px-4 !py-2" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="الصفحة السابقة">
                <ChevronRight size={18} />
              </button>
              <span className="text-sm font-semibold text-primary-700">
                {page} / {totalPages}
              </span>
              <button className="btn-secondary !px-4 !py-2" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="الصفحة التالية">
                <ChevronLeft size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OrderCard({ order, open, onToggle }) {
  const isCard = order.paymentMethod !== "cod";
  return (
    <li className="card overflow-hidden">
      <button onClick={onToggle} aria-expanded={open} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-right">
        <div>
          <p className="font-display font-bold text-primary-900">طلب {order.orderNumber}</p>
          <p className="text-xs text-primary-400">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge kind="order" status={order.status} />
          <span className="font-display font-bold text-primary-800">{formatPrice(order.total)}</span>
          {open ? <ChevronUp size={18} className="text-primary-400" /> : <ChevronDown size={18} className="text-primary-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-primary-100 p-4 text-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-right">
              <thead>
                <tr className="text-xs text-primary-400">
                  <th className="pb-2 font-semibold">المنتج</th>
                  <th className="pb-2 font-semibold">الكمية</th>
                  <th className="pb-2 font-semibold">سعر الوحدة</th>
                  <th className="pb-2 font-semibold">المجموع</th>
                </tr>
              </thead>
              <tbody className="text-primary-700">
                {order.items.map((it, i) => (
                  <tr key={i} className="border-t border-primary-50">
                    <td className="py-2">{it.name}</td>
                    <td className="py-2">
                      {it.quantity} {it.unit}
                    </td>
                    <td className="py-2">{formatPrice(it.price)}</td>
                    <td className="py-2 font-semibold">{formatPrice(it.price * it.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mt-4 flex flex-col gap-1.5 rounded-xl bg-primary-50 p-3 text-primary-700">
            <Row label="المجموع الفرعي" value={formatPrice(order.subtotal)} />
            <Row label="رسوم التوصيل" value={formatPrice(order.deliveryFee)} />
            <Row label="رسوم الخدمة" value={formatPrice(order.serviceFee)} />
            <Row label="الإجمالي" value={formatPrice(order.total)} bold />
          </dl>

          <ul className="mt-4 flex flex-col gap-2 text-primary-600">
            <li className="flex items-center gap-2">
              {order.deliveryMethod === "delivery" ? <Truck size={16} /> : <Store size={16} />}
              {order.deliveryMethod === "delivery" ? "توصيل إلى:" : "استلام من:"} <span className="font-semibold">{order.destination}</span>
            </li>
            <li className="flex items-center gap-2">
              {isCard ? <CreditCard size={16} /> : <Banknote size={16} />}
              {isCard ? `بطاقة تنتهي بـ ${order.cardLast4}` : "الدفع عند الاستلام"}
            </li>
          </ul>
        </div>
      )}
    </li>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-display font-bold text-primary-900" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
