"use client";

import { useOrderModal, type OrderModalProduct } from "@/components/OrderModal";

export function ProductDetailOrderButton({
  product,
}: {
  product: OrderModalProduct;
}) {
  const { openOrderModal } = useOrderModal();

  const hasPrice =
    product.price !== undefined &&
    product.price !== null &&
    !isNaN(Number(product.price)) &&
    Number(product.price) > 0;

  return (
    <button
      type="button"
      onClick={() => openOrderModal(product, hasPrice ? "ORDER" : "PRICE REQUEST")}
      className="inline-flex items-center justify-center gap-2 bg-[#ea580c] hover:bg-[#c2410c] active:scale-98 text-white px-6 py-2.5 sm:py-3 font-display text-xs sm:text-sm font-bold uppercase tracking-wider rounded-[2px] transition shadow-xs flex-1 sm:flex-none text-center cursor-pointer"
      title={hasPrice ? `Order ${product.name} now` : `Ask price for ${product.name}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 fill-none stroke-current"
        strokeWidth="2.2"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <span>{hasPrice ? "ORDER NOW" : "ASK PRICE"}</span>
    </button>
  );
}
