/*
  Warnings:

  - You are about to drop the `Projeto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `projetoId` on the `Tarefa` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Projeto";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tarefa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL DEFAULT 'atividade',
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "prazo" DATETIME,
    "prioridade" TEXT NOT NULL DEFAULT 'media',
    "status" TEXT NOT NULL DEFAULT 'a_fazer',
    "recorrencia" TEXT NOT NULL DEFAULT 'none',
    "recorrenciaAte" DATETIME,
    "dataInicio" DATETIME,
    "duracaoMin" INTEGER,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" DATETIME NOT NULL,
    "tarefaPaiId" TEXT,
    CONSTRAINT "Tarefa_tarefaPaiId_fkey" FOREIGN KEY ("tarefaPaiId") REFERENCES "Tarefa" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tarefa" ("atualizadaEm", "criadaEm", "dataInicio", "descricao", "duracaoMin", "id", "prazo", "prioridade", "recorrencia", "recorrenciaAte", "status", "tarefaPaiId", "titulo") SELECT "atualizadaEm", "criadaEm", "dataInicio", "descricao", "duracaoMin", "id", "prazo", "prioridade", "recorrencia", "recorrenciaAte", "status", "tarefaPaiId", "titulo" FROM "Tarefa";
DROP TABLE "Tarefa";
ALTER TABLE "new_Tarefa" RENAME TO "Tarefa";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
