"use client";

import { Fragment, useRef, useState } from "react";
import { useStatusReport } from "@/lib/useStatusReport";
import { COR_LABEL, type Cor } from "@/lib/statusReport";

// Reproduz fielmente a aparência da página original (Poppins, azul #1e6fff,
// cabeçalho navy, selos e tabela), como uma "ilha" clara dentro do app —
// todo o CSS fica escopado sob `.sr` para não vazar. Estado/persistência em React.
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
.sr{
  --azul:#1e6fff; --navy:#16213e; --texto:#1f2937; --texto-fraco:#6b7280;
  --borda:#e5e7eb; --linha-alt:#f7f8fa; --grupo-bg:#eef2f8; --fundo:#ffffff;
  --verde-bg:#d6f5e3; --verde-tx:#128a52; --amarelo-bg:#fdf0c9; --amarelo-tx:#b07d00;
  --azulp-bg:#d9e8fd; --azulp-tx:#2563c9; --cinza-bg:#eceff3; --cinza-tx:#5b6572;
  --vermelho-bg:#fde0e0; --vermelho-tx:#c0392b;
  font-family:'Poppins',-apple-system,'Segoe UI',Roboto,sans-serif;
  color:var(--texto); background:var(--fundo); -webkit-font-smoothing:antialiased;
  border-radius:14px; padding:32px 24px 44px; border:1px solid var(--borda);
}
.sr *{box-sizing:border-box}
.sr .wrap{width:fit-content; min-width:min(1040px,100%); max-width:100%; margin:0 auto}
.sr .topo{display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap}
.sr h1{font-size:2.15rem;font-weight:800;letter-spacing:-.5px;color:var(--navy);margin:0}
.sr [contenteditable]:focus{outline:2px dashed var(--azul);outline-offset:4px;border-radius:4px}
.sr .regua{height:3px;background:var(--azul);border-radius:2px;margin:14px 0 18px}

.sr .barra-arquivo{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 14px;
  padding:10px 14px;border:1px solid var(--borda);border-radius:10px;background:#fbfcfe;
  font-size:.8rem;color:var(--texto-fraco)}
