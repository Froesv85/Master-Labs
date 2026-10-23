<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Regras do projeto MakerConnect

Antes de mudar código, leia o [README.md](README.md) desta pasta (rodar, testar, deploy, dívida técnica).

## Toda rota de API nova ou alterada
- O `proxy.ts` só garante que existe sessão. **Dentro da rota**, pegue o usuário de `getSession()` (nunca de `userId` no corpo) e cheque a permissão com `requireOwnedProject` (escrita) ou `canAccessProject` / `projectVisibilityWhere` (leitura), de `lib/project-access.ts`.
- Rota que precisa ser pública? Adicione-a explicitamente às listas de `proxy.ts` e justifique no comentário.
- Ao devolver usuários, use `select` explícito. Nunca devolva `password`, `googleId`, `githubId` nem `role`; o e-mail só para o próprio usuário.
- Ações caras (IA, PDF) ou sensíveis a força bruta passam por `checkRateLimit` (`lib/rate-limit.ts`).
- Escreva testes de 401 (sem sessão) e 403 (não dono) em `__tests__/api/`, mockando `@/lib/auth`.

## Dados pessoais e páginas legais
- Texto que vai para a IA passa por `anonymizePii` (`lib/lgpd.ts`).
- Mudou a coleta de dados, cookies, fornecedores ou o uso de IA? Atualize `app/privacidade/page.tsx` e `LEGAL_UPDATED_AT` em `components/legal-page.tsx`.

## Ambiente
- `backend/` é legado e não é usado; a API são as rotas em `app/api/`.
- O disco D: desta máquina é FAT32: `next build` falha com `EISDIR ... readlink`. Faça o build em uma cópia em disco NTFS.
