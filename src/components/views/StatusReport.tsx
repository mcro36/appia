"use client";

import { useEffect, useRef, useState } from "react";
import { useStatusReport } from "@/lib/useStatusReport";
import { COR_LABEL, CORES, type Cor } from "@/lib/statusReport";
import { exportarExcel, exportarJpg, exportarPdf } from "@/lib/statusExport";

// Aparência fiel à página original (Poppins, azul #1e6fff, cabeçalho navy,
// selos), como uma "ilha" clara — CSS escopado sob `.sr`. Uma tabela por
// projeto; leitura mostra os selos; o ✎ (ao lado da lixeira) alterna a edição
// inline daquela linha. "+ Item" no cabeçalho cria a linha já em edição.
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
.sr{
  --azul:#1e6fff; --navy:#16213e; --texto:#1f2937; --texto-fraco:#6b7280;
  --borda:#e5e7eb; --linha-alt:#f7f8fa; --grupo-bg:#eef2f8;
  --verde-bg:#d6f5e3; --verde-tx:#128a52; --amarelo-bg:#fdf0c9; --amarelo-tx:#b07d00;
  --azulp-bg:#d9e8fd; --azulp-tx:#2563c9; --cinza-bg:#eceff3; --cinza-tx:#5b6572;
  --vermelho-bg:#fde0e0; --vermelho-tx:#c0392b;
  font-family:'Poppins',-apple-system,'Segoe UI',Roboto,sans-serif;
  color:var(--texto); background:#fff; -webkit-font-smoothing:antialiased;
  border-radius:14px; padding:24px; border:1px solid var(--borda);
}
.sr *{box-sizing:border-box}
.sr .wrap{width:fit-content;min-width:min(1040px,100%);max-width:100%;margin:0 auto}

