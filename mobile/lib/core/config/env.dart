/// Configuração por flavor via --dart-define (dev / staging / prod).
/// flutter run --dart-define=API_URL=https://api.pgdelivery.com.br/v1
abstract final class Env {
  static const apiUrl = String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:3000/v1');
  static const rtUrl = String.fromEnvironment('RT_URL', defaultValue: 'http://10.0.2.2:3000/rt');
  static const sentryDsn = String.fromEnvironment('SENTRY_DSN');
  static const flavor = String.fromEnvironment('FLAVOR', defaultValue: 'dev');
}
