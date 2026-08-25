import type { ItemStatus } from "@/lib/statusReport";
import { Celula, CorPicker } from "@/components/views/status-report/celulas";

type DragCfg = {
  ativo: boolean;            // modo de edição do projeto: mostra a pega e habilita arrastar
  arrastando: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
};

// Linha MANUAL (avulsa) do Status Report: texto livre + cor manual, como antes.
// Coluna única "SC / Contrato" (selo com cor).
export function LinhaManual({
  item, alt, ed, numero, projetoEmEdicao, drag, onEdit, onDelete, onCampo,
}: {
  item: ItemStatus;
  alt: boolean;
  ed: boolean;
  numero: number;
  projetoEmEdicao: boolean;
  drag?: DragCfg;
  onEdit: () => void;
  onDelete: () => void;
  onCampo: (patch: Partial<ItemStatus>) => void;
}) {
  const arrastavel = !!drag?.ativo && !ed;
  return (
    <tr
      className={`item${alt ? " alt" : ""}${ed ? " editando" : ""}${drag?.arrastando ? " arrastando" : ""}`}
      draggable={arrastavel}
      onDoubleClick={() => { if (projetoEmEdicao) onEdit(); }}
      onDragStart={() => { if (arrastavel) drag?.onDragStart(); }}
      onDragEnd={() => drag?.onDragEnd()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => drag?.onDrop()}
    >
      <td>
        {ed ? (
          <div className="celula-edit">
            <span className="num">{numero}</span>
            <input className="desc-input" value={item.descricao} placeholder="Descrição do item" aria-label="Descrição" autoFocus
              onChange={(e) => onCampo({ descricao: e.target.value })} />
          </div>
        ) : (
          <>
            {drag?.ativo && <span className="pega" title="Arraste para reordenar">⠿ </span>}
            <span className="num">Item {numero}</span>
            <span className="desc-sep">–</span>{item.descricao}
          </>
        )}
      </td>
      <td>
        {ed ? (
          <div className="celula-edit">
            <input className={`selo-input ${item.corSc}`} value={item.sc} placeholder="SC / Contrato" aria-label="SC / Contrato"
              onChange={(e) => onCampo({ sc: e.target.value })} />
            <CorPicker cor={item.corSc} aria="SC / Contrato" onCor={(c) => onCampo({ corSc: c })} />
          </div>
        ) : <Celula texto={item.sc} cor={item.corSc} />}
      </td>
      <td>
        {ed ? (
          <div className="celula-edit">
            <input className={`selo-input ${item.corStatus}`} value={item.status} placeholder="Status" aria-label="Status"
              onChange={(e) => onCampo({ status: e.target.value })} />
            <CorPicker cor={item.corStatus} aria="Status" onCor={(c) => onCampo({ corStatus: c })} />
          </div>
        ) : <Celula texto={item.status} cor={item.corStatus} />}
      </td>
      <td>
        {ed ? (
          <input className="desc-input" value={item.proximoPasso} placeholder="Próximo passo" aria-label="Próximo passo"
            onChange={(e) => onCampo({ proximoPasso: e.target.value })} />
        ) : (item.proximoPasso ? <span className="proximo-texto">{item.proximoPasso}</span> : null)}
      </td>
      <td>
        {projetoEmEdicao && (
          <div className="ferramentas">
            <button className="icone perigo" type="button" title="Excluir" onClick={onDelete}>✕</button>
          </div>
        )}
      </td>
    </tr>
  );
}
