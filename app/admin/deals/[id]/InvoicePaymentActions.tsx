"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type InvoicePaymentActionsProps = {
  markAsSent: () => Promise<void>;
  markAsPaid: () => Promise<void>;
  paymentStatus: string;
};

export function InvoicePaymentActions({
  markAsSent,
  markAsPaid,
  paymentStatus
}: InvoicePaymentActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isPaid = paymentStatus === "paid";

  const runAction = (action: () => Promise<void>) => {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => runAction(markAsSent)}
        disabled={isPaid || isPending}
        className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-white/[0.72] transition hover:bg-white/[0.09] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Updating..." : "Mark as sent"}
      </button>
      <button
        onClick={() => runAction(markAsPaid)}
        disabled={isPaid || isPending}
        className="inline-flex min-h-10 items-center justify-center rounded-full bg-neon px-4 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Updating..." : "Mark as paid"}
      </button>
    </div>
  );
}
