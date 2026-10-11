import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { adminFetchOrders, adminUpdateOrderStatus, errorMessage } from "../api/client";
import { formatPrice } from "../utils/fakePricing";
import AdminTabs from "../components/AdminTabs";
import StatusBadge, { ORDER_STATUS_LABELS } from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";

// Which statuses an order may move to (the backend enforces the same: completed/cancelled are final).
const NEXT = {
  placed: ["processing", "completed", "cancelled"],
  processing: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const formatDate = (iso) => new Date(iso).toLocaleString("ar-u-nu-latn", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function AdminOrders() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [list, setList] = useState({ data: [], pagination: { totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rowError, setRowError] = useState({});
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    adminFetchOrders({ status: status || undefined, page, limit: 20 })
      .then(setList)
      .catch((err) => setError(errorMessage(err, "تعذّر تحميل الطلبات.")))
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(load, [load]);

  const changeStatus = async (order, next) => {
    if (!next) return;
    setBusyId(order._id);
    setRowError((p) => ({ ...p, [order._id]: "" }));
    try {
      const updated = await adminUpdateOrderStatus(order._id, next);
      setList((l) => ({ ...l, data: l.data.map((o) => (o._id === order._id ? { ...o, status: updated.status } : o)) }));
    } catch (err) {
      setRowError((p) => ({ ...p, [order._id]: errorMessage(err, "تعذّر تحديث الحالة.") }));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div dir="rtl" className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="section-title mb-4 flex items-center gap-2">
        <ShieldCheck size={24} /> لوحة الإدارة
      </h1>
      <AdminTabs />

      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="status-filter" className="text-sm font-semibold text-primary-700">
          الحالة:
        </label>
        <select
          id="status-filter"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-primary-100 bg-white px-3 py-2 text-sm"
        >
          <option value="">الكل</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner label="جارٍ التحميل..." />
      ) : error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : list.data.length === 0 ? (
        <p className="card p-8 text-center text-sm text-primary-500">لا توجد طلبات.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.data.map((o) => {
            const options = NEXT[o.status] || [];
            return (
              <li key={o._id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-bold text-primary-900">{o.orderNumber}</p>
                    <p className="text-xs text-primary-500">
                      {o.customer ? `${o.customer.name} (${o.customer.email})` : "مستخدم غير معروف"} · {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge kind="order" status={o.status} />
                    <span className="font-display font-bold text-primary-800">{formatPrice(o.total)}</span>
                  </div>
                </div>

                <p className="mt-2 text-sm text-primary-600">
                  {o.items.length} عنصر · {o.deliveryMethod === "delivery" ? "توصيل" : "استلام"}: {o.destination}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {options.length > 0 ? (
                    <>
                      <label htmlFor={`st-${o._id}`} className="text-sm font-semibold text-primary-700">
                        تغيير الحالة:
                      </label>
                      <select
                        id={`st-${o._id}`}
                        disabled={busyId === o._id}
                        defaultValue=""
                        onChange={(e) => changeStatus(o, e.target.value)}
                        className="rounded-xl border border-primary-100 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">اختر...</option>
                        {options.map((s) => (
                          <option key={s} value={s}>
                            {ORDER_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <span className="text-xs text-primary-400">لا يمكن تغيير حالة هذا الطلب.</span>
                  )}
                </div>
                {rowError[o._id] && (
                  <p role="alert" className="mt-2 text-xs font-semibold text-red-600">
                    {rowError[o._id]}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {list.pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button className="btn-secondary !px-4 !py-2" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="الصفحة السابقة">
            <ChevronRight size={18} />
          </button>
          <span className="text-sm font-semibold text-primary-700">
            {page} / {list.pagination.totalPages}
          </span>
          <button className="btn-secondary !px-4 !py-2" disabled={page >= list.pagination.totalPages} onClick={() => setPage((p) => p + 1)} aria-label="الصفحة التالية">
            <ChevronLeft size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
