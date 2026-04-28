# PRD Enxuto - Camada Social + Competicao (Estilo Orkut) - MakerConnect

## 1) Objetivo do produto
Construir uma camada social maker com foco em colaboracao tecnica e competicao de robotica, permitindo:
- perfil de usuario com historico competitivo;
- publicacao de projetos com interacao social;
- criacao de equipes;
- criacao de comunidades publicas e privadas;
- registro de campeonatos, partidas e ranking.

A proposta combina dinamica social inspirada em comunidades classicas com governanca tecnica de projetos IoT.

## 2) Escopo MVP fechado

## 2.1 Dentro do MVP (P0)
1. Cadastro e perfil de usuario maker.
2. Publicacao de projeto social com curtida e comentario.
3. Cadastro de robo por usuario/equipe.
4. Registro de partidas (vitoria, derrota, empate) por robo.
5. Ranking simples por robo e por usuario.
6. Criacao de equipe com papeis basicos.
7. Criacao de comunidade publica ou privada.
8. Entrada em comunidade por solicitacao/aprovacao quando privada.

## 2.2 Fora do MVP (P1+)
1. Mensageria em tempo real 1:1.
2. Video ao vivo e streaming.
3. Chaveamento automatico avancado de campeonato.
4. Recomendacao IA social personalizada no feed.
5. Sistema completo de monetizacao/assinaturas.

## 2.3 Metas de sucesso do MVP
1. Pelo menos 1 fluxo completo executavel por usuario:
- criar perfil -> publicar projeto -> registrar robo -> registrar partida -> entrar em comunidade.
2. 95% das operacoes criticas com resposta de API sem erro de regra de negocio.
3. Ranking atualizado de forma consistente apos registro de partida.

## 3) Personas principais
1. Maker Individual: publica projeto, registra robo e acompanha desempenho.
2. Lider de Equipe: organiza membros, robos e participacao em campeonato.
3. Moderador de Comunidade: administra entrada, regras e conteudo.

## 4) Entidades principais (modelo minimo)

## 4.1 Identidade e social
1. users
- id, name, email, password_hash, bio, hardware_stack, badges_json, created_at
2. posts
- id, author_id, project_id nullable, content, visibility, created_at
3. post_comments
- id, post_id, author_id, content, created_at
4. post_reactions
- id, post_id, user_id, reaction_type, created_at
- Regra: uma reacao por usuario por post

## 4.2 Projetos
1. projects
- id, owner_id, title, category, summary, parent_project_id nullable, visibility, created_at
2. project_collaborators
- id, project_id, user_id, role, created_at

## 4.3 Robotica e competicao
1. robots
- id, owner_user_id nullable, owner_team_id nullable, name, class, season_year, status
- Regra: um robo deve pertencer a usuario ou equipe
2. robot_matches
- id, robot_id, opponent_name, championship_id nullable, result, score_for, score_against, played_at
- result em: win, loss, draw
3. championships
- id, name, season_year, location, organizer_user_id, status

## 4.4 Equipes e comunidades
1. teams
- id, name, description, captain_user_id, visibility, created_at
2. team_members
- id, team_id, user_id, role, status, joined_at
3. communities
- id, name, description, owner_user_id, type, rules_text, created_at
- type em: public, private
4. community_members
- id, community_id, user_id, role, status, created_at
- status em: requested, approved, rejected

## 5) Endpoints principais (API v1)

## 5.1 Identidade
1. POST /api/v1/auth/register
2. POST /api/v1/auth/login
3. GET /api/v1/users/{userId}
4. PATCH /api/v1/users/{userId}

## 5.2 Social
1. POST /api/v1/posts
2. GET /api/v1/feed?category=&page=&visibility=
3. POST /api/v1/posts/{postId}/comments
4. POST /api/v1/posts/{postId}/reactions
5. DELETE /api/v1/posts/{postId}/reactions

## 5.3 Projetos
1. POST /api/v1/projects
2. GET /api/v1/projects/{projectId}
3. POST /api/v1/projects/{projectId}/fork
4. POST /api/v1/projects/{projectId}/collaborators

## 5.4 Robos e partidas
1. POST /api/v1/robots
2. GET /api/v1/robots/{robotId}
3. POST /api/v1/robots/{robotId}/matches
4. GET /api/v1/robots/{robotId}/stats

## 5.5 Ranking e campeonatos
1. GET /api/v1/leaderboards/robots?season=
2. GET /api/v1/leaderboards/users?season=
3. POST /api/v1/championships
4. GET /api/v1/championships/{championshipId}

## 5.6 Equipes
1. POST /api/v1/teams
2. POST /api/v1/teams/{teamId}/members/invite
3. PATCH /api/v1/teams/{teamId}/members/{memberId}
4. GET /api/v1/teams/{teamId}

## 5.7 Comunidades
1. POST /api/v1/communities
2. GET /api/v1/communities/{communityId}
3. POST /api/v1/communities/{communityId}/join
4. PATCH /api/v1/communities/{communityId}/membership/{membershipId}
5. POST /api/v1/communities/{communityId}/posts

## 6) Criterios de aceite por funcionalidade

## F1. Cadastro e perfil
1. Usuario cria conta e autentica com sucesso.
2. Usuario edita bio e hardware stack.
3. Perfil retorna estatisticas basicas de robos e partidas.

## F2. Post social de projeto
1. Usuario autenticado publica post vinculado ou nao a projeto.
2. Feed lista post com paginacao e filtro por categoria.
3. Reacao respeita unicidade por usuario/post.

