# 10 — Estratégia de Segurança

## Identidade e acesso

| Controle | Implementação |
|---|---|
| **JWT** | Access token de 15 min, assinado com **ES256** (chave privada no KMS/Secrets Manager e chave pública via JWKS `/.well-known/jwks.json` para os serviços validarem localmente). Claims mínimas: `sub`, `roles`, `rid` (restaurantes), `jti`, `aud`, `iss` |
| **Refresh token** | Opaco (256 bits), guardado só como hash SHA-256, **rotativo**, com detecção de reuso: o reuso revoga a família inteira e força novo login. 30 dias no mobile; no web vai em cookie `HttpOnly; Secure; SameSite=Strict` |
| **OAuth2/OIDC** | Google e Apple validados no backend (assinatura, `aud`, `nonce`). Fluxo PKCE no web |
| **MFA** | TOTP (RFC 6238) obrigatório para Admin e Financeiro; opcional para restaurantes; OTP por SMS para clientes no login sem senha. Passkeys (WebAuthn) na V2 |
| **Autorização** | RBAC (`CUSTOMER`, `COURIER`, `MERCHANT`, `ADMIN`, `SUPPORT`, `FINANCE`) + verificação de posse do recurso (ABAC: o merchant só acessa o `restaurantId` do qual é membro). Política central em guard NestJS |
| **Sessões** | Logout revoga o refresh e põe o `jti` na denylist do Redis; o admin pode derrubar todas as sessões de um usuário |

## Proteção de dados

- **Em trânsito:** TLS 1.2+ (1.3 preferido) em toda a cadeia; HSTS com preload; *certificate pinning* no app (com chaves de backup) para a API.
- **Em repouso:** RDS, S3, EBS e ElastiCache com criptografia KMS. Campos sensíveis (CPF, documentos de entregador, chave PIX) recebem **AES-256-GCM em nível de aplicação** com *envelope encryption* (DEK por registro, cifrada por CMK do KMS). Para busca e unicidade usa-se o HMAC (`cpf_hash`).
- **Cartões:** nunca tocam nossos servidores. O SDK do gateway faz a tokenização no app, o que nos deixa no escopo **PCI DSS SAQ A**.
- **Segredos:** Secrets Manager com rotação automática (RDS a cada 30 dias); nada em variável de ambiente commitada; Gitleaks no CI.
- **Mobile:** tokens em `flutter_secure_storage` (Keychain/Keystore); detecção de root/jailbreak (só para o app do entregador, contra fraude de GPS); ofuscação (`--obfuscate --split-debug-info`); Play Integrity / App Attest.

## OWASP Top 10 (2021) e API Security Top 10

| Risco | Mitigação |
|---|---|
| A01 Broken Access Control / API1 BOLA | Guard de posse em toda rota com `:id`; testes automatizados de autorização por papel; IDs UUID (não sequenciais) |
| A02 Falhas criptográficas | Ver acima; bcrypt/argon2id (`argon2id m=64MB,t=3`) para senhas |
| A03 Injeção | Prisma parametrizado; `$queryRaw` só com template tag; `class-validator` + `whitelist: true, forbidNonWhitelisted: true` |
| A04 Design inseguro | *Threat modeling* (STRIDE) em features de pagamento e saque; limites de negócio (máx. de saques/dia, valor de reembolso por alçada) |
| A05 Configuração | Helmet, CORS com allowlist, Swagger desabilitado em prod, headers de segurança no CloudFront |
| A06 Componentes vulneráveis | Dependabot/Renovate, Trivy, `npm audit --omit=dev` bloqueando High/Critical |
| A07 Autenticação | Rate limit de login (5/min por conta + por IP), bloqueio progressivo, MFA, mensagens genéricas |
| A08 Integridade | Imagens assinadas (Cosign), webhooks com HMAC e checagem de timestamp (anti-replay de 5 min) |
| A09 Logs | Auditoria imutável (S3 Object Lock) para ações administrativas e financeiras; sem PII nos logs (máscara automática) |
| A10 SSRF | Upload só por URL pré-assinada; o backend não busca URLs do usuário; egress controlado por VPC endpoints |
| API4 Consumo de recursos | Paginação obrigatória com `limit ≤ 100`, timeouts, limite de corpo (1 MB) |
| API6 Fluxos de negócio sensíveis | Antiabuso de cupons (device fingerprint + CPF + telefone), *velocity checks* em cadastro |

## Borda

- **AWS WAF**: Managed Rules (Core, KnownBadInputs, SQLi, Linux, AnonymousIpList, BotControl), rate-based rule de 2.000 req/5 min por IP, geo-match (bloqueio ou desafio fora do BR para rotas de checkout)
- **Shield Standard** (Advanced na V3)
- **Rate limit em camadas:** WAF (IP) → API Gateway/NestJS Throttler com Redis (por usuário e rota): login 5/min, OTP 3/10 min, checkout 10/min, busca 120/min

## LGPD

| Requisito | Implementação |
|---|---|
| Base legal | Execução de contrato (pedido), obrigação legal (fiscal) e consentimento (marketing, localização em segundo plano) registrado em `consents` com versão do termo |
| Direitos do titular | `/me/export` (portabilidade), `DELETE /me` (anonimização: nome → "Usuário removido", telefone/e-mail apagados, histórico financeiro mantido pelo prazo legal) |
| Minimização | Localização de entregador retida por 90 dias; o cliente vê só o primeiro nome e a foto do entregador; o entregador vê o endereço completo apenas após a coleta e perde o acesso 1 h depois da entrega; telefone mascarado (*proxy* de chamada) |
| Encarregado (DPO) | Nomeado, com canal publicado; RIPD para tracking e antifraude |
| Incidentes | Plano de resposta com comunicação à ANPD e aos titulares em até 3 dias úteis (Res. CD/ANPD nº 15/2024) |
| Operadores | Contratos (DPA) com gateways, SMS e cloud; dados hospedados em sa-east-1 |

## Programa contínuo

Pentest externo antes do lançamento e a cada semestre · bug bounty privado na V2 · treinamento anual de *secure coding* · revisão de acessos IAM trimestral (least privilege, SSO via IAM Identity Center).
