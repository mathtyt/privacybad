# Verificação da entrega

Executada em 07/11/2026 com Node 24, PostgreSQL 17 em container isolado e Chromium.

- `npm run build`: aprovado, sem erros ou avisos no build final.
- `npm run typecheck`: aprovado, strict mode.
- `npm test`: 7 testes aprovados (autorização, sessão inválida/expirada, CSRF, limites, HTTPS e consentimento).
- `npm run test:e2e`: 10 testes aprovados, em Pixel 7 e desktop. Incluem recusa de câmera/GPS, descarte sem envio, proteção de APIs, captura manual com dispositivo virtual do Chromium, GPS autorizado, revisão, envio, exclusão pelo participante e ciclo de vida real com PostgreSQL/filesystem.
- Ciclo de vida: imagem anônima bloqueada; imagem autenticada disponível; arquivo e registro removidos na exclusão; expiração bloqueia leitura; exclusão total e logout funcionais.
- `npm run db:migrate`: migração aplicada e depois verificada sem pendências.
- `npm run cleanup`: executado com sucesso.
- `npm audit`: zero vulnerabilidades reportadas, incluindo ferramentas de desenvolvimento, na data da verificação.
- `npm start`: inicialização real do build de produção aprovada. Chromium verificou hidratação, CSP com nonce sem unsafe-eval e fluxo de continuação sem compartilhamento.
- Layout público inspecionado em 1440px e 390px; capturas em `docs/screenshots`.

Os testes usam dados artificiais e banco isolado, sem dados de participantes reais. As funções de câmera/GPS de produção usam APIs nativas. A câmera virtual e as coordenadas configuradas existem somente no ambiente de testes. Hardware físico, certificado HTTPS e infraestrutura do destino precisam de conferência antes da apresentação. Nenhum deploy público foi realizado.

A retenção exige o worker ativo: acesso bloqueado ao vencer 24h; remoção física na próxima varredura de até 1 minuto. Configure ausência de backups permanentes e monitoramento conforme README.
