"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Img } from "@/components/Img";
import {
  OrdersIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/admin/AdminIcons";
import type { OrderType, OrderStatus } from "@/lib/models/Order";

interface OrderItem {
  _id: string;
  orderId: string;
  type: OrderType;
  product: {
    _id?: string;
    id?: string;
    name: string;
    slug: string;
    sku?: string;
    image?: string;
    categoryName?: string;
  };
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  currency?: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  note?: string;
  status: OrderStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderSummary {
  total: number;
  pendingCount: number;
  orderCount: number;
  inquiryCount: number;
}

const ALL_STATUSES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "Delivered",
  "Cancelled",
  "Price Provided",
  "Contacted",
  "Closed",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [summary, setSummary] = useState<OrderSummary>({
    total: 0,
    pendingCount: 0,
    orderCount: 0,
    inquiryCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [adminNoteEdit, setAdminNoteEdit] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "15");

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (data.items) {
        setOrders(data.items);
        setTotalPages(data.pagination.pages);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function handleStatusChange(id: string, newStatus: OrderStatus) {
    try {
      setUpdatingStatus(true);
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrders((prev) =>
          prev.map((o) => (o._id === id ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder && selectedOrder._id === id) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        if (data.order) {
          fetchOrders();
        }
      }
    } catch (err) {
      console.error("Failed to update order status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleSaveAdminNote(id: string) {
    try {
      setUpdatingStatus(true);
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: adminNoteEdit }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o._id === id ? { ...o, adminNotes: adminNoteEdit } : o))
        );
        if (selectedOrder && selectedOrder._id === id) {
          setSelectedOrder({ ...selectedOrder, adminNotes: adminNoteEdit });
        }
      }
    } catch (err) {
      console.error("Failed to save admin note:", err);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDelete(id: string, orderId: string) {
    if (!confirm(`Are you sure you want to delete order ${orderId}? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o._id !== id));
        if (selectedOrder && selectedOrder._id === id) {
          setModalOpen(false);
          setSelectedOrder(null);
        }
        fetchOrders();
      }
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  }

  function openDetailModal(order: OrderItem) {
    setSelectedOrder(order);
    setAdminNoteEdit(order.adminNotes || "");
    setModalOpen(true);
  }

  function getStatusBadge(status: OrderStatus) {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Confirmed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Processing":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "Delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      case "Price Provided":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "Contacted":
        return "bg-teal-100 text-teal-800 border-teal-300";
      case "Closed":
        return "bg-slate-100 text-slate-800 border-slate-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-navy">
            Orders & Price Requests
          </h1>
          <p className="text-xs text-mist">
            Manage customer online orders, price quotations, and inquiry fulfillment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchOrders()}
          className="inline-flex items-center gap-2 rounded bg-navy px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#143049] transition w-fit"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded bg-white p-4 border border-line shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-mist">Total Inquiries</p>
          <p className="mt-1 font-display text-2xl font-bold text-navy">{summary.total}</p>
        </div>
        <div className="rounded bg-white p-4 border border-line shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending Action</p>
          <p className="mt-1 font-display text-2xl font-bold text-amber-600">{summary.pendingCount}</p>
        </div>
        <div className="rounded bg-white p-4 border border-line shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Direct Orders</p>
          <p className="mt-1 font-display text-2xl font-bold text-blue-600">{summary.orderCount}</p>
        </div>
        <div className="rounded bg-white p-4 border border-line shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-orange">Price Requests</p>
          <p className="mt-1 font-display text-2xl font-bold text-orange">{summary.inquiryCount}</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="rounded bg-white p-3.5 sm:p-4 border border-line shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
            <input
              type="text"
              placeholder="Search by Order ID, Customer Name, Phone, Product..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded border border-line pl-9 pr-3 py-2 text-xs text-ink placeholder:text-mist focus:border-orange focus:outline-hidden"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded border border-line px-3 py-2 text-xs text-ink bg-white focus:border-orange focus:outline-hidden"
          >
            <option value="all">All Types</option>
            <option value="ORDER">Direct Orders</option>
            <option value="PRICE REQUEST">Price Requests</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded border border-line px-3 py-2 text-xs text-ink bg-white focus:border-orange focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded bg-white border border-line shadow-xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-line bg-paper/60 text-[11px] font-bold uppercase tracking-wider text-mist">
              <tr>
                <th className="py-3 px-3.5">Order ID</th>
                <th className="py-3 px-3.5">Type</th>
                <th className="py-3 px-3.5">Product</th>
                <th className="py-3 px-3.5">Customer & Phone</th>
                <th className="py-3 px-3.5 text-right">Qty / Amount</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-mist font-semibold">
                    <div className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-orange" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span>Loading orders...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-mist">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <OrdersIcon size={32} className="text-mist/50" />
                      <p className="font-semibold">No orders or price requests found.</p>
                      <p className="text-[11px]">When customers place orders on the site, they will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const dateStr = new Date(order.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const cleanCustomerPhone = order.customer.phone.replace(/[^\d]/g, "");

                  return (
                    <tr key={order._id} className="hover:bg-paper/30 transition group">
                      {/* Order ID & Date */}
                      <td className="py-3 px-3.5 align-top">
                        <button
                          type="button"
                          onClick={() => openDetailModal(order)}
                          className="font-mono font-bold text-navy hover:text-orange transition text-left cursor-pointer"
                        >
                          {order.orderId}
                        </button>
                        <span className="block text-[10.5px] text-mist mt-0.5 whitespace-nowrap">
                          {dateStr}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-3.5 align-top">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                            order.type === "ORDER"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-orange/15 text-orange"
                          }`}
                        >
                          {order.type}
                        </span>
                      </td>

                      {/* Product */}
                      <td className="py-3 px-3.5 align-top max-w-[220px]">
                        <div className="flex items-start gap-2.5">
                          {order.product.image && (
                            <div className="relative w-9 h-9 rounded bg-paper shrink-0 overflow-hidden border border-line">
                              <Img
                                src={order.product.image}
                                alt={order.product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              href={`/products/${order.product.slug}`}
                              target="_blank"
                              className="font-semibold text-navy hover:text-orange transition line-clamp-1 text-xs"
                              title={order.product.name}
                            >
                              {order.product.name}
                            </Link>
                            {order.product.sku && (
                              <span className="text-[10px] font-mono text-mist block">
                                SKU: {order.product.sku}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="font-semibold text-navy text-xs">{order.customer.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <a
                            href={`tel:${order.customer.phone}`}
                            className="text-[11px] text-mist hover:text-navy transition flex items-center gap-1"
                          >
                            <span>{order.customer.phone}</span>
                          </a>
                          <a
                            href={`https://wa.me/${cleanCustomerPhone}?text=${encodeURIComponent(
                              `Hello ${order.customer.name}, regarding your ${order.type} (ID: ${order.orderId}) at NUR SHOP BD:`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 transition"
                            title="Chat with customer on WhatsApp"
                          >
                            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                            </svg>
                          </a>
                        </div>
                        {order.customer.address && (
                          <span className="text-[10.5px] text-mist line-clamp-1 mt-0.5">
                            {order.customer.address}
                          </span>
                        )}
                      </td>

                      {/* Qty & Amount */}
                      <td className="py-3 px-3.5 align-top text-right whitespace-nowrap">
                        <span className="font-semibold text-navy block">{order.quantity} unit{order.quantity > 1 ? "s" : ""}</span>
                        {order.totalPrice !== undefined && order.totalPrice > 0 ? (
                          <span className="font-display font-extrabold text-navy text-sm">
                            ৳ {Math.round(order.totalPrice).toLocaleString("en-US")}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                            Price Quote
                          </span>
                        )}
                      </td>

                      {/* Status Selector */}
                      <td className="py-3 px-3.5 align-top whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value as OrderStatus)}
                          disabled={updatingStatus}
                          className={`rounded border px-2 py-1 text-[11px] font-bold focus:outline-hidden cursor-pointer ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {ALL_STATUSES.map((st) => (
                            <option key={st} value={st} className="bg-white text-navy font-normal">
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openDetailModal(order)}
                            className="rounded bg-paper hover:bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-navy transition"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(order._id, order.orderId)}
                            className="rounded p-1 text-mist hover:bg-red-50 hover:text-red-600 transition"
                            title="Delete order"
                          >
                            <TrashIcon size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 bg-paper/30 text-xs">
            <span className="text-mist">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-line bg-white px-2.5 py-1 font-semibold text-navy hover:bg-paper disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded border border-line bg-white px-2.5 py-1 font-semibold text-navy hover:bg-paper disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy/70 backdrop-blur-xs overflow-y-auto">
          <div
            className="relative w-full max-w-2xl bg-white rounded-[3px] shadow-2xl border border-line overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-navy text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-orange text-base">
                  {selectedOrder.orderId}
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    selectedOrder.type === "ORDER" ? "bg-blue-100 text-blue-800" : "bg-orange/20 text-orange"
                  }`}
                >
                  {selectedOrder.type}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded transition hover:bg-white/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Product Overview Box */}
              <div className="p-3.5 bg-paper rounded-[2px] border border-line flex items-start gap-4">
                {selectedOrder.product.image && (
                  <div className="relative w-16 h-16 rounded bg-white shrink-0 overflow-hidden border border-line">
                    <Img
                      src={selectedOrder.product.image}
                      alt={selectedOrder.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-orange uppercase tracking-wider block">
                    {selectedOrder.product.categoryName || "Product"}
                  </span>
                  <h3 className="font-bold text-navy text-sm sm:text-base leading-snug">
                    {selectedOrder.product.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-mist">
                    {selectedOrder.product.sku && (
                      <span className="font-mono">SKU: {selectedOrder.product.sku}</span>
                    )}
                    <span>Quantity: <strong className="text-navy">{selectedOrder.quantity}</strong></span>
                    {selectedOrder.unitPrice ? (
                      <span>Unit: <strong className="text-navy">৳ {Math.round(selectedOrder.unitPrice).toLocaleString("en-US")}</strong></span>
                    ) : null}
                    {selectedOrder.totalPrice ? (
                      <span>Total: <strong className="text-orange text-sm">৳ {Math.round(selectedOrder.totalPrice).toLocaleString("en-US")}</strong></span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Grid: Customer Info & Status Management */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Details */}
                <div className="rounded border border-line p-3.5 space-y-2 bg-white text-xs">
                  <h4 className="font-bold text-navy uppercase text-[11px] tracking-wider border-b border-line pb-1.5">
                    Customer Information
                  </h4>
                  <div>
                    <span className="text-mist block text-[10.5px]">Name:</span>
                    <span className="font-semibold text-navy text-sm">{selectedOrder.customer.name}</span>
                  </div>
                  <div>
                    <span className="text-mist block text-[10.5px]">Phone:</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${selectedOrder.customer.phone}`}
                        className="font-semibold text-navy hover:text-orange transition text-sm"
                      >
                        {selectedOrder.customer.phone}
                      </a>
                      <a
                        href={`https://wa.me/${selectedOrder.customer.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                          `Hello ${selectedOrder.customer.name}, this is NUR SHOP BD regarding your ${selectedOrder.type} (ID: ${selectedOrder.orderId}).`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded hover:bg-emerald-100 transition"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                  {selectedOrder.customer.email && (
                    <div>
                      <span className="text-mist block text-[10.5px]">Email:</span>
                      <a
                        href={`mailto:${selectedOrder.customer.email}`}
                        className="text-navy hover:underline"
                      >
                        {selectedOrder.customer.email}
                      </a>
                    </div>
                  )}
                  {selectedOrder.customer.address && (
                    <div>
                      <span className="text-mist block text-[10.5px]">Delivery Address:</span>
                      <span className="text-navy leading-relaxed">{selectedOrder.customer.address}</span>
                    </div>
                  )}
                </div>

                {/* Status & Processing */}
                <div className="rounded border border-line p-3.5 space-y-3 bg-white text-xs">
                  <h4 className="font-bold text-navy uppercase text-[11px] tracking-wider border-b border-line pb-1.5">
                    Order Status & Dates
                  </h4>
                  <div>
                    <span className="text-mist block text-[10.5px] mb-1">Current Status:</span>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value as OrderStatus)}
                      disabled={updatingStatus}
                      className={`w-full rounded border px-3 py-1.5 text-xs font-bold focus:outline-hidden ${getStatusBadge(
                        selectedOrder.status
                      )}`}
                    >
                      {ALL_STATUSES.map((st) => (
                        <option key={st} value={st} className="bg-white text-navy font-normal">
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-mist block text-[10.5px]">Received Date:</span>
                    <span className="text-navy font-medium">
                      {new Date(selectedOrder.createdAt).toLocaleString("en-GB")}
                    </span>
                  </div>
                  <div>
                    <span className="text-mist block text-[10.5px]">Last Updated:</span>
                    <span className="text-navy font-medium">
                      {new Date(selectedOrder.updatedAt).toLocaleString("en-GB")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Note */}
              {selectedOrder.note && (
                <div className="rounded border border-amber-200 bg-amber-50/50 p-3 text-xs">
                  <span className="font-bold text-amber-900 uppercase text-[10.5px] tracking-wider block mb-1">
                    Customer Note / Special Instructions:
                  </span>
                  <p className="text-amber-950 leading-relaxed whitespace-pre-wrap">
                    {selectedOrder.note}
                  </p>
                </div>
              )}

              {/* Admin Internal Notes */}
              <div className="rounded border border-line p-3.5 space-y-2 bg-paper/50 text-xs">
                <label className="font-bold text-navy uppercase text-[11px] tracking-wider block">
                  Admin Internal Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Record customer communication, courier tracking number, price offered, or part substitution notes..."
                  value={adminNoteEdit}
                  onChange={(e) => setAdminNoteEdit(e.target.value)}
                  className="w-full rounded border border-line bg-white p-2.5 text-xs text-navy focus:border-orange focus:outline-hidden resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSaveAdminNote(selectedOrder._id)}
                    disabled={updatingStatus}
                    className="rounded bg-navy hover:bg-[#143049] text-white px-3.5 py-1.5 font-bold uppercase text-[10.5px] tracking-wider transition disabled:opacity-50"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-line px-5 py-3.5 bg-paper/40 shrink-0">
              <button
                type="button"
                onClick={() => handleDelete(selectedOrder._id, selectedOrder.orderId)}
                className="text-red-600 hover:text-red-700 font-bold text-xs transition inline-flex items-center gap-1.5"
              >
                <TrashIcon size={15} />
                <span>Delete Order</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded bg-navy hover:bg-[#143049] text-white px-4 py-2 font-display text-xs font-bold uppercase tracking-wider transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
