"use client";

import { useState, useRef, useEffect } from "react";
import { useOrderModal, type OrderModalProduct } from "@/components/OrderModal";
import { useCart } from "@/components/CartContext";

export interface ExtendedProductDetail extends OrderModalProduct {
  deliveryTime?: string;
  options?: Array<{ name: string; values: string[] }>;
  variants?: Array<{ name: string; sku?: string; price?: number; options?: Record<string, string> }>;
}

export function ProductDetailOrderButton({
  product,
  whatsappPhone,
}: {
  product: ExtendedProductDetail;
  whatsappPhone?: string;
}) {
  const { openOrderModal } = useOrderModal();
  const { addItem, openCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (product.options && product.options.length > 0) {
      product.options.forEach((opt) => {
        if (opt.values && opt.values.length > 0) {
          initial[opt.name] = opt.values[0];
        }
      });
    }
    return initial;
  });
  const [addedToast, setAddedToast] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    }
    if (showShareMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showShareMenu]);

  const hasPrice =
    product.price !== undefined &&
    product.price !== null &&
    !isNaN(Number(product.price)) &&
    Number(product.price) > 0;

  const unitPrice = hasPrice ? Number(product.price) : 0;

  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : typeof product.category === "string"
      ? product.category
      : undefined;

  // Formatted variant string
  const variantString =
    Object.entries(selectedOptions).length > 0
      ? Object.entries(selectedOptions)
          .map(([key, val]) => `${key}: ${val}`)
          .join(", ")
      : undefined;

  function handleAddToCart() {
    addItem({
      productId: product._id ? String(product._id) : undefined,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      image: product.image,
      categoryName,
      variant: variantString,
      selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
      unitPrice,
      quantity,
      deliveryTime: product.deliveryTime || "2–3 Working Days",
    });

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  }

  function handleOrderNow() {
    addItem({
      productId: product._id ? String(product._id) : undefined,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      image: product.image,
      categoryName,
      variant: variantString,
      selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
      unitPrice,
      quantity,
      deliveryTime: product.deliveryTime || "2–3 Working Days",
    });

    openCart();
  }

  function handleAskPrice() {
    openOrderModal(
      {
        ...product,
        variant: variantString,
      } as OrderModalProduct,
      "PRICE REQUEST"
    );
  }

  function getProductUrl() {
    if (typeof window !== "undefined" && window.location.href) {
      return window.location.href;
    }
    return `https://nurshopbd.net/products/${product.slug}`;
  }

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const currentUrl = getProductUrl();
    const shareData = {
      title: `${product.name} | NUR SHOP BD`,
      text: `${product.name} - Machine, spare parts & industrial automation at NUR SHOP BD`,
      url: currentUrl,
    };

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      (!navigator.canShare || navigator.canShare(shareData))
    ) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: unknown) {
        if (err && typeof err === "object" && "name" in err && err.name === "AbortError") {
          return;
        }
      }
    }

    setShowShareMenu((prev) => !prev);
  }

  function handleCopyLink() {
    const currentUrl = getProductUrl();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
      setShowShareMenu(false);
    }
  }

  const phone = (whatsappPhone || "+8801713798987").replace(/[^\d]/g, "");
  const whatsappHref = `https://wa.me/${phone}?text=${encodeURIComponent(
    `Hello, I want to ask the price for ${product.name} (SKU: ${product.sku || product.slug}).`
  )}`;

  return (
    <div className="w-full space-y-3.5">
      {/* Product Option / Variant Selector (if options exist) */}
      {product.options && product.options.length > 0 && (
        <div className="space-y-2.5 p-3 bg-paper/50 border border-line rounded-[2px]">
          {product.options.map((opt) => (
            <div key={opt.name} className="space-y-1.5">
              <span className="text-[11px] font-bold text-navy uppercase tracking-wider block">
                {opt.name}: <span className="text-orange font-semibold">{selectedOptions[opt.name] || opt.values[0]}</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {opt.values.map((val) => {
                  const isSelected = (selectedOptions[opt.name] || opt.values[0]) === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        setSelectedOptions((prev) => ({ ...prev, [opt.name]: val }))
                      }
                      className={`px-2.5 py-1 text-xs font-semibold rounded-[2px] border transition cursor-pointer ${
                        isSelected
                          ? "bg-navy text-white border-navy shadow-2xs"
                          : "bg-white text-navy border-line hover:border-orange hover:text-orange"
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons Row: Quantity -> ASK PRICE -> WhatsApp -> Share */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {/* 1. Quantity Controls */}
        <div className="inline-flex items-center border border-line rounded-[2px] bg-paper overflow-hidden h-10 sm:h-11">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 text-sm font-bold text-navy hover:bg-white transition h-full cursor-pointer"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="px-3.5 font-bold text-navy text-xs sm:text-sm bg-white min-w-[36px] text-center flex items-center justify-center h-full">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="px-3 text-sm font-bold text-navy hover:bg-white transition h-full cursor-pointer"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {/* 2. ASK PRICE (or ADD TO CART / ORDER NOW if price exists) */}
        {hasPrice ? (
          <>
            <button
              type="button"
              onClick={handleAddToCart}
              className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-[#143049] active:scale-98 text-white px-5 sm:px-6 h-10 sm:h-11 font-display text-xs sm:text-sm font-bold uppercase tracking-wider rounded-[2px] transition shadow-xs flex-1 sm:flex-none cursor-pointer"
              title={`Add ${product.name} to cart`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 fill-none stroke-current shrink-0"
                strokeWidth="2.2"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span>{addedToast ? "ADDED TO CART!" : "ADD TO CART"}</span>
            </button>

            <button
              type="button"
              onClick={handleOrderNow}
              className="inline-flex items-center justify-center gap-2 bg-[#ea580c] hover:bg-[#c2410c] active:scale-98 text-white px-5 sm:px-6 h-10 sm:h-11 font-display text-xs sm:text-sm font-bold uppercase tracking-wider rounded-[2px] transition shadow-xs flex-1 sm:flex-none cursor-pointer"
              title={`Order ${product.name} now`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 fill-none stroke-current shrink-0"
                strokeWidth="2.2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>ORDER NOW</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleAskPrice}
            className="inline-flex items-center justify-center gap-2 bg-[#ea580c] hover:bg-[#c2410c] active:scale-98 text-white px-5 sm:px-6 h-10 sm:h-11 font-display text-xs sm:text-sm font-bold uppercase tracking-wider rounded-[2px] transition shadow-xs flex-1 sm:flex-none cursor-pointer"
            title={`Ask price for ${product.name}`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-none stroke-current shrink-0"
              strokeWidth="2.2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>ASK PRICE</span>
          </button>
        )}

        {/* 3. WhatsApp Button */}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-[#1ea952] hover:bg-[#188c43] active:scale-98 text-white px-4 sm:px-5 h-10 sm:h-11 font-display text-xs sm:text-sm font-bold uppercase tracking-wider rounded-[2px] transition shadow-xs flex-1 sm:flex-none cursor-pointer text-center"
          title={`Ask on WhatsApp for ${product.name}`}
        >
          <svg className="h-4 w-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          <span>WHATSAPP</span>
        </a>

        {/* 4. Share Icon Button */}
        <div className="relative">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 active:scale-98 text-navy border border-line hover:border-orange px-3.5 sm:px-4 h-10 sm:h-11 font-display text-xs sm:text-sm font-bold uppercase tracking-wider rounded-[2px] transition shadow-2xs cursor-pointer"
            title="Share this product"
            aria-label="Share product"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-none stroke-current shrink-0"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span className="hidden sm:inline">SHARE</span>
          </button>

          {/* Share Fallback Dropdown */}
          {showShareMenu && (
            <div
              ref={shareMenuRef}
              className="absolute right-0 bottom-full mb-2 z-50 w-56 rounded-[3px] bg-white p-2 shadow-lg border border-slate-200 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1 border-b border-slate-100 mb-1">
                Share Product
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-navy rounded flex items-center gap-2 cursor-pointer"
              >
                <svg className="h-3.5 w-3.5 stroke-current fill-none shrink-0" strokeWidth="2" viewBox="0 0 24 24">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                <span>Copy product link</span>
              </button>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `${product.name}\n${getProductUrl()}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowShareMenu(false)}
                className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1ea952] rounded flex items-center gap-2 cursor-pointer"
              >
                <svg className="h-3.5 w-3.5 fill-[#1ea952] shrink-0" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span>Share via WhatsApp</span>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  getProductUrl()
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowShareMenu(false)}
                className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1877f2] rounded flex items-center gap-2 cursor-pointer"
              >
                <svg className="h-3.5 w-3.5 fill-[#1877f2] shrink-0" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Share via Facebook</span>
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(
                  getProductUrl()
                )}&text=${encodeURIComponent(product.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowShareMenu(false)}
                className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#229ed9] rounded flex items-center gap-2 cursor-pointer"
              >
                <svg className="h-3.5 w-3.5 fill-[#229ed9] shrink-0" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.941z" />
                </svg>
                <span>Share via Telegram</span>
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(
                  product.name
                )}&body=${encodeURIComponent(
                  `Check out this product from NUR SHOP BD:\n${product.name}\n${getProductUrl()}`
                )}`}
                onClick={() => setShowShareMenu(false)}
                className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-navy rounded flex items-center gap-2 cursor-pointer"
              >
                <svg className="h-3.5 w-3.5 stroke-current fill-none shrink-0" strokeWidth="2" viewBox="0 0 24 24">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span>Share via Email</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {shareToast && (
        <div className="p-2 rounded bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800 flex items-center justify-between animate-in fade-in duration-150">
          <span>✓ Product link copied to clipboard!</span>
        </div>
      )}

      {addedToast && (
        <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between animate-in fade-in duration-150">
          <span>✓ Added to cart ({quantity} unit{quantity > 1 ? "s" : ""}).</span>
          <button
            type="button"
            onClick={openCart}
            className="underline font-bold hover:text-emerald-950 cursor-pointer ml-2"
          >
            View Cart & Checkout →
          </button>
        </div>
      )}
    </div>
  );
}

