import { revalidatePath } from "next/cache";
import { invalidateCache, clearAllCache } from "@/lib/cache";

/**
 * Revalidates Next.js cached paths and flushes the in-memory cache
 * so any updates made via the Admin panel are immediately visible.
 */
export function revalidateCatalog(pattern?: string) {
  try {
    invalidateCache(pattern);
  } catch {
    // ignore
  }

  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/services");
    revalidatePath("/about");
    revalidatePath("/contact");
    revalidatePath("/blog");
    revalidatePath("/api/catalog-tree");
    revalidatePath("/api/products");
  } catch {
    // Next.js revalidation outside request context
  }
}

export { invalidateCache, clearAllCache };
