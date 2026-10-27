"use server";

import { signIn } from "@/auth";
import { demoAutoSignInEmail } from "@/lib/auth-mode";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

/** Signs the visitor in as the demo owner and sends them on; a no-op off demo deploys. */
export async function demoSignInAction(formData: FormData): Promise<void> {
  if (!demoAutoSignInEmail()) return;
  await signIn("demo", { redirectTo: safeCallbackUrl(formData.get("callbackUrl")) });
}
