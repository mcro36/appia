// Faixa de identificação do ambiente. Some em produção; aparece em preview e local.
// NEXT_PUBLIC_VERCEL_ENV é injetado automaticamente pela Vercel ("production" | "preview").
// Ausente = execução local (npm run dev).

const ENV = process.env.NEXT_PUBLIC_VERCEL_ENV;

export function EnvBanner() {
  if (ENV === "production") return null;

  const ehPreview = ENV === "preview";
  const rotulo = ehPreview ? "PREVIEW" : "LOCAL";
  const detalhe = ehPreview ? "deploy de teste · dados reais" : "desenvolvimento · dados reais";
  const cor = ehPreview
    ? "bg-amber-500 text-amber-950"
    : "bg-zinc-700 text-zinc-100 dark:bg-zinc-800";

  return (
    <div
      className={`flex shrink-0 items-center justify-center gap-2 px-3 py-0.5 text-[11px] font-semibold tracking-wide ${cor}`}
    >
      <span className="rounded bg-black/15 px-1.5 py-px">{rotulo}</span>
      <span className="font-normal opacity-90">{detalhe}</span>
    </div>
  );
}
