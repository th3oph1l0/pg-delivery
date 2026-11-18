# PG Delivery — App do Cliente (Flutter)

Clean Architecture + Feature First + Riverpod 3 + GoRouter + Material 3.

```bash
flutter create --platforms=android,ios --org br.com.pgdelivery .   # gera android/ e ios/ (1ª vez)
flutter pub get
flutter test
flutter run --dart-define=API_URL=http://10.0.2.2:3000/v1 --dart-define=RT_URL=http://10.0.2.2:3000/rt
```

Antes de rodar, configure a chave do Google Maps em `android/app/src/main/AndroidManifest.xml` e `ios/Runner/AppDelegate.swift`.

| Pasta | Conteúdo |
|---|---|
| `lib/core/design_system` | Tokens, tema claro/escuro e componentes (PgButton, PgSkeleton, PgStatusBadge) |
| `lib/core/network` | Dio com refresh de token em fila, Idempotency-Key e problem+json |
| `lib/features/home` | Home com lojas próximas, skeleton, pull-to-refresh e cache offline |
| `lib/features/cart` | Sacola (regras de domínio testadas) e checkout PIX idempotente |
| `lib/features/orders` | Tracking em tempo real (Socket.IO + Google Maps) com anúncios para leitor de tela |
| `lib/features/auth` | Login (e-mail; Google, Apple e OTP como próximos passos) |

O app do entregador reaproveita `core/` (veja `docs/02-estrutura-de-pastas.md`).
