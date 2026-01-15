import Form from "next/form";

import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function AuthForm({
  action,
  children,
  defaultEmail = "",
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
}) {
  return (
    <Form action={action} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Label
          className="font-mono text-[9px] font-bold text-bfl-muted uppercase tracking-[0.3em]"
          htmlFor="email"
        >
          Email Address
        </Label>

        <Input
          autoComplete="email"
          autoFocus
          className="bg-white/[0.02] border-white/10 text-white placeholder-white/10 font-mono text-sm tracking-widest focus:ring-1 focus:ring-bfl-green outline-none rounded-sm py-6"
          defaultValue={defaultEmail}
          id="email"
          name="email"
          placeholder="user@acme.com"
          required
          type="email"
        />
      </div>

      <div className="flex flex-col gap-3">
        <Label
          className="font-mono text-[9px] font-bold text-bfl-muted uppercase tracking-[0.3em]"
          htmlFor="password"
        >
          Password
        </Label>

        <Input
          className="bg-white/[0.02] border-white/10 text-white placeholder-white/10 font-mono text-sm tracking-widest focus:ring-1 focus:ring-bfl-green outline-none rounded-sm py-6"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      {children}
    </Form>
  );
}
