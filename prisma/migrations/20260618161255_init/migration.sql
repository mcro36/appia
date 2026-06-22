-- CreateTable
CREATE TABLE "Projeto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#6366f1',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Tarefa" (
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
    CONSTRAINT "Tarefa_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lembrete" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tarefaId" TEXT NOT NULL,
    "dispararEm" DATETIME NOT NULL,
    "enviado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lembrete_tarefaId_fkey" FOREIGN KEY ("tarefaId") REFERENCES "Tarefa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MensagemChat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "papel" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "acaoExecutada" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
