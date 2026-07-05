import { createClient } from "@/lib/supabase/client";
import type { Gender, Role } from "@/lib/types";

interface SignUpInput {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  gender: Gender;
}

export async function signUp({ fullName, email, password, role, gender }: SignUpInput) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
        gender,
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
