import { createClient } from "@supabase/supabase-js";

function adminClient() {
  const url = process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SECRET_KEY ?? "";
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY required");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function createTestUser(email: string, password: string): Promise<void> {
  const { error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error && error.message !== "User already registered") throw error;
}

export async function deleteTestUser(email: string): Promise<void> {
  const admin = adminClient();
  const {
    data: { users },
  } = await admin.auth.admin.listUsers();
  const user = users.find((u) => u.email === email);
  if (user) await admin.auth.admin.deleteUser(user.id);
}
