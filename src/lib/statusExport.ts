// Exportação do Status Report (client-only). Monta uma renderização "limpa"
// dos projetos selecionados com cores explícitas (hex) — assim o html2canvas
// não esbarra nas cores oklch do Tailwind do resto do app.
import type { Cor, ProjetoStatus } from "@/lib/statusReport";

const SELO_BG: Record<Cor, string> = {
  verde: "#d6f5e3", amarelo: "#fdf0c9", azul: "#d9e8fd", cinza: "#eceff3", vermelho: "#fde0e0", nenhum: "",
};
const SELO_TX: Record<Cor, string> = {
  verde: "#128a52", amarelo: "#b07d00", azul: "#2563c9", cinza: "#5b6572", vermelho: "#c0392b", nenhum: "#16213e",
};

function esc(t: string): string {
  return String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function selo(texto: string, cor: Cor): string {
  if (!texto) return "";
  if (cor === "nenhum") return `<span style="display:inline-block;line-height:1;font-weight:700;color:#16213e">${esc(texto)}</span>`;
  return `<span style="display:inline-block;line-height:1;padding:7px 14px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap;background:${SELO_BG[cor]};color:${SELO_TX[cor]}">${esc(texto)}</span>`;
}

// Cria um nó offscreen com as tabelas dos projetos (cores explícitas).
// Nota: o texto da descrição leva translateY(-8px) — o html2canvas desenha texto
// solto ~8px abaixo do centro da linha (selos, inline-block com fundo, centralizam
// certo). O deslocamento fixo compensa isso (escala 2x e fontes fixas no export).
function construirNode(projetos: ProjetoStatus[]): HTMLElement {
  const wrap = document.createElement("div");
  // width:max-content faz o bloco encolher até o conteúdo mais comprido; com
  // as células em nowrap, cada coluna fica com a largura do seu maior item
  // (aproveita o espaço e evita quebra de linha no PDF/JPG).
  wrap.style.cssText =
    "position:fixed;left:-99999px;top:0;width:max-content;max-width:2400px;background:#ffffff;color:#1f2937;" +
    "font-family:Poppins,-apple-system,'Segoe UI',Roboto,sans-serif;padding:28px";
  wrap.innerHTML = projetos.map((proj) => `
    <div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:22px">
      <div style="background:#eef2f8;padding:13px 22px;font-weight:700;font-size:16px;color:#16213e;border-bottom:1px solid #d5dced">${esc(proj.nome)}</div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr>
          ${["Descrição do Item", "SC / Contrato", "Status", "Próximo passo"].map((h) => `<th style="background:#16213e;color:#fff;text-align:left;vertical-align:middle;font-size:14px;font-weight:600;white-space:nowrap;padding:14px 22px">${h}</th>`).join("")}
        </tr></thead>
        <tbody>
          ${proj.itens.length === 0
            ? `<tr><td colspan="4" style="padding:16px 22px;border-top:1px solid #e5e7eb;color:#6b7280;font-style:italic">Nenhum item.</td></tr>`
            : proj.itens.map((it, i) => `
            <tr style="background:${i % 2 ? "#f7f8fa" : "#ffffff"}">
              <td style="padding:15px 22px;border-top:1px solid #e5e7eb;vertical-align:middle;line-height:1;font-size:14px;color:#1f2937;white-space:nowrap"><span style="display:inline-block;line-height:1;transform:translateY(-8px)"><b style="color:#16213e">Item ${i + 1}</b> <span style="color:#6b7280">–</span> ${esc(it.descricao)}</span></td>
              <td style="padding:15px 22px;border-top:1px solid #e5e7eb;vertical-align:middle;line-height:1;white-space:nowrap">${selo(it.sc, it.corSc)}</td>
              <td style="padding:15px 22px;border-top:1px solid #e5e7eb;vertical-align:middle;line-height:1;white-space:nowrap">${selo(it.status, it.corStatus)}</td>
              <td style="padding:15px 22px;border-top:1px solid #e5e7eb;vertical-align:middle;line-height:1;font-size:14px;color:#1f2937;white-space:nowrap"><span style="display:inline-block;line-height:1;transform:translateY(-8px)">${esc(it.proximoPasso)}</span></td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`).join("");
  document.body.appendChild(wrap);
  return wrap;
}

function baixar(url: string, nome: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
}

async function renderCanvas(projetos: ProjetoStatus[]): Promise<HTMLCanvasElement> {
  const node = construirNode(projetos);
  try {
    // aguarda a fonte (se disponível) para o texto sair correto
    if (document.fonts?.ready) await document.fonts.ready;
    const html2canvas = (await import("html2canvas")).default;
    return await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", logging: false });
  } finally {
    node.remove();
  }
}

export async function exportarJpg(projetos: ProjetoStatus[]) {
  const canvas = await renderCanvas(projetos);
  baixar(canvas.toDataURL("image/jpeg", 0.95), "status-projetos.jpg");
}

export async function exportarPdf(projetos: ProjetoStatus[]) {
  const canvas = await renderCanvas(projetos);
  const { jsPDF } = await import("jspdf");
  const img = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pw) / canvas.width;
  let restante = imgH;
  let y = 0;
  pdf.addImage(img, "JPEG", 0, y, pw, imgH);
  restante -= ph;
  while (restante > 0) {
    y -= ph;
    pdf.addPage();
    pdf.addImage(img, "JPEG", 0, y, pw, imgH);
    restante -= ph;
  }
  pdf.save("status-projetos.pdf");
}

export async function exportarExcel(projetos: ProjetoStatus[]) {
  const XLSX = await import("xlsx");
  const linhas = projetos.flatMap((proj) =>
    proj.itens.map((it, i) => ({
      Projeto: proj.nome,
      Item: i + 1,
      Descrição: it.descricao,
      "SC / Contrato": it.sc,
      Status: it.status,
      "Próximo passo": it.proximoPasso,
    })),
  );
  const ws = XLSX.utils.json_to_sheet(linhas);
  ws["!cols"] = [{ wch: 24 }, { wch: 6 }, { wch: 52 }, { wch: 26 }, { wch: 44 }, { wch: 44 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Status");
  XLSX.writeFile(wb, "status-projetos.xlsx");
}
