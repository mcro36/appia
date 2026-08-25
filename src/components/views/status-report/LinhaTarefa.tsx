import { isAtrasada, type TarefaDTO } from "@/lib/tarefas";
import { STATUS_LABEL } from "@/lib/tarefas-display";
import { isCor, type Cor } from "@/lib/statusReport";
import { Celula, CorPicker } from "@/components/views/status-report/celulas";

// Selo derivado do status REAL da tarefa, usando as cores do .sr (report).
export function seloDerivado(t: TarefaDTO): { cor: Cor; texto: string } {
  if (isAtrasada(t)) return { cor: "vermelho", texto: "Atrasado" };
  const map: Record<TarefaDTO["status"], Cor> = { a_fazer: "cinza", em_andamento: "amarelo", concluido: "verde" };
  return { cor: map[t.status], texto: STATUS_LABEL[t.status] };
}

type CampoSR = "sc" | "statusReportNota" | "statusReportNotaCor" | "proximoPasso";

// Linha de uma TAREFA marcada no Status Report (híbrida): identidade/selo vêm da
// tarefa; SC/Contrato, nota e próximo passo são editáveis (persistem na tarefa).
export function LinhaTarefa({
  tarefa, alt, ed, projetoEmEdicao, onEdit, onCampo, onDesmarcar, onAbrir,
}: {
  tarefa: TarefaDTO;
  alt: boolean;
  ed: boolean;
  projetoEmEdicao: boolean;
  onEdit: () => void;
  onCampo: (patch: Partial<Record<CampoSR, string | null>>) => void;
  onDesmarcar: () => void;
  onAbrir?: (t: TarefaDTO) => void;
}) {
  const selo = seloDerivado(tarefa);
  const nota = tarefa.statusReportNota?.trim() ?? "";
  const notaCor: Cor = isCor(tarefa.statusReportNotaCor) ? tarefa.statusReportNotaCor : "nenhum";
  return (
    <tr
      className={`item${alt ? " alt" : ""}${ed ? " editando" : ""}`}
      onDoubleClick={() => { if (projetoEmEdicao) onEdit(); }}
    >
      <td>
        <button type="button" className="desc-link" onClick={() => onAbrir?.(tarefa)} title="Abrir a tarefa">
          {tarefa.titulo}
        </button>
      </td>
      <td>
        {ed ? (
          <input className="desc-input" value={tarefa.sc ?? ""} placeholder="SC / Contrato" aria-label="SC / Contrato"
            onChange={(e) => onCampo({ sc: e.target.value })} />
        ) : (tarefa.sc ? <span className="proximo-texto">{tarefa.sc}</span> : null)}
      </td>
      <td>
        {ed ? (
          <div className="celula-edit">
            <input className={`selo-input ${notaCor}`} value={tarefa.statusReportNota ?? ""} placeholder={selo.texto} aria-label="Nota de status"
              onChange={(e) => onCampo({ statusReportNota: e.target.value })} />
            <CorPicker cor={notaCor} aria="nota de status" onCor={(c) => onCampo({ statusReportNotaCor: c })} />
          </div>
        ) : (nota
          ? <Celula texto={nota} cor={notaCor} />
          : <span className={`selo ${selo.cor}`}>{selo.texto}</span>
        )}
      </td>
      <td>
        {ed ? (
          <input className="desc-input" value={tarefa.proximoPasso ?? ""} placeholder="Próximo passo" aria-label="Próximo passo"
            onChange={(e) => onCampo({ proximoPasso: e.target.value })} />
        ) : (tarefa.proximoPasso ? <span className="proximo-texto">{tarefa.proximoPasso}</span> : null)}
      </td>
      <td>
        {projetoEmEdicao && (
          <div className="ferramentas">
            <button className="icone perigo" type="button" title="Remover do Status Report" onClick={onDesmarcar}>
              📌
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
