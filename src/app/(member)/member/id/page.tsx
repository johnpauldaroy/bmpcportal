import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, statusTone } from "@/features/member-records/format";
import { getPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import QRCode from "qrcode";

export default async function DigitalIdPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: memberProfile }, { data: membershipId }] = user
    ? await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, member_number, status")
          .eq("id", user.id)
          .single(),
        supabase
          .from("member_profiles")
          .select("*")
          .eq("member_id", user.id)
          .maybeSingle(),
        supabase
          .from("membership_ids")
          .select("*")
          .eq("member_id", user.id)
          .maybeSingle()
      ])
    : [{ data: null }, { data: null }, { data: null }];
  const verificationUrl =
    membershipId?.qr_token
      ? `${getPublicEnv().NEXT_PUBLIC_APP_URL}/api/qr/verify/${membershipId.qr_token}`
      : null;
  const qrDataUrl = verificationUrl
    ? await QRCode.toDataURL(verificationUrl, { margin: 1, width: 240 })
    : null;

  return (
    <>
      <PageHeader
        title="Digital membership ID"
        description="Digital IDs will use signed member data and a QR verification endpoint."
      />
      {profile && membershipId && qrDataUrl ? (
        <section className="grid gap-5 rounded-xl border border-[#d8e1ea] bg-white p-5 shadow-sm md:grid-cols-[1fr_auto]">
          <div>
            <StatusBadge tone={statusTone(membershipId.status)}>{membershipId.status}</StatusBadge>
            <h2 className="mt-4 text-2xl font-semibold text-[#10233f]">
              {profile.full_name}
            </h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-[#344456]">Member number</dt>
                <dd className="mt-1 text-[#5f6c7b]">
                  {profile.member_number ?? "Not set"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[#344456]">Membership date</dt>
                <dd className="mt-1 text-[#5f6c7b]">
                  {formatDate(memberProfile?.membership_date ?? null)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[#344456]">Issued</dt>
                <dd className="mt-1 text-[#5f6c7b]">{formatDate(membershipId.issued_at)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#344456]">Verification token</dt>
                <dd className="mt-1 font-mono text-xs text-[#5f6c7b]">
                  {membershipId.qr_token.slice(0, 12)}...
                </dd>
              </div>
            </dl>
          </div>
          <div className="rounded-xl border border-[#e1e8ef] bg-[#f8fafc] p-4 text-center">
            {/* Data URL is generated server-side for the member's private QR token. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Membership verification QR code"
              className="mx-auto size-60"
              src={qrDataUrl}
            />
            <p className="mt-2 text-xs text-[#5f6c7b]">
              Scan to verify issued membership status.
            </p>
          </div>
        </section>
      ) : (
        <EmptyState
          title="Digital ID pending"
          text="Your digital membership ID will appear after profile verification."
        />
      )}
    </>
  );
}
