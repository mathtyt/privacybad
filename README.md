# CYBER AWARENESS

Aplicação universitária funcional sobre engenharia social e privacidade. Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4, PostgreSQL/Prisma, Zod, Sharp, Leaflet e Lucide. Não requer nem coleta credenciais do visitante.

## Iniciar

Requisitos: Node.js 22+, npm, PostgreSQL 16+ e um diretório privado gravável. Acesso à câmera/GPS requer localhost ou HTTPS; um endereço HTTP na rede local não é suficiente no celular.

```sh
npm ci
cp .env.example .env
npm run admin:hash
openssl rand -base64 48
```

Edite `.env`: configure `DATABASE_URL`, `ADMIN_USERNAME`, o hash bcrypt gerado (em arquivos `.env` do Next.js, escape cada `$` como `\$`, pois dotenv-expand interpola até strings entre aspas; no painel de segredos do provedor use o hash original, sem escape), `SESSION_SECRET` com pelo menos 32 caracteres aleatórios, `APP_ORIGIN` com a origem exata e `PRIVATE_STORAGE_PATH`. Não coloque senha em argumentos do shell; o gerador lê stdin e oculta a entrada interativa. Não existe senha padrão, cadastro público ou autenticação pelo endereço secreto.

```sh
npm run db:migrate
npm run dev
```

Abra http://localhost:3000. Digite `/gagueio` manualmente para administrar. Não existe `/admin` ou link público para o painel. Em outro terminal execute `npm run worker`, inclusive em desenvolvimento se quiser testar a expiração sem abrir o painel. Mantenha as credenciais fora do Git.

## Fluxo real de consentimento

1. A página inicial não abre câmera nem GPS e não transmite metadados técnicos.
2. Cada permissão exige seu próprio clique. A câmera exibe vídeo e captura apenas quando o participante clica em **Capturar foto**. GPS usa somente `getCurrentPosition` com alta precisão, timeout de 15s e cache zero.
3. Até a revisão, foto, coordenadas e metadados ficam apenas na memória da aba. Refazer/descartar remove a seleção; tracks encerram após captura, cancelamento e desmontagem.
4. A revisão mostra os dados e informa acesso administrativo e retenção. Somente **Confirmar e enviar** faz POST multipart, com ou sem foto/GPS.
5. O servidor valida consentimento, limites e campos, reprocessa a imagem com Sharp (remove EXIF e conteúdo anexado), cria UUID e retorna um token de exclusão de 256 bits. Somente o hash do token é salvo. O token permanece na memória da aba; fechar/recarregar perde o comprovante, mas a retenção continua valendo.
6. A revelação explica HTTPS, engenharia social, permissões e revogação. O participante pode excluir imediatamente sua participação sem autenticação administrativa usando o comprovante secreto.

## APIs

| Método / rota | Autorização / comportamento |
| --- | --- |
| `POST /api/demo` | Origem exata, consentimento, multipart `metadata` JSON + `photo` opcional |
| `DELETE /api/demo/[id]` | Origem exata + `Authorization: Bearer <deletionToken>` |
| `POST /api/admin/login` | Origem exata, JSON username/password, limite 10 tentativas/15 min |
| `POST /api/admin/logout` | Sessão + origem, remove cookie |
| `GET /api/admin/records` | Sessão, até 200 registros recentes e total ativo |
| `DELETE /api/admin/records` | Sessão + origem, exclui todos definitivamente |
| `DELETE /api/admin/records/[id]` | Sessão + origem, exclui registro e arquivo |
| `GET /api/admin/records/[id]/photo` | Sessão, imagem privada com no-store, expiração verificada |

Cookie HttpOnly, SameSite=Strict, Secure em produção, JWT HS256 com emissor/audiência e expiração de 2h. Logout remove o cookie do navegador; um token previamente copiado permanece válido até expirar. Para revogar todas as sessões imediatamente, rotacione `SESSION_SECRET`. Middleware (convenção `proxy.ts` do Next.js 16) verifica assinatura; todas as APIs administrativas repetem autorização no servidor. A página `/gagueio` entrega somente login quando anônima, com noindex/nofollow. CSRF é bloqueado por verificação de Origin em toda mutação, além de SameSite.

Rate limiting usa UPSERT atômico no PostgreSQL e funciona entre processos. Os limites são deliberadamente globais por operação, sem confiar em IP enviado pelo visitante: login 10/15min, submissões 60/min e exclusões do participante 100/min. Esse orçamento protege um evento universitário pequeno, mas permite indisponibilidade temporária provocada por terceiros. Para evento maior, ajuste os valores e complemente no proxy com limite por IP confiável. Não há coleta nem persistência de IP na aplicação.

Payload máximo real de 1.200.000 bytes (leitura limitada do stream); foto até 1 MiB, JPEG/WebP, máximo 16MP decodificados e normalização a JPEG 1280px. Imagens ficam fora de `public/`, com diretório 0700 e arquivos 0600. Coordenadas e fotos não aparecem em URLs públicas nem logs da aplicação. Logs de auditoria registram apenas eventos e horário, sem corpo ou identificadores. Desative logs de corpos/requisições e captura de erros com payload também no provedor/proxy/APM.

CSP usa nonce por resposta, sem `unsafe-inline` para scripts em produção; estilos inline são permitidos para Leaflet/React. Headers incluem HSTS em produção, nosniff, frame-ancestors, X-Frame-Options, no-referrer e Permissions-Policy. Conteúdo recebido é renderizado como texto React. Não há fingerprint persistente nem analytics.

## Exclusão e retenção

