import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma, ReviewStatus } from "@prisma/client";
import { Check, Star, X } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Stars } from "@/components/ui/stars";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { approveReviewAction, deleteReviewAction, rejectReviewAction } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Reviews" };

const PAGE_SIZE = 20;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.ReviewWhereInput = status ? { status: status as ReviewStatus } : {};
  const [reviews, total, grouped] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { product: { select: { name: true, slug: true } }, user: { select: { name: true, email: true } } },
    }),
    prisma.review.count({ where }),
    prisma.review.groupBy({ by: ["status"], _count: { status: true } }),
  ]);

  const counts = Object.fromEntries(grouped.map((row) => [row.status, row._count.status]));
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Community</p>
          <h1 className="display mt-1 text-3xl font-semibold">Reviews</h1>
          <p className="mt-1 text-sm text-muted">Customer reviews appear on product pages after approval.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/reviews" className={`btn-sm ${!status ? "btn-primary" : "btn-outline"}`}>All ({grouped.reduce((sum, row) => sum + row._count.status, 0)})</Link>
          <Link href="/admin/reviews?status=PENDING" className={`btn-sm ${status === "PENDING" ? "btn-primary" : "btn-outline"}`}>Pending ({counts.PENDING ?? 0})</Link>
          <Link href="/admin/reviews?status=APPROVED" className={`btn-sm ${status === "APPROVED" ? "btn-primary" : "btn-outline"}`}>Approved ({counts.APPROVED ?? 0})</Link>
          <Link href="/admin/reviews?status=REJECTED" className={`btn-sm ${status === "REJECTED" ? "btn-primary" : "btn-outline"}`}>Rejected ({counts.REJECTED ?? 0})</Link>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <article key={review.id} className="rounded-2xl border border-sand bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Stars rating={review.rating} />
                  <StatusBadge status={review.status} kind="review" />
                </div>
                <h2 className="mt-2 font-semibold">{review.title || "Untitled review"}</h2>
                <p className="text-[11px] text-muted">
                  {review.user.name} · {review.user.email} · {formatDate(review.createdAt)}
                </p>
              </div>
              <Link href={`/products/${review.product.slug}#reviews`} target="_blank" className="text-xs font-semibold text-brand hover:underline">
                {review.product.name}
              </Link>
            </div>
            <p className="mt-3 max-w-3xl whitespace-pre-line text-sm text-muted">{review.body}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {review.status !== "APPROVED" && (
                <form action={approveReviewAction}>
                  <input type="hidden" name="id" value={review.id} />
                  <button type="submit" className="btn-primary btn-sm"><Check className="h-3.5 w-3.5" /> Approve</button>
                </form>
              )}
              {review.status !== "REJECTED" && (
                <form action={rejectReviewAction}>
                  <input type="hidden" name="id" value={review.id} />
                  <button type="submit" className="btn-outline btn-sm"><X className="h-3.5 w-3.5" /> Reject</button>
                </form>
              )}
              <form action={deleteReviewAction}>
                <input type="hidden" name="id" value={review.id} />
                <ConfirmButton
                  label="Delete"
                  message="Delete this review permanently?"
                  className="btn-outline btn-sm border-rose-200 text-rose-700 hover:bg-rose-50"
                />
              </form>
            </div>
          </article>
        ))}
        {reviews.length === 0 && (
          <div className="rounded-2xl border border-dashed border-sand bg-white py-14 text-center">
            <Star className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-2 text-sm text-muted">No reviews in this view.</p>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-muted">Page {page} of {pages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin/reviews?${status ? `status=${status}&` : ""}page=${page - 1}`} className="btn-outline btn-sm">Previous</Link>}
            {page < pages && <Link href={`/admin/reviews?${status ? `status=${status}&` : ""}page=${page + 1}`} className="btn-outline btn-sm">Next</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