## F3. Cadastro de robo
1. Robo pode ser associado a usuario ou equipe.
2. Campos obrigatorios validados no backend.
3. Robo aparece em listagem e detalhe apos criacao.

## F4. Registro de partida e estatisticas
1. Partida salva com resultado valido (win/loss/draw).
2. Estatisticas do robo atualizam corretamente apos nova partida.
3. Tentativa de dado inconsistente retorna erro de regra de negocio.

## F5. Ranking
1. Ranking de robos ordena por criterio definido (ex.: pontos, saldo, vitorias).
2. Ranking de usuarios agrega desempenho dos robos.
3. Recalculo mantem consistencia apos novos resultados.

## F6. Equipes
1. Lider cria equipe e convida membros.
2. Membro aceita convite e passa a status ativo.
3. Permissoes de papel basico aplicadas (capitao x membro).

## F7. Comunidades publicas/privadas
1. Dono cria comunidade com tipo public ou private.
2. Em comunidade publica, entrada ocorre diretamente.
3. Em comunidade privada, entrada depende de aprovacao.
4. Somente membros aprovados publicam na comunidade.

## 7) Backlog pronto (Epic > Story > Sub-task)

## Epic E1 - Identidade e Perfil Maker
Story E1-S1 - Cadastro e autenticacao
- T1: Criar tabela users e indice unico de email.
- T2: Implementar endpoint de registro.
- T3: Implementar endpoint de login com token.
- T4: Testes de validacao de credenciais.

Story E1-S2 - Perfil com stack tecnico
- T1: Endpoint GET de perfil.
- T2: Endpoint PATCH de perfil.
- T3: Exibir hardware stack e badges no frontend.

## Epic E2 - Feed Social de Projetos
Story E2-S1 - Publicacao de post
- T1: Criar tabela posts.
- T2: Endpoint POST de post.
- T3: Validar visibilidade e autor.

Story E2-S2 - Interacao social
- T1: Criar tabelas post_comments e post_reactions.
- T2: Endpoint de comentario.
- T3: Endpoint de reacao com regra de unicidade.
- T4: Endpoint de remoção de reacao.

Story E2-S3 - Feed com filtro
- T1: Endpoint GET feed com paginacao.
- T2: Filtro por categoria e visibilidade.
- T3: Componente de feed no frontend.

## Epic E3 - Robos, Partidas e Ranking
Story E3-S1 - Cadastro de robo
- T1: Criar tabela robots.
- T2: Endpoint POST e GET de robo.
- T3: Validar vinculo owner_user_id ou owner_team_id.

Story E3-S2 - Registro de partidas
- T1: Criar tabela robot_matches.
- T2: Endpoint POST de partidas.
- T3: Regras de resultado valido e integridade dos dados.

Story E3-S3 - Estatisticas e ranking
- T1: Endpoint GET stats por robo.
- T2: Endpoint leaderboard de robos.
- T3: Endpoint leaderboard de usuarios.
- T4: Job de recomputo de ranking (fila).

## Epic E4 - Equipes
Story E4-S1 - Criacao e gestao de equipe
- T1: Criar tabelas teams e team_members.
- T2: Endpoint de criacao de equipe.
- T3: Endpoint de convite e aceitacao.

Story E4-S2 - Permissoes basicas por papel
- T1: Definir papeis captain e member.
- T2: Aplicar middleware de autorizacao.
- T3: Testar cenarios de permissao.

## Epic E5 - Comunidades Publicas e Privadas
Story E5-S1 - Criacao de comunidade
- T1: Criar tabelas communities e community_members.
- T2: Endpoint de criacao com tipo public/private.
- T3: Persistir regras da comunidade.

Story E5-S2 - Fluxo de adesao
- T1: Endpoint join para comunidades.
- T2: Endpoint aprovacao/rejeicao para privadas.
- T3: Garantir status requested/approved/rejected.

Story E5-S3 - Conteudo em comunidade
- T1: Endpoint de post da comunidade.
- T2: Restricao para membros aprovados.
- T3: Listagem de posts por comunidade.

## Epic E6 - Governanca minima e observabilidade
Story E6-S1 - Auditoria basica
- T1: Logar alteracoes em resultado de partida.
- T2: Logar acoes de aprovacao/rejeicao em comunidade.
- T3: Expor consulta basica de eventos para administracao.

Story E6-S2 - Saude operacional
- T1: Healthcheck de API.
- T2: Log estruturado de erros.
- T3: Dashboard basico de falhas por endpoint.

## 8) Sequencia de implementacao sugerida (3 ondas)
1. Onda 1: E1 + E2 + E5-S1/S2 (base social e comunidade).
2. Onda 2: E3 + E4 (competicao e organizacao por equipe).
3. Onda 3: E5-S3 + E6 (governanca e robustez minima).

## 9) Riscos e mitigacao
1. Escopo social crescer rapido demais.
- Mitigacao: congelar MVP no que esta definido em P0.
2. Inconsistencia de ranking com alto volume de partidas.
- Mitigacao: recalculo assíncrono com job idempotente.
3. Moderacao insuficiente em comunidade publica.
- Mitigacao: papeis de moderacao e trilha basica de auditoria.

## 10) Definicao de pronto (MVP)
1. Todos os fluxos P0 funcionando ponta a ponta.
2. Endpoints principais com testes de regra de negocio.
3. Evidencia de ranking consistente apos lote de partidas.
4. Comunidade publica e privada validada com controle de adesao.
5. Backlog P1 explicitamente separado sem contaminar entrega.
