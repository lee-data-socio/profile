"use client";

import { useActionState } from "react";
import { sendMagicLink, type FormState } from "@/app/admin/actions";
import { inputCls, primaryBtnCls } from "@/components/admin/fields";

export function LoginForm() {
  const [state, action, pending] = useActionState(sendMagicLink, { ok: false } as FormState);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          관리자 이메일
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputCls} />
        {state.errors?.email && <p className="text-xs text-danger">{state.errors.email}</p>}
      </div>
      <button type="submit" className={`${primaryBtnCls} w-full`} disabled={pending}>
        {pending ? "보내는 중…" : "로그인 링크 받기"}
      </button>
      {state.message && (
        <p role="status" className={`text-sm ${state.ok ? "text-success" : "text-danger"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
