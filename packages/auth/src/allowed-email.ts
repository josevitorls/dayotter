/** Domínios liberados para cadastro, de ALLOWED_EMAIL_DOMAINS (ex.: "lopes.digital,dzbinvest.com"). */
export function allowedEmailDomains(raw = process.env.ALLOWED_EMAIL_DOMAINS ?? ""): string[] {
  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

/** Domínio exato após o último "@" (subdomínio não vale). Lista vazia recusa todos: falha fechada. */
export function isAllowedEmail(email: string, domains: string[]): boolean {
  const at = email.lastIndexOf("@");
  return at > 0 && domains.includes(email.slice(at + 1).trim().toLowerCase());
}
