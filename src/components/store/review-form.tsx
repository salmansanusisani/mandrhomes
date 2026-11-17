"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Loader2, Star } from "lucide-react";
import { submitReviewAction } from "@/app/actions/reviews";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Submit review
    </button>
  );
}

export function ReviewForm({ productId }: { productId: string }) {
  const [state, action] = useActionState(submitReviewAction, null);
  const [rating, setRating] = useState(0);

  if (state?.ok) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <Check className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating || ""} />
      <div>
        <span className="label">Your rating</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="rounded p-0.5"
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
            >
              <Star className={cn("h-7 w-7 transition", value <= rating ? "fill-gold text-gold" : "text-sand-strong hover:text-gold")} />
            </button>
          ))}
        </div>
        {state?.errors?.rating && <p className="mt-1 text-xs text-rose-600">{state.errors.rating}</p>}
      </div>
      <div>
        <label htmlFor="review-title" className="label">Title (optional)</label>
        <input id="review-title" name="title" className="input" placeholder="Sums up your experience" maxLength={90} />
      </div>
      <div>
        <label htmlFor="review-body" className="label">Your review</label>
        <textarea
          id="review-body"
          name="body"
          required
          rows={5}
          className="input resize-y"
          placeholder="What did you like or dislike? How did you use it?"
        />
        {state?.errors?.body && <p className="mt-1 text-xs text-rose-600">{state.errors.body}</p>}
      </div>
      {state?.message && !state.ok && <p className="text-xs text-rose-600">{state.message}</p>}
      <SubmitButton />
    </form>
  );
}
