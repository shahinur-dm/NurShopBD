"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Img } from "@/components/Img";
import { useSite } from "@/components/SiteProvider";

export type OrderModalType = "ORDER" | "PRICE REQUEST";

export interface OrderModalProduct {
  _id?: unknown;
  name: string;
  slug: string;
  sku?: string;
  image?: string;
  price?: number;
  category?: { name?: string } | string;
}

interface OrderModalContextValue {
  openOrderModal: (product: OrderModalProduct, type?: OrderModalType) => void;
  closeOrderModal: () => void;
}

const OrderModalContext = createContext<OrderModalContextValue | null>(null);

export function useOrderModal() {
  const ctx = useContext(OrderModalContext);
  if (!ctx) {
    throw new Error("useOrderModal must be used within an OrderModalProvider");
  }
  return ctx;
}

export function OrderModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [product, setProduct] = useState<OrderModalProduct | null>(null);
  const [type, setType] = useState<OrderModalType>("ORDER");

  const openOrderModal = useCallback(
    (targetProduct: OrderModalProduct, targetType?: OrderModalType) => {
      const hasPrice =
        targetProduct.price !== undefined &&
        targetProduct.price !== null &&
        !isNaN(Number(targetProduct.price)) &&
        Number(targetProduct.price) > 0;

      const determinedType =
        targetType || (hasPrice ? "ORDER" : "PRICE REQUEST");

      setProduct(targetProduct);
      setType(determinedType);
      setIsOpen(true);
    },
    []
  );

  const closeOrderModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <OrderModalContext.Provider value={{ openOrderModal, closeOrderModal }}>
      {children}
      {isOpen && product && (
        <OrderModalView
          product={product}
          type={type}
          onClose={closeOrderModal}
        />
      )}
    </OrderModalContext.Provider>
  );
}

