import { redirect } from "next/navigation";

/** Shopping list is paused — keep URL friendly by sending traffic to the calculator. */
export default function ShoppingListPage() {
  redirect("/");
}
