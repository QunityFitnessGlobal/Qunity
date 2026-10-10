import { createClient } from "@/lib/supabase/client";
import type { Acquisition } from "@/lib/acquisition";
import type { Gender, Role } from "@/lib/types";

interface SignUpInput {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  gender: Gender;
  // Where the family came from (first visit), kept with the account for the
  // admin dashboard's per-channel numbers.
  acquisition?: Acquisition | null;
}

export async function signUp({ fullName, email, password, role, gender, acquisition }: SignUpInput) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
        gender,
        ...(acquisition
          ? {
              signup_source: acquisition.source,
              signup_medium: acquisition.medium,
              signup_campaign: acquisition.campaign,
              signup_referrer: acquisition.referrer,
            }
          : {}),
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

interface LogInInput {
  email: string;
  password: string;
}

export async function logIn({ email, password }: LogInInput) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function logOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}