.sr .ponto{width:8px;height:8px;border-radius:50%;background:#12a35c;flex:none}
.sr .arq-texto b{color:var(--navy);font-weight:600}
.sr .arq-botoes{margin-left:auto;display:flex;gap:8px}
.sr .btn-arq{font-family:inherit;font-size:.76rem;font-weight:600;color:var(--texto-fraco);
  background:#fff;border:1px solid var(--borda);border-radius:7px;padding:7px 13px;cursor:pointer;
  transition:.15s;white-space:nowrap}
.sr .btn-arq:hover{border-color:var(--azul);color:var(--azul)}

.sr .barra-projeto{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 24px;
  padding:12px 14px;border:1px solid var(--borda);border-radius:10px;background:#fbfcfe}
.sr .barra-projeto label{margin:0;white-space:nowrap}
.sr #novoProjeto{max-width:340px}

.sr .tabela-box{border:1px solid var(--borda);border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(16,24,40,.05)}
.sr .rolagem{overflow-x:auto}
.sr table{width:max-content;min-width:100%;border-collapse:collapse}
.sr tr.cabecalho th{background:var(--navy);color:#fff;text-align:left;font-size:.95rem;font-weight:600;padding:18px 22px;white-space:nowrap}
.sr tr.cabecalho th:last-child{width:110px}
.sr tbody td{padding:16px 22px;border-top:1px solid var(--borda);font-size:.9rem;vertical-align:middle;white-space:nowrap}
.sr tr.item.alt{background:var(--linha-alt)}
.sr tr.item:hover{background:#eef4ff}
.sr .num{font-weight:700;color:var(--navy)}
.sr .desc-sep{color:var(--texto-fraco);margin:0 4px}
.sr .texto-simples{font-weight:700;color:var(--navy)}
.sr .selo{display:inline-block;padding:7px 16px;border-radius:999px;font-size:.82rem;font-weight:600;line-height:1.2;white-space:nowrap}
.sr .selo.verde{background:var(--verde-bg);color:var(--verde-tx)}
.sr .selo.amarelo{background:var(--amarelo-bg);color:var(--amarelo-tx)}
.sr .selo.azul{background:var(--azulp-bg);color:var(--azulp-tx)}
.sr .selo.cinza{background:var(--cinza-bg);color:var(--cinza-tx)}
.sr .selo.vermelho{background:var(--vermelho-bg);color:var(--vermelho-tx)}

.sr tr.grupo td{background:var(--grupo-bg);border-top:2px solid #d5dced;padding:13px 22px}
.sr tr.grupo:first-child td{border-top:none}
.sr .grupo-linha{display:flex;align-items:center;gap:12px}
.sr .grupo-nome{font-size:1rem;font-weight:700;color:var(--navy);padding:2px 4px;border-radius:4px;cursor:text}
.sr .grupo-nome:hover{background:#e2e8f5}
.sr .grupo-contagem{font-size:.74rem;color:var(--texto-fraco);font-weight:500;white-space:nowrap}
.sr .grupo-botoes{margin-left:auto;display:flex;gap:6px;opacity:0;transition:opacity .15s}
.sr tr.grupo:hover .grupo-botoes,.sr tr.grupo:focus-within .grupo-botoes{opacity:1}
.sr .btn-grupo{font-family:inherit;font-size:.73rem;font-weight:600;color:var(--texto-fraco);background:#fff;border:1px solid #d5dced;border-radius:6px;padding:5px 11px;cursor:pointer;white-space:nowrap}
.sr .btn-grupo:hover{border-color:var(--azul);color:var(--azul)}
.sr .btn-grupo.perigo:hover{border-color:#f3c6c1;color:#c0392b}
.sr tr.grupo.alvo td{background:#dbe7fb}

.sr .ferramentas{display:flex;gap:4px;opacity:0;transition:opacity .15s;justify-content:flex-end}
.sr tr:hover .ferramentas,.sr tr:focus-within .ferramentas{opacity:1}
.sr .icone{width:28px;height:28px;display:grid;place-items:center;cursor:pointer;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--texto-fraco);font-size:.85rem;line-height:1;padding:0;font-family:inherit}
.sr .icone:hover{background:#fff;border-color:var(--borda);color:var(--azul)}
.sr .icone.perigo:hover{color:#c0392b;border-color:#f3c6c1}
.sr .vazio td{color:var(--texto-fraco);padding:18px 22px 18px 46px;font-size:.85rem;white-space:normal;font-style:italic}
.sr .sem-projeto{padding:44px 20px;text-align:center;color:var(--texto-fraco);font-size:.9rem;border:1px dashed var(--borda);border-radius:12px}

.sr .form-card{margin-top:26px;border:1px solid var(--borda);border-radius:12px;padding:22px;background:#fbfcfe}
.sr .form-titulo{font-size:.95rem;font-weight:700;color:var(--navy);margin:0 0 16px}
.sr .grade{display:grid;grid-template-columns:1.5fr 1fr 1.5fr 1fr;gap:14px}
.sr .meia{grid-column:span 2}
@media(max-width:820px){.sr .grade{grid-template-columns:1fr}.sr .meia{grid-column:auto}}
.sr label{display:block;font-size:.72rem;font-weight:600;color:var(--texto-fraco);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.sr input,.sr select{width:100%;font-family:inherit;font-size:.88rem;color:var(--texto);padding:10px 12px;border:1px solid var(--borda);border-radius:8px;background:#fff}
.sr input:focus,.sr select:focus{outline:none;border-color:var(--azul);box-shadow:0 0 0 3px rgba(30,111,255,.13)}
.sr .rodape-form{display:flex;align-items:center;gap:14px;margin-top:18px;flex-wrap:wrap}
.sr .btn{font-family:inherit;font-size:.86rem;font-weight:600;color:#fff;background:var(--azul);border:none;border-radius:8px;padding:11px 26px;cursor:pointer;transition:.15s}
.sr .btn:hover{background:#1559d6}
.sr .btn:disabled{background:#c3c8d0;cursor:not-allowed}
.sr .btn.secundario{background:#fff;color:var(--texto-fraco);border:1px solid var(--borda)}
.sr .btn.secundario:hover{background:#f3f4f6;color:var(--texto)}
.sr .dica{font-size:.75rem;color:var(--texto-fraco);margin-left:auto}
.sr .pega{cursor:grab;color:#c3c8d0;font-size:1rem}
.sr tr.arrastando{opacity:.4}
`;

function plural(n: number) {
  return n === 0 ? "nenhum item" : n === 1 ? "1 item" : `${n} itens`;
}

function Celula({ texto, cor }: { texto: string; cor: Cor }) {
  if (!texto) return null;
  return cor === "nenhum"
    ? <span className="texto-simples">{texto}</span>
    : <span className={`selo ${cor}`}>{texto}</span>;
}

const OPCOES_COR: { c: Cor; emoji: string }[] = [
  { c: "verde", emoji: "🟢" }, { c: "amarelo", emoji: "🟡" }, { c: "azul", emoji: "🔵" },
  { c: "cinza", emoji: "⚪" }, { c: "vermelho", emoji: "🔴" }, { c: "nenhum", emoji: "▫️" },
];

type Form = { projeto: number; descricao: string; sc: string; corSc: Cor; status: string; corStatus: Cor };
const FORM_VAZIO: Form = { projeto: 0, descricao: "", sc: "", corSc: "verde", status: "", corStatus: "nenhum" };

export function StatusReport() {
  const r = useStatusReport();
  const { doc } = r;
  const [editando, setEditando] = useState<{ p: number; i: number } | null>(null);
  const [form, setForm] = useState<Form>(FORM_VAZIO);
  const [novoProj, setNovoProj] = useState("");
  const [arrasto, setArrasto] = useState<{ p: number; i: number } | null>(null);
  const [alvoP, setAlvoP] = useState<number | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  function limparForm() {
    setEditando(null);
    setForm((f) => ({ ...FORM_VAZIO, projeto: f.projeto < doc.projetos.length ? f.projeto : 0 }));
  }
  function editarItem(p: number, i: number) {
    const it = doc.projetos[p].itens[i];
    setEditando({ p, i });
    setForm({ projeto: p, descricao: it.descricao, sc: it.sc, corSc: it.corSc, status: it.status, corStatus: it.corStatus });
    document.querySelector(".sr .form-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!doc.projetos.length) return;
    const item = { descricao: form.descricao.trim(), sc: form.sc.trim(), corSc: form.corSc, status: form.status.trim(), corStatus: form.corStatus };
    if (!item.descricao) return;
    if (editando) r.atualizarItem(editando.p, editando.i, item);
    else r.inserirItem(form.projeto, item);
    limparForm();
  }
  function adicionarProjeto() {
    if (!novoProj.trim()) return;
    r.addProjeto(novoProj);
    setNovoProj("");
    setForm((f) => ({ ...f, projeto: doc.projetos.length }));
  }
  function exportar() {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "status-projetos.json"; a.click();
    URL.revokeObjectURL(url);
  }
  function importar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const leitor = new FileReader();
    leitor.onload = () => { try { r.importar(JSON.parse(String(leitor.result))); } catch { alert("Arquivo JSON inválido."); } };
    leitor.readAsText(f);
    e.target.value = "";
  }

  return (
    <div className="sr">
      <style>{CSS}</style>
      <div className="wrap">
        <div className="topo">
          <h1
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onBlur={(e) => r.setTitulo(e.currentTarget.textContent?.trim() || "Status dos Projetos")}
          >
            {doc.titulo}
          </h1>
        </div>
        <div className="regua" />

        <div className="barra-arquivo">
          <span className="ponto" />
          <span className="arq-texto">Os dados ficam salvos <b>neste navegador</b>. Use <b>Exportar</b> para guardar um arquivo <b>.json</b>.</span>
          <div className="arq-botoes">
            <button className="btn-arq" onClick={exportar}>Exportar .json</button>
            <button className="btn-arq" onClick={() => importRef.current?.click()}>Importar .json</button>
            <input ref={importRef} type="file" accept=".json,application/json" hidden onChange={importar} />
          </div>
        </div>

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
        </div>

        <div id="areaTabela">
          {doc.projetos.length === 0 ? (
            <div className="sem-projeto">Nenhum projeto ainda. Use o campo <b>Novo projeto</b> acima para criar o primeiro.</div>
          ) : (
            <div className="tabela-box"><div className="rolagem"><table><tbody>
              {doc.projetos.map((proj, p) => (
                <Fragment key={p}>
                  <tr className={`grupo${alvoP === p ? " alvo" : ""}`}>
                    <td colSpan={4}>
                      <div className="grupo-linha">
                        <span
                          className="grupo-nome"
                          contentEditable
                          suppressContentEditableWarning
                          spellCheck={false}
                          onBlur={(e) => r.renomearProjeto(p, e.currentTarget.textContent?.trim() || proj.nome)}
                        >
                          {proj.nome}
                        </span>
                        <span className="grupo-contagem">{plural(proj.itens.length)}</span>
                        <span className="grupo-botoes">
                          <button className="btn-grupo" onClick={() => { setForm((f) => ({ ...f, projeto: p })); limparForm(); setForm((f) => ({ ...f, projeto: p })); document.querySelector(".sr .form-card")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>+ Item</button>
                          <button className="btn-grupo perigo" onClick={() => { if (confirm(`Excluir o projeto "${proj.nome}"${proj.itens.length ? ` e seus ${plural(proj.itens.length)}` : ""}?`)) { r.excluirProjeto(p); if (editando?.p === p) limparForm(); } }}>Excluir projeto</button>
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr className="cabecalho"><th>Descrição do Item</th><th>SC / Contrato</th><th>Status</th><th></th></tr>
                  {proj.itens.length === 0 ? (
                    <tr className="vazio"><td colSpan={4}>Nenhum item neste projeto.</td></tr>
                  ) : proj.itens.map((item, i) => (
                    <tr
                      key={i}
                      className={`item${i % 2 ? " alt" : ""}${arrasto?.p === p && arrasto?.i === i ? " arrastando" : ""}`}
                      draggable
                      onDragStart={() => setArrasto({ p, i })}
                      onDragEnd={() => { setArrasto(null); setAlvoP(null); }}
                      onDragOver={(e) => { e.preventDefault(); if (alvoP !== p) setAlvoP(p); }}
                      onDrop={() => { if (arrasto) r.moverItem(arrasto.p, arrasto.i, p, i); setArrasto(null); setAlvoP(null); }}
                    >
                      <td>
                        <span className="pega">⠿</span> <span className="num">Item {i + 1}</span>
                        <span className="desc-sep">–</span>{item.descricao}
                      </td>
                      <td><Celula texto={item.sc} cor={item.corSc} /></td>
                      <td><Celula texto={item.status} cor={item.corStatus} /></td>
                      <td>
                        <div className="ferramentas">
                          <button className="icone" title="Editar" onClick={() => editarItem(p, i)}>✎</button>
                          <button className="icone perigo" title="Excluir" onClick={() => { if (confirm(`Excluir "${item.descricao}"?`)) { r.excluirItem(p, i); if (editando?.p === p && editando?.i === i) limparForm(); } }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody></table></div></div>
          )}
        </div>

        <div className="form-card">
          <p className="form-titulo">
            {editando ? `Editando Item ${editando.i + 1} de "${doc.projetos[editando.p]?.nome ?? ""}"` : "Adicionar item"}
          </p>
          <form onSubmit={submitForm}>
            <div className="grade">
              <div className="meia">
                <label htmlFor="fProjeto">Projeto</label>
                <select id="fProjeto" value={form.projeto} disabled={!doc.projetos.length}
                  onChange={(e) => setForm((f) => ({ ...f, projeto: Number(e.target.value) }))}>
                  {doc.projetos.map((p, i) => <option key={i} value={i}>{p.nome}</option>)}
                </select>
              </div>
              <div className="meia">
                <label htmlFor="fDesc">Descrição do item</label>
                <input id="fDesc" value={form.descricao} required placeholder="Link de internet 1 Gbps abordagem dupla"
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="fSc">SC / Contrato</label>
                <input id="fSc" value={form.sc} placeholder="SC.023498.02MG0001"
                  onChange={(e) => setForm((f) => ({ ...f, sc: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="fCorSc">Cor do selo — SC / Contrato</label>
                <select id="fCorSc" value={form.corSc} onChange={(e) => setForm((f) => ({ ...f, corSc: e.target.value as Cor }))}>
                  {OPCOES_COR.map((o) => <option key={o.c} value={o.c}>{o.emoji} {COR_LABEL[o.c]}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="fStatus">Status</label>
                <input id="fStatus" value={form.status} placeholder="Concluído / Hoje / Quinta (06)"
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="fCorStatus">Cor do selo — Status</label>
                <select id="fCorStatus" value={form.corStatus} onChange={(e) => setForm((f) => ({ ...f, corStatus: e.target.value as Cor }))}>
                  {OPCOES_COR.map((o) => <option key={o.c} value={o.c}>{o.emoji} {COR_LABEL[o.c]}</option>)}
                </select>
              </div>
            </div>
            <div className="rodape-form">
              <button className="btn" type="submit" disabled={!doc.projetos.length}>{editando ? "Salvar alterações" : "Adicionar item"}</button>
              {editando && <button className="btn secundario" type="button" onClick={limparForm}>Cancelar</button>}
              <span className="dica">Arraste as linhas para reordenar ou mover entre projetos</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
