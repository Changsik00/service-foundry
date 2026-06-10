import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
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
