import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const envFiles = [".env", ".env.local"];

for (const file of envFiles) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) {
    continue;
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match || match[1].startsWith("#")) {
      continue;
    }

    const [, key, rawValue] = match;
    if (process.env[key]) {
      continue;
    }

    process.env[key] = rawValue
      .replace(/^["']|["']$/g, "")
      .replace(/\\n/g, "\n");
  }
}

function normalizeSupabaseUrl(value) {
  if (!value) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  }

  const url = new URL(value);
  url.pathname = url.pathname.replace(/\/rest\/v1\/?$/, "") || "/";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || value.startsWith("your-")) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

const users = [
  {
    role: "admin",
    email: process.env.BMP_ADMIN_EMAIL ?? "admin@barbazampc.coop",
    password: process.env.BMP_ADMIN_PASSWORD ?? "password",
    fullName: process.env.BMP_ADMIN_NAME ?? "BMPC Admin"
  },
  {
    role: "member",
    email: process.env.BMP_MEMBER_EMAIL ?? "member@barbazampc.coop",
    password: process.env.BMP_MEMBER_PASSWORD ?? "password",
    fullName: process.env.BMP_MEMBER_NAME ?? "BMPC Member",
    memberNumber: process.env.BMP_MEMBER_NUMBER ?? "BMPC-0001"
  }
];

let supabase;

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) {
      return found;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function createOrUpdateAuthUser(seedUser) {
  const existing = await findUserByEmail(seedUser.email);
  const attributes = {
    email: seedUser.email,
    password: seedUser.password,
    email_confirm: true,
    user_metadata: {
      full_name: seedUser.fullName,
      role: seedUser.role
    }
  };

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, attributes);
    if (error) {
      throw error;
    }
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser(attributes);
  if (error) {
    throw error;
  }
  return data.user;
}

async function upsertProfile(authUser, seedUser) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: authUser.id,
      email: seedUser.email,
      full_name: seedUser.fullName,
      member_number: seedUser.role === "member" ? seedUser.memberNumber : null,
      role: seedUser.role,
      status: "active"
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }
}

async function upsertMemberRecords(authUser, seedUser) {
  if (seedUser.role !== "member") {
    return;
  }

  const { error: memberProfileError } = await supabase.from("member_profiles").upsert(
    {
      member_id: authUser.id,
      membership_date: new Date().toISOString().slice(0, 10)
    },
    { onConflict: "member_id" }
  );

  if (memberProfileError) {
    throw memberProfileError;
  }

  const { error: membershipIdError } = await supabase.from("membership_ids").upsert(
    {
      member_id: authUser.id,
      status: "issued"
    },
    { onConflict: "member_id" }
  );

  if (membershipIdError) {
    throw membershipIdError;
  }

  const { error: preferencesError } = await supabase.from("notification_preferences").upsert(
    {
      member_id: authUser.id,
      in_app_enabled: true
    },
    { onConflict: "member_id" }
  );

  if (preferencesError) {
    throw preferencesError;
  }
}

async function main() {
  const supabaseUrl = normalizeSupabaseUrl(requiredEnv("NEXT_PUBLIC_SUPABASE_URL"));
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  for (const seedUser of users) {
    const authUser = await createOrUpdateAuthUser(seedUser);
    await upsertProfile(authUser, seedUser);
    await upsertMemberRecords(authUser, seedUser);

    console.log(`${seedUser.role}: ${seedUser.email} / ${seedUser.password}`);
  }
}

main().catch((error) => {
  console.error(`Unable to seed users: ${error.message}`);
  console.error("Create .env.local from .env.example and set SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
});
