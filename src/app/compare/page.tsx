import { redirect } from "next/navigation";

/** Compare is paused — keep URL friendly by sending traffic to the calculator. */
export default function ComparePage() {
  redirect("/");
}
