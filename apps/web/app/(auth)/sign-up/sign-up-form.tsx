"use client";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { track } from "@/lib/analytics";
import { signIn } from "@/lib/auth/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Cadastro só com Google e só para os domínios liberados (a trava real é o hook em @dayotter/auth). */
export function SignUpForm({ domains }: { domains: string[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const typed = email.trim().toLowerCase();
    if (!domains.includes(typed.slice(typed.lastIndexOf("@") + 1))) {
      track("Sign Up Failed");
      router.push("/nao-autorizado?motivo=dominio");
      return;
    }
    setLoading(true);
    track("Google Auth Started");
    await signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
      newUserCallbackURL: "/welcome",
      errorCallbackURL: "/nao-autorizado",
      loginHint: typed,
    });
  }

  return (
    <div>
      <h1 className="font-display text-3xl leading-tight tracking-[-0.01em]">Criar sua conta</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Cadastro exclusivo para as equipes da Lopes Advogados e da DZB Invest, com a conta Google
        corporativa.
      </p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <div>
          <Label htmlFor="email">E-mail corporativo</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@lopes.digital"
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Redirecionando…" : "Cadastrar com Google"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
        Já tem conta?{" "}
        <Link href="/sign-in" className="font-medium text-[var(--color-accent)] hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
