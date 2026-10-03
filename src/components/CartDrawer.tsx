"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Img } from "@/components/Img";
import { useCart, type DeliveryLocationType } from "@/components/CartContext";
import { useSite } from "@/components/SiteProvider";

export function CartDrawer() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
    subtotal,
    deliveryLocation,
    setDeliveryLocation,
    deliveryCharge,
    grandTotal,
    isCartOpen,
    closeCart,
  } = useCart();

  const site = useSite();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<{
    orderId: string;
    itemsCount: number;
    subtotal: number;
    deliveryCharge: number;
    grandTotal: number;
    customerName: string;
  } | null>(null);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    if (isCartOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen, closeCart]);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Your cart is empty. Please add items before placing an order.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    const cleanPhone = phone.trim().replace(/[^\d+]/g, "");
    if (!cleanPhone || cleanPhone.length < 6) {
      setError("Please enter a valid phone number (e.g. 01805030940).");
      return;
    }

    if (!address.trim()) {
      setError("Please enter your complete delivery address.");
      return;
    }

    setSubmitting(true);

    try {
      const orderPayload = {
        type: "ORDER",
        deliveryLocation,
        deliveryCharge,
        subtotal,
        grandTotal,
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim(),
          deliveryLocation,
        },
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          slug: item.slug,
          sku: item.sku,
          image: item.image,
          categoryName: item.categoryName,
          variant: item.variant,
          selectedOptions: item.selectedOptions,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
          deliveryTime: item.deliveryTime,
        })),
        note: note.trim() || undefined,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to place order.");
      }

      setSuccessOrder({
        orderId: data.orderId,
        itemsCount: items.length,
        subtotal,
        deliveryCharge,
        grandTotal,
        customerName: name.trim(),
      });

      clearCart();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isCartOpen) return null;

  const rawWa = site.social?.whatsapp || site.phone || "+8801805030940";
  const cleanWaPhone = rawWa.replace(/[^\d]/g, "");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy/70 backdrop-blur-xs transition-opacity duration-300">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={() => {
          if (successOrder) setSuccessOrder(null);
          closeCart();
        }}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div
        className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl border-l border-line animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-line bg-navy px-4 sm:px-5 py-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <svg
              className="h-5 w-5 text-orange shrink-0 stroke-current fill-none"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <h2 className="font-display text-base sm:text-lg font-bold uppercase tracking-wider text-white">
              Shopping Cart ({totalItems} {totalItems === 1 ? "Item" : "Items"})
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              if (successOrder) setSuccessOrder(null);
              closeCart();
            }}
            className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white transition"
            aria-label="Close cart"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {successOrder ? (
            /* Order Success State */
            <div className="py-6 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-1">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="space-y-1">
                <h3 className="font-display text-xl font-bold uppercase text-navy">
                  Order Placed Successfully!
                </h3>
                <p className="text-xs sm:text-sm text-steel">
                  Thank you, <strong className="text-navy">{successOrder.customerName}</strong>. Your order containing {successOrder.itemsCount} {successOrder.itemsCount === 1 ? "product" : "products"} is received.
                </p>
              </div>

              <div className="rounded-[2px] bg-paper border border-line p-4 text-left space-y-2.5 text-xs">
                <div className="flex justify-between items-center border-b border-line pb-2">
                  <span className="text-steel font-medium">Order ID:</span>
                  <span className="font-mono font-bold text-orange text-sm">{successOrder.orderId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-steel font-medium">Subtotal:</span>
                  <span className="font-semibold text-navy">
                    ৳ {Math.round(successOrder.subtotal).toLocaleString("en-US")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-steel font-medium">Delivery Charge:</span>
                  <span className="font-semibold text-navy">
                    ৳ {Math.round(successOrder.deliveryCharge).toLocaleString("en-US")}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-line pt-2 text-navy">
                  <span className="font-bold text-sm">Grand Total:</span>
                  <span className="font-display font-bold text-orange text-base sm:text-lg">
                    ৳ {Math.round(successOrder.grandTotal).toLocaleString("en-US")}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                We will contact you shortly via phone to confirm your delivery dispatch.
              </p>

              <div className="pt-2 flex flex-col gap-2.5">
                <a
                  href={`https://wa.me/${cleanWaPhone}?text=${encodeURIComponent(
                    `Hello NUR SHOP BD, I placed Order ${successOrder.orderId} for ${successOrder.itemsCount} product(s), Grand Total: ৳${Math.round(successOrder.grandTotal).toLocaleString("en-US")}. Please assist.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#1ea952] hover:bg-[#188c43] text-white px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider rounded-[2px] transition"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  <span>Chat on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessOrder(null);
                    closeCart();
                  }}
                  className="w-full bg-navy hover:bg-[#143049] text-white px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider rounded-[2px] transition"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            /* Empty Cart State */
            <div className="py-12 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-paper text-mist mb-1">
                <svg
                  className="h-7 w-7 stroke-current fill-none"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-bold uppercase text-navy">
                Your Cart is Empty
              </h3>
              <p className="text-xs text-mist max-w-xs mx-auto">
                Explore our engineering catalogue, add machine parts, select variants and place your order.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={closeCart}
                  className="bg-navy hover:bg-orange text-white px-5 py-2 font-display text-xs font-bold uppercase tracking-wider rounded-[2px] transition"
                >
                  Start Browsing
                </button>
              </div>
            </div>
          ) : (
            /* Multi-Product Items List & Checkout Form */
            <div className="space-y-4">
              {/* Product Line Items */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-line">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-mist">
                    Selected Items ({items.length})
                  </span>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-[10.5px] font-semibold text-red-600 hover:text-red-700 hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2 max-h-[220px] sm:max-h-[260px] overflow-y-auto pr-1">
                  {items.map((item) => {
                    const lineTotal = item.unitPrice * item.quantity;
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-2.5 p-2.5 bg-paper/60 border border-line rounded-[2px] hover:border-orange/40 transition"
                      >
                        {item.image && (
                          <div className="relative w-12 h-12 rounded bg-white shrink-0 overflow-hidden border border-line">
                            <Img
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${item.slug}`}
                            onClick={closeCart}
                            className="font-bold text-navy hover:text-orange transition text-xs line-clamp-1 leading-tight"
                            title={item.name}
                          >
                            {item.name}
                          </Link>

                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px] text-steel">
                            {item.sku && <span className="font-mono">SKU: {item.sku}</span>}
                            {item.variant && (
                              <span className="inline-block bg-orange/10 text-orange font-semibold px-1.5 py-0.2 rounded text-[9.5px]">
                                {item.variant}
                              </span>
                            )}
                            {item.deliveryTime && (
                              <span className="text-emerald-700 font-medium">
                                🕒 {item.deliveryTime}
                              </span>
                            )}
                          </div>

                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            {/* Quantity Controls */}
                            <div className="inline-flex items-center border border-line rounded-[2px] bg-white overflow-hidden text-xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="px-2 py-0.5 text-navy hover:bg-paper font-bold transition"
                                title="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="px-2.5 py-0.5 font-bold text-navy text-[11px] min-w-[24px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="px-2 py-0.5 text-navy hover:bg-paper font-bold transition"
                                title="Increase quantity"
                              >
                                +
                              </button>
                            </div>

                            {/* Item Price */}
                            <div className="text-right">
                              <span className="font-display font-extrabold text-navy text-xs sm:text-sm">
                                ৳ {Math.round(lineTotal).toLocaleString("en-US")}
                              </span>
                              {item.quantity > 1 && (
                                <span className="block text-[9.5px] text-steel">
                                  ৳{Math.round(item.unitPrice).toLocaleString("en-US")} each
                                </span>
                              )}
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-mist hover:text-red-600 p-1 transition"
                              title="Remove product"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Location Selector */}
              <div className="rounded-[2px] bg-white border border-line p-3 space-y-2">
                <span className="block text-xs font-bold text-navy uppercase tracking-wider">
                  Select Delivery Location <span className="text-red-500">*</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryLocation("Dhaka")}
                    className={`flex flex-col items-start p-2.5 rounded-[2px] border text-left transition cursor-pointer ${
                      deliveryLocation === "Dhaka"
                        ? "border-orange bg-orange/5 text-navy font-bold ring-1 ring-orange"
                        : "border-line bg-paper/40 text-steel hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full justify-between">
                      <span className="text-xs font-bold text-navy">Inside Dhaka</span>
                      <span className="font-display font-extrabold text-orange text-xs">৳ 90</span>
                    </div>
                    <span className="text-[10px] text-mist mt-0.5">Standard 1–2 Days</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryLocation("Outside Dhaka")}
                    className={`flex flex-col items-start p-2.5 rounded-[2px] border text-left transition cursor-pointer ${
                      deliveryLocation === "Outside Dhaka"
                        ? "border-orange bg-orange/5 text-navy font-bold ring-1 ring-orange"
                        : "border-line bg-paper/40 text-steel hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full justify-between">
                      <span className="text-xs font-bold text-navy">Outside Dhaka</span>
                      <span className="font-display font-extrabold text-orange text-xs">৳ 120</span>
                    </div>
                    <span className="text-[10px] text-mist mt-0.5">Nationwide 2–4 Days</span>
                  </button>
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="rounded-[2px] bg-paper border border-line p-3 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-steel">
                  <span>Subtotal ({totalItems} items):</span>
                  <span className="font-bold text-navy">
                    ৳ {Math.round(subtotal).toLocaleString("en-US")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-steel">
                  <span>Delivery Charge ({deliveryLocation}):</span>
                  <span className="font-bold text-navy">
                    ৳ {Math.round(deliveryCharge).toLocaleString("en-US")}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-line pt-1.5 text-navy">
                  <span className="font-bold uppercase text-[11.5px]">Grand Total:</span>
                  <span className="font-display font-extrabold text-orange text-base sm:text-lg">
                    ৳ {Math.round(grandTotal).toLocaleString("en-US")}
                  </span>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} className="space-y-3 pt-1">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider border-b border-line pb-1">
                  Customer & Delivery Information
                </h4>

                {/* Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase tracking-wider mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Md. Shahinur Rahman"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-line rounded-[2px] focus:border-orange focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase tracking-wider mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 01805030940"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-line rounded-[2px] focus:border-orange focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="block text-[11px] font-bold text-navy uppercase tracking-wider mb-1">
                    Delivery Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="House, Road, Area, Thana, District"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-line rounded-[2px] focus:border-orange focus:outline-hidden"
                  />
                </div>

                {/* Note / Optional email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase tracking-wider mb-1">
                      Email <span className="text-steel font-normal text-[10px]">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="customer@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-line rounded-[2px] focus:border-orange focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase tracking-wider mb-1">
                      Order Note <span className="text-steel font-normal text-[10px]">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Special delivery notes..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-line rounded-[2px] focus:border-orange focus:outline-hidden"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
                    {error}
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-line">
                  <button
                    type="button"
                    onClick={closeCart}
                    className="px-3.5 py-2.5 bg-paper hover:bg-slate-200 text-navy font-display text-xs font-bold uppercase tracking-wider rounded-[2px] transition"
                  >
                    Continue Shopping
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || items.length === 0}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-orange hover:bg-[#e05300] active:scale-98 text-white px-5 py-2.5 font-display text-xs sm:text-sm font-bold uppercase tracking-wider rounded-[2px] transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <span>Placing Order...</span>
                      </>
                    ) : (
                      <span>
                        Place Order (৳{Math.round(grandTotal).toLocaleString("en-US")})
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