`expiresAt` é 24h após o recebimento. APIs nunca mostram registros/fotos vencidos. Execute o worker continuamente: varre em lotes a cada minuto, remove arquivo antes da linha e repete se ocorrer erro. Portanto a inacessibilidade é imediata ao vencer; a remoção física ocorre na próxima varredura (até cerca de 1 minuto depois, se o worker estiver saudável). Para exigência de eliminação física precisamente em 24h, configure retenção inferior a 24h e monitoramento do worker. `npm run cleanup` executa uma varredura completa avulsa.

Exclusões individuais/totais removem o arquivo e a linha. Falha no disco preserva a linha para retry. O armazenamento precisa ser compartilhado entre web e worker. Não habilite snapshots/backups permanentes do volume de fotos nem do banco desta demonstração. Exclusão lógica não apaga instantaneamente páginas antigas do disco, WAL ou snapshots de infraestrutura: configure o provedor com retenção mínima, criptografia e política de descarte compatível. Uma queda entre escrita do arquivo e commit do banco pode deixar arquivo órfão; a varredura também remove arquivos não referenciados com mais de 24 horas. Nunca use os dados reais da apresentação como fixtures ou backups de desenvolvimento.

## Produção e deploy

Serviço recomendado: VM/container Node com PostgreSQL e volume privado persistente (por exemplo, Render com disco e worker na mesma instância, ou VPS com Docker Compose). Este projeto usa filesystem privado e não deve ir a serverless com disco efêmero. Para múltiplas instâncias, monte o mesmo volume privado; alternativamente implemente armazenamento S3 privado preservando o contrato de autorização. Não envie o diretório para um CDN.

```sh
npm ci
npm run db:migrate
npm run build
npm start
# outro processo supervisionado, mesmo ambiente e volume:
npm run worker
```

Configure `APP_ORIGIN=https://seu-dominio`, domínio e TLS no proxy. Em produção toda API verifica HTTPS pelo `x-forwarded-proto`; o proxy deve sobrescrever esse header e o app deve aceitar tráfego somente dele. `Caddyfile` é um exemplo de TLS automático. O arquivo contém domínio ilustrativo: substitua. No deploy, crie os segredos pelo painel do provedor, nunca por variáveis `NEXT_PUBLIC_*`. Configure no proxy o mesmo limite de payload ou menor e não registre corpos.

### Docker Compose

Defina também `POSTGRES_PASSWORD` forte em `.env`, evitando caracteres que precisem de URL-encoding na URL do exemplo, e configure `DATABASE_URL` para ferramentas locais. Em produção `.env` deve usar `APP_ORIGIN=https://…`.

```sh
docker compose build
docker compose up -d db
docker compose run --rm web npm run db:migrate
docker compose up -d web cleanup
```

Web e banco são expostos só em loopback. Instale Caddy na VM e encaminhe 80/443 ao domínio. Volumes `postgres` e `private-photos` não devem ter backups permanentes. Supervise o worker, espaço livre e falhas de exclusão. O build não precisa de dados nem credenciais reais, mas o runtime exige configuração válida. Não publique a apresentação com dados de testes.

## Verificações

```sh
npm run typecheck
npm test
npm run build
# requer Chromium instalado; configure CHROMIUM_PATH se necessário
npm run dev
npm run test:e2e
```

Os testes de permissões negadas substituem as APIs de hardware somente no navegador de testes para reproduzir a recusa; produção usa APIs reais. Os testes de ciclo de vida usam PostgreSQL e filesystem reais. **Execute-os somente em banco exclusivo de testes: o cenário de exclusão total remove todos os registros desse banco.** Com o servidor de desenvolvimento rodando, configure `DATABASE_URL`, `PRIVATE_STORAGE_PATH`, `ADMIN_USERNAME` e `TEST_ADMIN_PASSWORD` para a mesma instância e credenciais. Essa senha deve corresponder ao hash do servidor, nunca ser uma senha real de produção.

```sh
TEST_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
```

Sem `TEST_ADMIN_PASSWORD`/`DATABASE_URL`, somente o teste de integração é marcado como ignorado. Testes cobrem autorização ausente/falsificada/expirada, CSRF, limite de bytes, consentimento, permissões negadas, descarte sem rede, imagem privada, exclusão individual/pelo participante/em lote e expiração. Captura física de câmera e GPS precisa ser validada manualmente em um celular real via HTTPS antes da apresentação; browser automatizado não demonstra disponibilidade do hardware do participante.

## Estrutura

```text
src/app/                    páginas, layout e estilos
src/app/gagueio/            entrada privada (login ou dashboard)
src/app/api/demo/           envio e exclusão pelo participante
src/app/api/admin/          login, logout, registros e fotos privadas
src/components/            experiência pública, dashboard e mapa
src/lib/                   banco, autenticação, validação, segurança e armazenamento
src/proxy.ts          CSP por nonce e primeira barreira administrativa
prisma/                    schema e migração PostgreSQL
scripts/                   hash de senha e worker de retenção
tests/                     testes unitários e Playwright
compose.yaml, Dockerfile   deploy com PostgreSQL e volume compartilhado
Caddyfile                  exemplo de proxy HTTPS
.env.example               configuração sem segredos
```

O mapa só carrega após escolha do administrador: OpenStreetMap recebe IP e área visualizada. Não são enviados fotos, IDs, coordenadas em query strings ou dados ao geocodificador; os tiles solicitados permitem inferir a região visualizada. Para privacidade completa do provedor cartográfico, hospede tiles próprios e ajuste CSP/URL.
"# cyber" 
