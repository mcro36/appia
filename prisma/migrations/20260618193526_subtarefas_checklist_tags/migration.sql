-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#6366f1'
);

-- CreateTable
CREATE TABLE "TarefaTag" (
    "tarefaId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("tarefaId", "tagId"),
    CONSTRAINT "TarefaTag_tarefaId_fkey" FOREIGN KEY ("tarefaId") REFERENCES "Tarefa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TarefaTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tarefaId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChecklistItem_tarefaId_fkey" FOREIGN KEY ("tarefaId") REFERENCES "Tarefa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TarefaDep" (
    "tarefaId" TEXT NOT NULL,
    "dependeDeId" TEXT NOT NULL,

    PRIMARY KEY ("tarefaId", "dependeDeId"),
    CONSTRAINT "TarefaDep_tarefaId_fkey" FOREIGN KEY ("tarefaId") REFERENCES "Tarefa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TarefaDep_dependeDeId_fkey" FOREIGN KEY ("dependeDeId") REFERENCES "Tarefa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tarefa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "prazo" DATETIME,
    "prioridade" TEXT NOT NULL DEFAULT 'media',
    "status" TEXT NOT NULL DEFAULT 'a_fazer',
    "recorrencia" TEXT NOT NULL DEFAULT 'none',
    "recorrenciaAte" DATETIME,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" DATETIME NOT NULL,
    "projetoId" TEXT,
    "tarefaPaiId" TEXT,
    CONSTRAINT "Tarefa_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tarefa_tarefaPaiId_fkey" FOREIGN KEY ("tarefaPaiId") REFERENCES "Tarefa" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tarefa" ("atualizadaEm", "criadaEm", "descricao", "id", "prazo", "prioridade", "projetoId", "recorrencia", "recorrenciaAte", "status", "titulo") SELECT "atualizadaEm", "criadaEm", "descricao", "id", "prazo", "prioridade", "projetoId", "recorrencia", "recorrenciaAte", "status", "titulo" FROM "Tarefa";
DROP TABLE "Tarefa";
ALTER TABLE "new_Tarefa" RENAME TO "Tarefa";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Tag_nome_key" ON "Tag"("nome");
