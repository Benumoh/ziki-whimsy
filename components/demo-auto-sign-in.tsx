"use client";

import { useEffect, useRef } from "react";
import { demoSignInAction } from "@/app/actions/demo-sign-in";

/**
 * On a public demo deploy the login page signs the visitor straight in: the
 * form submits itself on load. The button stays for when scripts are off.
 */
export function DemoAutoSignIn({ callbackUrl }: { callbackUrl: string }) {
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    form.current?.requestSubmit();
  }, []);

  return (
    <form ref={form} action={demoSignInAction} className="flex flex-col items-start gap-3">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <p role="status" className="text-sm text-zk-text2">
        Opening the demo workspace…
      </p>
      <button
        type="submit"
        className="inline-flex h-[42px] items-center justify-center rounded-full bg-electric-blue-strong px-5 text-sm font-semibold text-white"
      >
        Enter the demo
      </button>
    </form>
  );
}
