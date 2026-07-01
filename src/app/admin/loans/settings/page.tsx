import { redirect } from "next/navigation";

export default async function AdminLoanSettingsPage() {
  redirect("/admin/settings/loans");
}
