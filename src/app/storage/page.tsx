import type { Metadata } from "next";
import { StorageTracker } from "@/components/StorageTracker";

export const metadata: Metadata = {
  title: "Storage | Palcraft",
  description: "Track owned raw materials and crafted intermediates for Palworld 1.0.",
};

export default function StoragePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Storage</h1>
        <p className="text-muted-foreground">
          Log the raws and crafted intermediates you have on hand. The calculator stays focused on
          what a craft still needs.
        </p>
      </div>
      <StorageTracker />
    </div>
  );
}
