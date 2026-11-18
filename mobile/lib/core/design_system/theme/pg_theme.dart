import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../tokens/pg_tokens.dart';

/// Material 3 com a identidade PG. Em produção, empacote as fontes em assets/fonts
/// e defina `GoogleFonts.config.allowRuntimeFetching = false` (offline-first).
abstract final class PgTheme {
  static ThemeData light() => _build(
        brightness: Brightness.light,
        scheme: ColorScheme.fromSeed(
          seedColor: PgColors.primary,
          brightness: Brightness.light,
        ).copyWith(
          primary: PgColors.primary,
          onPrimary: Colors.white,
          primaryContainer: PgColors.primaryContainer,
          onPrimaryContainer: PgColors.primaryPressed,
          secondary: PgColors.secondary,
          onSecondary: Colors.white,
          tertiary: PgColors.accent,
          onTertiary: PgColors.textPrimary,
          error: PgColors.danger,
          surface: PgColors.canvas,
          onSurface: PgColors.textPrimary,
          onSurfaceVariant: PgColors.textSecondary,
          surfaceContainerLowest: PgColors.canvas,
          surfaceContainerLow: PgColors.surface,
          surfaceContainer: PgColors.muted,
          outline: PgColors.textTertiary,
          outlineVariant: PgColors.border,
        ),
      );

  static ThemeData dark() => _build(
        brightness: Brightness.dark,
        scheme: ColorScheme.fromSeed(
          seedColor: PgColors.primary,
          brightness: Brightness.dark,
        ).copyWith(
          primary: PgColors.primaryDark,
          onPrimary: PgColors.canvasDark,
          primaryContainer: PgColors.primaryContainerDark,
          onPrimaryContainer: PgColors.primaryDark,
          secondary: PgColors.secondaryDark,
          onSecondary: PgColors.canvasDark,
          tertiary: PgColors.accent,
          onTertiary: PgColors.textPrimary,
          surface: PgColors.canvasDark,
          onSurface: PgColors.textPrimaryDark,
          onSurfaceVariant: PgColors.textSecondaryDark,
          surfaceContainerLowest: PgColors.canvasDark,
          surfaceContainerLow: PgColors.surfaceDark,
          surfaceContainer: PgColors.elevatedDark,
          surfaceContainerHigh: PgColors.mutedDark,
          outlineVariant: PgColors.borderDark,
        ),
      );

  static ThemeData _build({required Brightness brightness, required ColorScheme scheme}) {
    final base = ThemeData(useMaterial3: true, colorScheme: scheme, brightness: brightness);
    final body = GoogleFonts.interTextTheme(base.textTheme);
    final display = GoogleFonts.plusJakartaSansTextTheme(base.textTheme);

    final text = body.copyWith(
      displaySmall: display.displaySmall?.copyWith(fontSize: 32, height: 40 / 32, fontWeight: FontWeight.w800),
      headlineSmall: display.headlineSmall?.copyWith(fontSize: 24, height: 32 / 24, fontWeight: FontWeight.w700),
      titleLarge: display.titleLarge?.copyWith(fontSize: 20, height: 28 / 20, fontWeight: FontWeight.w700),
      titleMedium: body.titleMedium?.copyWith(fontSize: 17, height: 24 / 17, fontWeight: FontWeight.w600),
      bodyLarge: body.bodyLarge?.copyWith(fontSize: 15, height: 22 / 15),
      bodyMedium: body.bodyMedium?.copyWith(fontSize: 15, height: 22 / 15),
      bodySmall: body.bodySmall?.copyWith(fontSize: 13, height: 18 / 13, fontWeight: FontWeight.w500),
      labelSmall: body.labelSmall?.copyWith(fontSize: 11, letterSpacing: 0.9, fontWeight: FontWeight.w600),
    ).apply(bodyColor: scheme.onSurface, displayColor: scheme.onSurface);

    const pill = StadiumBorder();
    const minSize = Size(kPgMinTouchTarget, kPgMinTouchTarget);

    return base.copyWith(
      textTheme: text,
      scaffoldBackgroundColor: scheme.surface,
      materialTapTargetSize: MaterialTapTargetSize.padded,
      // Faixa vermelha no topo (estilo app de delivery): fundo vermelho, tudo branco por cima.
      appBarTheme: AppBarTheme(
        backgroundColor: brightness == Brightness.light ? PgColors.header : PgColors.headerDark,
        foregroundColor: PgColors.onHeader,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 2,
        centerTitle: false,
        systemOverlayStyle: SystemUiOverlayStyle.light,
        iconTheme: const IconThemeData(color: PgColors.onHeader),
        actionsIconTheme: const IconThemeData(color: PgColors.onHeader),
        titleTextStyle: text.titleLarge?.copyWith(color: PgColors.onHeader),
        toolbarTextStyle: text.bodyMedium?.copyWith(color: PgColors.onHeader),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(64, 52),
          shape: pill,
          textStyle: text.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(minimumSize: minSize, shape: pill, side: BorderSide(color: scheme.outlineVariant)),
      ),
      textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(minimumSize: minSize, shape: pill)),
      iconButtonTheme: IconButtonThemeData(style: IconButton.styleFrom(minimumSize: minSize)),
      cardTheme: CardThemeData(
        elevation: 0,
        margin: EdgeInsets.zero,
        color: scheme.surfaceContainerLowest,
        shape: RoundedRectangleBorder(
          borderRadius: const BorderRadius.all(PgRadius.md),
          side: BorderSide(color: scheme.outlineVariant),
        ),
      ),
      chipTheme: ChipThemeData(
        shape: pill,
        side: BorderSide(color: scheme.outlineVariant),
        selectedColor: scheme.primaryContainer,
        labelStyle: text.bodySmall,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: scheme.surfaceContainer,
        border: const OutlineInputBorder(borderRadius: BorderRadius.all(PgRadius.sm), borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(
          borderRadius: const BorderRadius.all(PgRadius.sm),
          borderSide: BorderSide(color: scheme.primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: PgSpace.md, vertical: PgSpace.sm),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        showDragHandle: true,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: PgRadius.lg)),
      ),
      snackBarTheme: const SnackBarThemeData(behavior: SnackBarBehavior.floating),
      navigationBarTheme: NavigationBarThemeData(
        indicatorColor: scheme.primaryContainer,
        labelTextStyle: WidgetStatePropertyAll(text.bodySmall),
      ),
    );
  }
}
