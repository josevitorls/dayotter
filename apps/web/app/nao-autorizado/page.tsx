import Link from "next/link";

export const metadata = { title: "Acesso não autorizado | Agenda" };

// "dominio" vem do pré-filtro do cadastro; os demais são os códigos do better-auth quando o hook recusa o usuário.
const RECUSADO = ["dominio", "unable_to_create_user", "signup_disabled"];

export default async function NaoAutorizadoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; motivo?: string }>;
}) {
  const { error, motivo } = await searchParams;
  const recusado = RECUSADO.includes(motivo ?? error ?? "dominio");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-4 text-center text-neutral-900">
      <h1 className="text-2xl font-semibold">
        {recusado ? "Usuário ou e-mail não autorizado" : "Não foi possível entrar"}
      </h1>
      <p className="max-w-md text-sm text-neutral-600">
        {recusado
          ? "Esta agenda é exclusiva para as equipes da Lopes Advogados e da DZB Invest. Use seu e-mail corporativo ou fale com o administrador."
          : "Tente novamente. Se o problema continuar, fale com o administrador."}
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-md border border-neutral-300 px-5 py-2 text-sm font-medium hover:bg-neutral-100"
        >
          Voltar ao início
        </Link>
        <Link
          href={recusado ? "/sign-up" : "/sign-in"}
          className="rounded-md bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Tentar de novo
        </Link>
      </div>
    </main>
  );
}
