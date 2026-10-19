import "server-only";
import { toCartProducts, type CartProduct } from "@/components/cart/cart-types";
import { getCategories, getPublishedProducts } from "./catalog";

/** Product data for the browser cart (no descriptions or attributes, to keep the payload small). */
export async function getCartProducts(): Promise<CartProduct[]> {
  const [products, categories] = await Promise.all([getPublishedProducts(), getCategories()]);
  const categoryNames = new Map(categories.map((category) => [category.id, category.shortName]));
  return products.flatMap((product) => toCartProducts(product, categoryNames.get(product.categoryId) ?? ""));
}
