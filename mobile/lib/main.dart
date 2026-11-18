import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import 'core/config/env.dart';
import 'core/design_system/theme/pg_theme.dart';
import 'core/router/app_router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SentryFlutter.init(
    (o) {
      o.dsn = Env.sentryDsn;
      o.environment = Env.flavor;
      o.tracesSampleRate = Env.flavor == 'prod' ? 0.1 : 1.0;
      o.sendDefaultPii = false; // LGPD
    },
    appRunner: () => runApp(const ProviderScope(child: PgApp())),
  );
}

class PgApp extends ConsumerWidget {
  const PgApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'PG Delivery',
      debugShowCheckedModeBanner: false,
      theme: PgTheme.light(),
      darkTheme: PgTheme.dark(),
      themeMode: ThemeMode.system,
      routerConfig: ref.watch(routerProvider),
      locale: const Locale('pt', 'BR'),
      supportedLocales: const [Locale('pt', 'BR')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      // Respeita a escala de fonte do sistema, limitando a 2x para não quebrar layouts
      builder: (context, child) => MediaQuery.withClampedTextScaling(maxScaleFactor: 2, child: child!),
    );
  }
}
