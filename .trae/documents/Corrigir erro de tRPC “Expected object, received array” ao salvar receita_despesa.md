## Causa
- O backend tRPC (Express) espera **array batch** somente quando a URL tem `?batch=1`.
- O helper do frontend envia o corpo como **array** (`[{ id, json }]`) em `apps/web/src/lib/trpc.ts:113-121`, mas constrói a URL **sem** `?batch=1` (`apps/web/src/lib/trpc.ts:99`), então o servidor trata como chamada simples e repassa o **array** direto ao Zod.
- O schema da `addTransaction` exige **objeto** (`apps/server/src/routes/trpc.ts:100-112`), daí o erro: “Expected object, received array”.

## Mudança proposta
- Ajustar o helper `trpcFetch` para alinhar **URL e payload**:
  1) Manter payload como **array**.
  2) Acrescentar `?batch=1` à URL ao montar `baseUrl/procedure`.
- Alternativa (se preferir não usar batch): enviar um **objeto** (`{ id: 1, json: input }`) e **não** usar `?batch=1`. Vou seguir a primeira opção para compatibilidade com o parsing já implementado.

## Arquivos a alterar
- `apps/web/src/lib/trpc.ts`
  - Construção da URL: `const url = \`${baseUrl}/${procedure}?batch=1\``.
  - Conferir o parsing da resposta, que já trata arrays (`linhas 187-215`).

## Validação
- Dev: iniciar frontend e backend, abrir `/dashboard`.
- Ações:
  - Adicionar Receita e Despesa: verificar requisição `POST /trpc/addTransaction?batch=1` com status 200 e resposta em array.
  - Confirmar que os cards de resumo atualizam sem erro.
- Produção: após deploy, testar as mesmas ações no domínio e observar ausência do modal de erro.

## Riscos e rollback
- Baixo risco: alteração isolada de URL no helper.
- Se houver impacto inesperado, voltar a URL sem `?batch=1` e trocar o corpo para **objeto** (plano B).