function OrderModalView({
  product,
  type,
  onClose,
}: {
  product: OrderModalProduct;
  type: OrderModalType;
  onClose: () => void;
}) {
  const site = useSite();
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    orderId: string;
    totalPrice?: number;
  } | null>(null);

  const hasPrice =
    product.price !== undefined &&
    product.price !== null &&
    !isNaN(Number(product.price)) &&
    Number(product.price) > 0;

  const unitPrice = hasPrice ? Number(product.price) : 0;
  const totalPrice = unitPrice * quantity;

  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : typeof product.category === "string"
      ? product.category
      : "";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (!phone.trim() || phone.trim().length < 6) {
      setError("Please enter a valid contact phone number");
      return;
    }

    if (type === "ORDER" && !address.trim()) {
      setError("Please enter your delivery address");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          productId: product._id ? String(product._id) : undefined,
          productName: product.name,
          productSlug: product.slug,
          productSku: product.sku,
          productImage: product.image,
          productCategory: categoryName,
          quantity,
          unitPrice: hasPrice ? unitPrice : undefined,
          totalPrice: hasPrice ? totalPrice : undefined,
          customer: {
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim() || undefined,
            address: address.trim() || undefined,
          },
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit request");
      }

      setSuccessData({
        orderId: data.orderId,
        totalPrice: hasPrice ? totalPrice : undefined,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const rawWa = site.social?.whatsapp || site.phone || "+8801805030940";
  const cleanPhone = rawWa.replace(/[^\d]/g, "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy/70 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-white rounded-[3px] shadow-2xl border border-line overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#0b1f33] text-white shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                type === "ORDER" ? "bg-orange" : "bg-emerald-400"
              }`}
            />
            <h2 className="font-display text-base sm:text-lg font-bold tracking-wider uppercase text-white">
              {type === "ORDER" ? "ORDER CONFIRMATION" : "PRICE INQUIRY"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded transition hover:bg-white/10"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {successData ? (
            /* Success Screen */
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-1">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="space-y-1">
                <h3 className="font-display text-xl font-bold uppercase text-navy">
                  {type === "ORDER" ? "Order Placed Successfully!" : "Price Request Submitted!"}
                </h3>
                <p className="text-xs sm:text-sm text-steel">
                  Thank you, <strong className="text-navy">{name}</strong>. Our engineering desk is processing your request.
                </p>
              </div>

              <div className="bg-paper border border-line rounded-[2px] p-3 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-line pb-2">
                  <span className="text-steel font-medium">Order ID:</span>
                  <span className="font-mono font-bold text-orange text-sm">{successData.orderId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-steel font-medium">Product:</span>
                  <span className="font-semibold text-navy truncate max-w-[200px]">{product.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-steel font-medium">Quantity:</span>
                  <span className="font-semibold text-navy">{quantity} unit(s)</span>
                </div>
                {successData.totalPrice !== undefined && (
                  <div className="flex justify-between items-center border-t border-line pt-2">
                    <span className="text-navy font-bold">Total Amount:</span>
                    <span className="font-display font-bold text-navy text-sm">
                      ৳ {Math.round(successData.totalPrice).toLocaleString("en-US")}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500">
                We will contact you shortly via phone (<strong>{phone}</strong>) to confirm dispatch and delivery.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `Hello NUR SHOP BD, I placed a ${type} (ID: ${successData.orderId}) for "${product.name}". Please assist.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1ea952] hover:bg-[#188c43] text-white px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider rounded-[2px] transition"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  <span>Chat on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-navy hover:bg-[#143049] text-white font-display text-xs font-bold uppercase tracking-wider rounded-[2px] transition"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Order Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Info Card */}
              <div className="flex items-start gap-3 p-2.5 bg-paper/70 border border-line rounded-[2px]">
                {product.image ? (
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 bg-white border border-line rounded-[2px] overflow-hidden">
                    <Img
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <div className="flex-1 min-w-0">
                  {categoryName && (
                    <span className="text-[10px] font-bold text-orange uppercase tracking-wider block truncate">
                      {categoryName}
                    </span>
                  )}
                  <h4 className="text-xs sm:text-sm font-bold text-navy leading-snug line-clamp-2">
                    {product.name}
                  </h4>
                  {product.sku && (
                    <span className="text-[10px] text-steel font-mono block mt-0.5">
                      SKU: {product.sku}
                    </span>
                  )}
                  {hasPrice ? (
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="font-display text-sm sm:text-base font-extrabold text-navy">
                        ৳ {Math.round(unitPrice).toLocaleString("en-US")}
                      </span>
                      <span className="text-[10px] text-steel">/ unit</span>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase rounded-[2px]">
                        Price on Quote
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity Picker & Total */}
              <div className="flex items-center justify-between bg-white border border-line p-2.5 rounded-[2px]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-navy">Quantity:</span>
                  <div className="inline-flex items-center border border-line rounded-[2px] overflow-hidden bg-paper">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-2.5 py-1 text-xs font-bold text-navy hover:bg-white transition"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-bold text-navy bg-white min-w-[32px] text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-2.5 py-1 text-xs font-bold text-navy hover:bg-white transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {hasPrice && (
                  <div className="text-right">
                    <span className="text-[10px] text-steel block">Estimated Subtotal:</span>
                    <span className="font-display text-base sm:text-lg font-extrabold text-orange">
                      ৳ {Math.round(totalPrice).toLocaleString("en-US")}
                    </span>
                  </div>
                )}
              </div>

              {/* Customer Form Inputs */}
              <div className="space-y-3 pt-1">
                {/* Full Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Md. Rafiqul Islam"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-line rounded-[2px] focus:border-orange focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 01805030940"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-line rounded-[2px] focus:border-orange focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                    Email Address <span className="text-steel font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. customer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-line rounded-[2px] focus:border-orange focus:outline-hidden"
                  />
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                    {type === "ORDER" ? (
                      <>Delivery Address <span className="text-red-500">*</span></>
                    ) : (
                      <>Delivery Area / Location <span className="text-steel font-normal">(Optional)</span></>
                    )}
                  </label>
                  <input
                    type="text"
                    required={type === "ORDER"}
                    placeholder={
                      type === "ORDER"
                        ? "House, Road, Area, District (e.g. Mirpur-1, Dhaka)"
                        : "e.g. Gazipur Industrial Area / Narayanganj / Dhaka"
                    }
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-line rounded-[2px] focus:border-orange focus:outline-hidden"
                  />
                </div>

                {/* Note / Message */}
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                    Note / Technical Requirements <span className="text-steel font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder={
                      type === "ORDER"
                        ? "Any urgent notes, preferred courier, or coil voltage specs..."
                        : "Tell us required specifications, coil voltage, or power rating..."
                    }
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-line rounded-[2px] focus:border-orange focus:outline-hidden resize-none"
                  />
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-line">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2.5 bg-paper hover:bg-slate-200 text-navy font-display text-xs font-bold uppercase tracking-wider rounded-[2px] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 bg-orange hover:bg-[#e05300] active:scale-98 text-white px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wider rounded-[2px] transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>{type === "ORDER" ? "Confirm Order" : "Submit Price Request"}</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
