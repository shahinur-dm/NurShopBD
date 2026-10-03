"use client";

import { useState } from "react";
import { useOrderModal, type OrderModalProduct } from "@/components/OrderModal";
import { useCart } from "@/components/CartContext";

export interface ExtendedProductDetail extends OrderModalProduct {
  deliveryTime?: string;
  options?: Array<{ name: string; values: string[] }>;
  variants?: Array<{ name: string; sku?: string; price?: number; options?: Record<string, string> }>;
}

export function ProductDetailOrderButton({
  product,
}: {
  product: ExtendedProductDetail;
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

      {/* Quantity Picker & Add to Cart / Order Now / Ask Price Action Area */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Quantity Controls */}
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

        {hasPrice ? (
          <>
            {/* ADD TO CART Button */}
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

            {/* ORDER NOW Button (Direct Checkout) */}
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
          /* ASK PRICE Button */
          <button
            type="button"
            onClick={handleAskPrice}
            className="inline-flex items-center justify-center gap-2 bg-[#ea580c] hover:bg-[#c2410c] active:scale-98 text-white px-6 h-10 sm:h-11 font-display text-xs sm:text-sm font-bold uppercase tracking-wider rounded-[2px] transition shadow-xs flex-1 sm:flex-none cursor-pointer"
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
      </div>

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
