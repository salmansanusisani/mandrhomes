import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { PasswordForm, ProfileForm } from "@/components/store/account-forms";

export default async function ProfilePage() {
  const user = await requireUser("/account/profile");

  return (
    <div className="space-y-5">
      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Profile details</h2>
        <p className="mt-1 text-xs text-muted">Member since {formatDate(user.createdAt)}</p>
        <div className="mt-5 max-w-lg">
          <ProfileForm name={user.name} phone={user.phone ?? ""} />
          <div className="mt-4">
            <label className="label">Email address</label>
            <input value={user.email} readOnly className="input bg-sand/30 text-muted" />
            <p className="mt-1 text-[11px] text-muted">Contact support if you need to change your email.</p>
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Password</h2>
        <p className="mt-1 text-xs text-muted">Use at least 8 characters and avoid reusing old passwords.</p>
        <div className="mt-5 max-w-lg">
          <PasswordForm />
        </div>
      </section>
    </div>
  );
}
