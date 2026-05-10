"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toggleWishlist } from "@/server/actions/wishlist";

export function WishlistButton({
  productId,
  isLoggedIn,
  initialState,
}: {
  productId: string;
  isLoggedIn: boolean;
  initialState: boolean;
}) {
  const [active, setActive] = useState(initialState);
  const [pending, start] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!isLoggedIn) {
      toast.info("Bitte zuerst anmelden");
      router.push("/anmelden");
      return;
    }
    start(async () => {
      const r = await toggleWishlist(productId);
      if (r.ok) {
        setActive(!active);
        toast.success(active ? "Von Wunschliste entfernt" : "Zur Wunschliste hinzugefügt");
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleClick}
      disabled={pending}
      aria-label="Zur Wunschliste"
    >
      <Heart className={active ? "fill-primary text-primary" : ""} />
    </Button>
  );
}