.sr .barra-projeto{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 22px;
  padding:12px 14px;border:1px solid var(--borda);border-radius:10px;background:#fbfcfe}
.sr .barra-projeto label{margin:0;white-space:nowrap;font-size:.72rem;font-weight:600;color:var(--texto-fraco);text-transform:uppercase;letter-spacing:.5px}
.sr #novoProjeto{max-width:340px;flex:1;font-family:inherit;font-size:.88rem;color:var(--texto);padding:10px 12px;border:1px solid var(--borda);border-radius:8px;background:#fff}
.sr #novoProjeto:focus{outline:none;border-color:var(--azul);box-shadow:0 0 0 3px rgba(30,111,255,.13)}
.sr .btn{font-family:inherit;font-size:.82rem;font-weight:600;color:#fff;background:var(--azul);border:none;border-radius:8px;padding:9px 18px;cursor:pointer;transition:.15s;white-space:nowrap}
.sr .btn:hover{background:#1559d6}

.sr .projeto-card{border:1px solid var(--borda);border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(16,24,40,.05);margin-bottom:22px}
.sr .projeto-topo{display:flex;align-items:center;gap:12px;background:var(--grupo-bg);padding:13px 22px;border-bottom:1px solid #d5dced}
.sr .projeto-nome{flex:1;min-width:0;font-size:1rem;font-weight:700;color:var(--navy);background:transparent;border:1px solid transparent;border-radius:4px;padding:2px 5px;font-family:inherit}
.sr .projeto-nome:hover{background:#e2e8f5}
.sr .projeto-nome:focus{outline:none;background:#fff;border-color:var(--azul)}
.sr .projeto-contagem{font-size:.74rem;color:var(--texto-fraco);font-weight:500;white-space:nowrap}
.sr .projeto-nome-ro{flex:1;min-width:0;font-size:1rem;font-weight:700;color:var(--navy);padding:2px 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sr .grupo-acoes{margin-left:auto;display:flex;align-items:center;gap:6px;opacity:0;transition:opacity .15s}
.sr .projeto-card:hover .grupo-acoes,.sr .projeto-card.editando-proj .grupo-acoes,.sr .projeto-card:focus-within .grupo-acoes{opacity:1}
.sr .grupo-botoes{display:flex;gap:6px}
.sr .btn-grupo{display:inline-flex;align-items:center;gap:4px;font-family:inherit;font-size:.73rem;font-weight:600;color:var(--texto-fraco);background:#fff;border:1px solid #d5dced;border-radius:6px;padding:5px 11px;cursor:pointer;white-space:nowrap}
.sr .btn-grupo:hover{border-color:var(--azul);color:var(--azul)}
.sr .btn-grupo.perigo:hover{border-color:#f3c6c1;color:#c0392b}

.sr .rolagem{overflow-x:auto}
.sr table{width:100%;min-width:840px;border-collapse:collapse}
.sr tr.cabecalho th{background:var(--navy);color:#fff;text-align:left;font-size:.9rem;font-weight:600;padding:15px 22px;white-space:nowrap}
.sr tr.cabecalho th:last-child{width:90px}
.sr tbody td{padding:14px 22px;border-top:1px solid var(--borda);font-size:.9rem;vertical-align:middle;white-space:nowrap}
.sr tr.item.alt{background:var(--linha-alt)}
.sr tr.item:hover{background:#eef4ff}
.sr tr.arrastando{opacity:.4}
.sr .pega{cursor:grab;color:#c3c8d0;font-size:1rem;user-select:none}
.sr .num{font-weight:700;color:var(--navy)}
.sr .desc-sep{color:var(--texto-fraco);margin:0 4px}
.sr .texto-simples{font-weight:700;color:var(--navy)}
.sr .proximo-texto{color:var(--texto)}
.sr .selo{display:inline-block;padding:7px 16px;border-radius:999px;font-size:.82rem;font-weight:600;line-height:1.2;white-space:nowrap}
.sr .selo.verde{background:var(--verde-bg);color:var(--verde-tx)}
.sr .selo.amarelo{background:var(--amarelo-bg);color:var(--amarelo-tx)}
.sr .selo.azul{background:var(--azulp-bg);color:var(--azulp-tx)}
.sr .selo.cinza{background:var(--cinza-bg);color:var(--cinza-tx)}
.sr .selo.vermelho{background:var(--vermelho-bg);color:var(--vermelho-tx)}
.sr .vazio td{color:var(--texto-fraco);padding:16px 22px 16px 46px;font-size:.85rem;white-space:normal;font-style:italic}

.sr .ferramentas{display:flex;gap:4px;opacity:0;transition:opacity .15s;justify-content:flex-end}
.sr tr:hover .ferramentas,.sr tr.editando .ferramentas{opacity:1}
.sr .icone{width:28px;height:28px;display:grid;place-items:center;cursor:pointer;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--texto-fraco);font-size:.85rem;line-height:1;padding:0;font-family:inherit}
.sr .icone:hover{background:#fff;border-color:var(--borda);color:var(--azul)}
.sr .icone.ativo{background:#fff;border-color:var(--azul);color:var(--azul)}
.sr .icone.perigo:hover{color:#c0392b;border-color:#f3c6c1}

/* ---- Edição inline (aparece só na linha em edição) ---- */
.sr .desc-input{width:100%;min-width:220px;border:1px solid var(--borda);background:#fff;font-family:inherit;font-size:.9rem;color:var(--texto);padding:7px 9px;border-radius:7px}
.sr .desc-input:focus{outline:none;border-color:var(--azul);box-shadow:0 0 0 3px rgba(30,111,255,.13)}
.sr .celula-edit{display:flex;align-items:center;gap:9px}
.sr .selo-input{flex:1;min-width:70px;width:auto;border:1px solid transparent;border-radius:999px;padding:7px 14px;font-size:.83rem;font-weight:600;font-family:inherit}
.sr .selo-input:focus{outline:none;box-shadow:0 0 0 2px rgba(30,111,255,.45)}
.sr .selo-input.verde{background:var(--verde-bg);color:var(--verde-tx)}
.sr .selo-input.amarelo{background:var(--amarelo-bg);color:var(--amarelo-tx)}
.sr .selo-input.azul{background:var(--azulp-bg);color:var(--azulp-tx)}
.sr .selo-input.cinza{background:var(--cinza-bg);color:var(--cinza-tx)}
.sr .selo-input.vermelho{background:var(--vermelho-bg);color:var(--vermelho-tx)}
.sr .selo-input.nenhum{background:#fff;color:var(--navy);font-weight:700;border-color:var(--borda);border-radius:8px}
/* Swatches de cor (seleção moderna, sem dropdown) */
.sr .cor-swatches{display:grid;grid-template-columns:repeat(3,auto);gap:5px;flex:none}
.sr .swatch{width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px var(--borda);cursor:pointer;padding:0;transition:transform .1s,box-shadow .1s}
.sr .swatch:hover{transform:scale(1.18)}
.sr .swatch.sel{box-shadow:0 0 0 2px var(--azul)}
.sr .swatch.verde{background:var(--verde-tx)}
.sr .swatch.amarelo{background:var(--amarelo-tx)}
.sr .swatch.azul{background:var(--azulp-tx)}
.sr .swatch.cinza{background:var(--cinza-tx)}
.sr .swatch.vermelho{background:var(--vermelho-tx)}
.sr .swatch.nenhum{background:#fff}

/* ---- Exportar (botão + popover estilo filtro) ---- */
.sr .export-wrap{position:relative;margin-left:auto}
.sr .btn-export{display:inline-flex;align-items:center;gap:7px;font-family:inherit;font-size:.82rem;font-weight:600;color:var(--navy);background:#fff;border:1px solid #d5dced;border-radius:8px;padding:9px 16px;cursor:pointer;transition:.15s;white-space:nowrap}
.sr .btn-export:hover{border-color:var(--azul);color:var(--azul)}
.sr .btn-export .caret{font-size:.62rem;opacity:.6}
.sr .export-pop{position:absolute;top:calc(100% + 7px);right:0;z-index:50;width:290px;background:#fff;border:1px solid var(--borda);border-radius:11px;box-shadow:0 12px 32px rgba(16,24,40,.16);overflow:hidden}
.sr .export-cab{padding:12px 15px 9px;border-bottom:1px solid var(--borda)}
.sr .export-cab h4{margin:0 0 2px;font-size:.82rem;font-weight:700;color:var(--navy)}
.sr .export-cab p{margin:0;font-size:.72rem;color:var(--texto-fraco)}
.sr .export-lista{max-height:210px;overflow-y:auto;padding:6px}
.sr .export-check{display:flex;align-items:center;gap:9px;padding:7px 9px;font-size:.83rem;color:var(--texto);cursor:pointer;border-radius:7px;user-select:none}
.sr .export-check:hover{background:#f3f6fb}
.sr .export-check input{width:15px;height:15px;accent-color:var(--azul);cursor:pointer;flex:none}
.sr .export-check.todos{font-weight:600;color:var(--navy);border-bottom:1px solid var(--borda);border-radius:0;margin-bottom:2px}
.sr .export-check span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sr .export-formatos{display:flex;gap:7px;padding:11px 12px;border-top:1px solid var(--borda);background:#fbfcfe}
.sr .btn-fmt{flex:1;display:inline-flex;flex-direction:column;align-items:center;gap:3px;font-family:inherit;font-size:.72rem;font-weight:600;color:var(--navy);background:#fff;border:1px solid #d5dced;border-radius:8px;padding:9px 4px;cursor:pointer;transition:.15s}
.sr .btn-fmt .ico{font-size:1.05rem;line-height:1}
.sr .btn-fmt:hover:not(:disabled){border-color:var(--azul);color:var(--azul);background:#f2f7ff}
.sr .btn-fmt:disabled{opacity:.45;cursor:not-allowed}
`;

function Celula({ texto, cor }: { texto: string; cor: Cor }) {
  if (!texto) return null;
  return cor === "nenhum"
    ? <span className="texto-simples">{texto}</span>
    : <span className={`selo ${cor}`}>{texto}</span>;
}

// Swatches clicáveis: um clique escolhe a cor; a selecionada ganha um anel azul.
function CorSwatches({ cor, onCor, aria }: { cor: Cor; onCor: (c: Cor) => void; aria: string }) {
  return (
    <div className="cor-swatches" role="group" aria-label={`Cor de ${aria}`}>
      {CORES.map((c) => (
        <button
          key={c}
          type="button"
          className={`swatch ${c}${cor === c ? " sel" : ""}`}
          title={COR_LABEL[c]}
          aria-label={COR_LABEL[c]}
          aria-pressed={cor === c}
          onClick={() => onCor(c)}
        />
      ))}
    </div>
  );
}

export function StatusReport() {
  const r = useStatusReport();
  const { doc } = r;
  const [novoProj, setNovoProj] = useState("");
  const [arrasto, setArrasto] = useState<{ p: number; i: number } | null>(null);
  const [editando, setEditando] = useState<{ p: number; i: number } | null>(null);
  const [editProjeto, setEditProjeto] = useState<number | null>(null);
  const [exportAberto, setExportAberto] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [exportando, setExportando] = useState<"pdf" | "excel" | "jpg" | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  function adicionarProjeto() {
    if (!novoProj.trim()) return;
    r.addProjeto(novoProj);
    setNovoProj("");
  }

  function abrirExport() {
    // todos pré-selecionados
    setSelecionados(new Set(doc.projetos.map((_, i) => i)));
    setExportAberto(true);
  }
  function alternarSel(i: number) {
    setSelecionados((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });
  }
  const todosMarcados = doc.projetos.length > 0 && selecionados.size === doc.projetos.length;
  function alternarTodos() {
    setSelecionados(todosMarcados ? new Set() : new Set(doc.projetos.map((_, i) => i)));
  }
  async function exportar(fmt: "pdf" | "excel" | "jpg") {
    const escolhidos = doc.projetos.filter((_, i) => selecionados.has(i));
    if (escolhidos.length === 0 || exportando) return;
    setExportando(fmt);
    try {
      if (fmt === "pdf") await exportarPdf(escolhidos);
      else if (fmt === "excel") await exportarExcel(escolhidos);
      else await exportarJpg(escolhidos);
      setExportAberto(false);
    } catch (err) {
      console.error("Falha ao exportar", err);
      alert("Não foi possível exportar. Tente novamente.");
    } finally {
      setExportando(null);
    }
  }
  function adicionarItem(p: number) {
    const novoIdx = doc.projetos[p].itens.length;
    r.addItem(p);
    setEditando({ p, i: novoIdx }); // já entra em edição
  }
  const emEdicao = (p: number, i: number) => editando?.p === p && editando?.i === i;

  // Clicar fora do card em edição sai do modo de edição (projeto e item).
  useEffect(() => {
    if (editProjeto === null && editando === null) return;
    function fora(e: MouseEvent) {
      const card = (e.target as HTMLElement).closest?.(".projeto-card");
      const idx = card ? Number(card.getAttribute("data-proj")) : null;
      setEditProjeto((cur) => (cur !== null && cur !== idx ? null : cur));
      setEditando((cur) => (cur && cur.p !== idx ? null : cur));
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [editProjeto, editando]);

  // Fecha o popover de exportar ao clicar fora dele.
  useEffect(() => {
    if (!exportAberto) return;
    function fora(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportAberto(false);
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [exportAberto]);

  return (
    <div className="sr">
      <style>{CSS}</style>
      <div className="wrap">
        {/* Novo projeto */}
        <div className="barra-projeto">
          <label htmlFor="novoProjeto">Novo projeto</label>
          <input
            id="novoProjeto"
            value={novoProj}
            onChange={(e) => setNovoProj(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionarProjeto(); } }}
            placeholder="Nome do projeto (ex.: FIEMG MOOVE)"
          />
          <button className="btn" type="button" onClick={adicionarProjeto}>Adicionar projeto</button>

          <div className="export-wrap" ref={exportRef}>
            <button
              className="btn-export"
              type="button"
              disabled={doc.projetos.length === 0}
              aria-haspopup="true"
              aria-expanded={exportAberto}
              onClick={() => (exportAberto ? setExportAberto(false) : abrirExport())}
            >
              ⭳ Exportar <span className="caret">▼</span>
            </button>
            {exportAberto && (
              <div className="export-pop" role="dialog" aria-label="Exportar projetos">
                <div className="export-cab">
                  <h4>Exportar projetos</h4>
                  <p>Escolha os projetos e o formato.</p>
                </div>
                <div className="export-lista">
                  <label className="export-check todos">
                    <input type="checkbox" checked={todosMarcados} onChange={alternarTodos} />
                    <span>Todos os projetos</span>
                  </label>
                  {doc.projetos.map((proj, i) => (
                    <label className="export-check" key={i}>
                      <input type="checkbox" checked={selecionados.has(i)} onChange={() => alternarSel(i)} />
                      <span>{proj.nome}</span>
                    </label>
                  ))}
                </div>
                <div className="export-formatos">
                  <button className="btn-fmt" type="button" disabled={selecionados.size === 0 || exportando !== null} onClick={() => exportar("pdf")}>
                    <span className="ico">📄</span>{exportando === "pdf" ? "..." : "PDF"}
                  </button>
                  <button className="btn-fmt" type="button" disabled={selecionados.size === 0 || exportando !== null} onClick={() => exportar("excel")}>
                    <span className="ico">📊</span>{exportando === "excel" ? "..." : "Excel"}
                  </button>
                  <button className="btn-fmt" type="button" disabled={selecionados.size === 0 || exportando !== null} onClick={() => exportar("jpg")}>
                    <span className="ico">🖼️</span>{exportando === "jpg" ? "..." : "JPG"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Uma tabela por projeto */}
        {doc.projetos.map((proj, p) => (
          <div className={`projeto-card${editProjeto === p ? " editando-proj" : ""}`} key={p} data-proj={p}>
            <div className="projeto-topo">
              {editProjeto === p ? (
                <input
                  className="projeto-nome"
                  value={proj.nome}
                  aria-label="Nome do projeto"
                  spellCheck={false}
                  autoFocus
                  onChange={(e) => r.renomearProjeto(p, e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") setEditProjeto(null); }}
                />
              ) : (
                <span className="projeto-nome-ro">{proj.nome}</span>
              )}
              <span className="projeto-contagem">
                {proj.itens.length === 0 ? "nenhum item" : proj.itens.length === 1 ? "1 item" : `${proj.itens.length} itens`}
              </span>
              <span className="grupo-acoes">
                {editProjeto === p && (
                  <span className="grupo-botoes">
                    <button className="btn-grupo" type="button" onClick={() => adicionarItem(p)}>+ Item</button>
                    <button
                      className="btn-grupo perigo"
                      type="button"
                      onClick={() => { if (confirm(`Excluir o projeto "${proj.nome}"${proj.itens.length ? " e seus itens" : ""}?`)) { r.excluirProjeto(p); setEditProjeto(null); setEditando(null); } }}
                    >
                      Excluir projeto
                    </button>
                  </span>
                )}
                <button
                  className={`icone${editProjeto === p ? " ativo" : ""}`}
                  type="button"
                  title={editProjeto === p ? "Concluir edição do projeto" : "Editar projeto"}
                  onClick={() => setEditProjeto(editProjeto === p ? null : p)}
                >
                  {editProjeto === p ? "✓" : "✎"}
                </button>
              </span>
            </div>

            <div className="rolagem">
              <table>
                <thead>
                  <tr className="cabecalho">
                    <th>Descrição do Item</th>
                    <th>SC / Contrato</th>
                    <th>Status</th>
                    <th>Próximo passo</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {proj.itens.map((item, i) => {
                    const ed = emEdicao(p, i);
                    return (
                      <tr
                        key={i}
                        className={`item${i % 2 ? " alt" : ""}${ed ? " editando" : ""}${arrasto?.p === p && arrasto?.i === i ? " arrastando" : ""}`}
                        draggable={editProjeto === p && !ed}
                        onDragStart={() => { if (editProjeto === p && !ed) setArrasto({ p, i }); }}
                        onDragEnd={() => setArrasto(null)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => { if (arrasto) r.moverItem(arrasto.p, arrasto.i, p, i); setArrasto(null); }}
                      >
                        <td>
                          {ed ? (
                            <div className="celula-edit">
                              <span className="num">{i + 1}</span>
                              <input
                                className="desc-input"
                                value={item.descricao}
                                placeholder="Descrição do item"
                                aria-label="Descrição"
                                autoFocus
                                onChange={(e) => r.atualizarItem(p, i, { descricao: e.target.value })}
                                onKeyDown={(e) => { if (e.key === "Enter") setEditando(null); }}
                              />
                            </div>
                          ) : (
                            <>
                              {editProjeto === p && <span className="pega" title="Arraste para reordenar">⠿ </span>}
                              <span className="num">Item {i + 1}</span>
                              <span className="desc-sep">–</span>{item.descricao}
                            </>
                          )}
                        </td>
                        <td>
                          {ed ? (
                            <div className="celula-edit">
                              <input className={`selo-input ${item.corSc}`} value={item.sc} placeholder="SC / Contrato" aria-label="SC"
                                onChange={(e) => r.atualizarItem(p, i, { sc: e.target.value })} />
                              <CorSwatches cor={item.corSc} aria="SC" onCor={(c) => r.atualizarItem(p, i, { corSc: c })} />
                            </div>
                          ) : <Celula texto={item.sc} cor={item.corSc} />}
                        </td>
                        <td>
                          {ed ? (
                            <div className="celula-edit">
                              <input className={`selo-input ${item.corStatus}`} value={item.status} placeholder="Status" aria-label="Status"
                                onChange={(e) => r.atualizarItem(p, i, { status: e.target.value })} />
                              <CorSwatches cor={item.corStatus} aria="Status" onCor={(c) => r.atualizarItem(p, i, { corStatus: c })} />
                            </div>
                          ) : <Celula texto={item.status} cor={item.corStatus} />}
                        </td>
                        <td>
                          {ed ? (
                            <input
                              className="desc-input"
                              value={item.proximoPasso}
                              placeholder="Próximo passo"
                              aria-label="Próximo passo"
                              onChange={(e) => r.atualizarItem(p, i, { proximoPasso: e.target.value })}
                              onKeyDown={(e) => { if (e.key === "Enter") setEditando(null); }}
                            />
                          ) : (item.proximoPasso ? <span className="proximo-texto">{item.proximoPasso}</span> : null)}
                        </td>
                        <td>
                          <div className="ferramentas">
                            <button
                              className={`icone${ed ? " ativo" : ""}`}
                              type="button"
                              title={ed ? "Concluir edição" : "Editar"}
                              onClick={() => setEditando(ed ? null : { p, i })}
                            >
                              {ed ? "✓" : "✎"}
                            </button>
                            <button
                              className="icone perigo"
                              type="button"
                              title="Excluir"
                              onClick={() => { if (confirm(`Excluir "${item.descricao || "este item"}"?`)) { r.excluirItem(p, i); setEditando(null); } }}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {proj.itens.length === 0 && (
                    <tr className="vazio"><td colSpan={5}>Nenhum item. Clique em <b>+ Item</b> para adicionar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {doc.projetos.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--texto-fraco)", padding: "40px 0", fontSize: ".9rem" }}>
            Nenhum projeto ainda. Use o campo <b>Novo projeto</b> acima.
          </p>
        )}
      </div>
    </div>
  );
}
