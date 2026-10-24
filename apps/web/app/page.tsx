import Link from "next/link";

export const metadata = { title: "Agenda | Lopes Advogados e DZB Invest" };

// Home restrita: o uso é interno (Lopes Advogados e DZB Invest); as páginas de reserva seguem públicas.
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-white px-4 text-center text-neutral-900">
      <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-8">
        {/* biome-ignore lint/performance/noImgElement: PNG estático pequeno */}
        <img src="/marcas/lopes-advogados.png" alt="Lopes Advogados" className="h-16 w-auto" />
        {/* biome-ignore lint/performance/noImgElement: PNG estático pequeno */}
        <img src="/marcas/dzb-invest.png" alt="DZB Invest" className="h-8 w-auto" />
      </div>
      <h1 className="max-w-md text-xl font-medium leading-snug">
        Ferramenta de agenda das empresas Lopes Advogados e DZB Invest
      </h1>
      <Link
        href="/sign-in"
        className="rounded-md bg-neutral-900 px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
      >
        Entrar
      </Link>
    </main>
  );
}
