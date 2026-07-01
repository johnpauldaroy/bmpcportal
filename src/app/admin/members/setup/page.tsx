import { redirect } from "next/navigation";

export const metadata = { title: "Member Setup" };

export default async function MemberSetupPage() {
  redirect("/admin/settings/members");
}
