import { redirect } from "next/navigation";

// 2FA-Setup gibt es nicht mehr — Email-2FA ist für alle Admins automatisch aktiv.
export default function TwoFaSettingsRedirect() {
  redirect("/admin/einstellungen");
}
