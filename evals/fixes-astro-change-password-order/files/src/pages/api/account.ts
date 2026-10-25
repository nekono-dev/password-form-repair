import type { APIRoute } from "astro";
import { updateAccount, verifyPassword } from "../../lib/accounts";

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const account = locals.account;
  if (!account) return redirect("/login");
  const form = await request.formData();
  const currentPassword = String(form.get("currentPassword") ?? "");
  const newUsername = String(form.get("newUsername") ?? "").trim();
  const newPassword = String(form.get("newPassword") ?? "");
  const newPasswordConfirm = String(form.get("newPasswordConfirm") ?? "");

  if (!(await verifyPassword(account.username, currentPassword))) return redirect("/account?status=ng");
  if (newPassword && newPassword !== newPasswordConfirm) return redirect("/account?status=ng");

  await updateAccount(account.username, {
    ...(newUsername ? { username: newUsername } : {}),
    ...(newPassword ? { password: newPassword } : {}),
  });
  return redirect("/account?status=ok");
};
