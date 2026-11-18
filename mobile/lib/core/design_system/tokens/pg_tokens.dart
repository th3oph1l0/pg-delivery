import 'package:flutter/material.dart';

/// Tokens do Design System "Gigante" (docs/06-design-system.md).
/// Todos os pares texto/fundo foram validados para WCAG 2.2 AA.
abstract final class PgColors {
  // Marca
  static const primary = Color(0xFFD91A27); // "Ketchup" — branco sobre ele: 5.09:1
  static const primaryPressed = Color(0xFFB5121D);
  static const primaryContainer = Color(0xFFFFF3EF);
  static const primaryDark = Color(0xFFFF5A5F); // texto #1A0F0C sobre ele: 6.16:1
  static const primaryContainerDark = Color(0xFF4A1A17);
  static const secondary = Color(0xFF0E7A55);
  static const secondaryDark = Color(0xFF4ADE80);
  static const accent = Color(0xFFFFC72C); // "Queijo" — sempre com texto escuro

  // Faixa do topo (AppBar), estilo app de delivery — sempre com texto branco
  static const header = Color(0xFFD91A27); // branco: 5.09:1
  static const headerDark = Color(0xFF8E0F18);
  static const onHeader = Color(0xFFFFFFFF);

  // Neutros "Creme" (light)
  static const canvas = Color(0xFFFFFFFF);
  static const surface = Color(0xFFFFF8F1);
  static const muted = Color(0xFFFFF1E6);
  static const border = Color(0xFFF2E2D4);
  static const textPrimary = Color(0xFF2A1712);
  static const textSecondary = Color(0xFF6B4E43);
  static const textTertiary = Color(0xFF7F6157);

  // Neutros (dark)
  static const canvasDark = Color(0xFF1A0F0C);
  static const surfaceDark = Color(0xFF241612);
  static const elevatedDark = Color(0xFF2E1D18);
  static const mutedDark = Color(0xFF33221C);
  static const borderDark = Color(0xFF47322A);
  static const textPrimaryDark = Color(0xFFF3E6DC);
  static const textSecondaryDark = Color(0xFFBFA89C);

  // Semânticas
  static const success = Color(0xFF0E7A55);
  static const warning = Color(0xFFB45309);
  static const danger = Color(0xFFB91C1C);
  static const info = Color(0xFF1D4ED8);
}

abstract final class PgSpace {
  static const xxs = 4.0;
  static const xs = 8.0;
  static const sm = 12.0;
  static const md = 16.0;
  static const lg = 20.0;
  static const xl = 24.0;
  static const xxl = 32.0;
  static const xxxl = 40.0;
}

abstract final class PgRadius {
  static const sm = Radius.circular(8);
  static const md = Radius.circular(12);
  static const lg = Radius.circular(16);
  static const xl = Radius.circular(24);
  static const full = Radius.circular(999);
}

abstract final class PgMotion {
  static const fast = Duration(milliseconds: 120);
  static const base = Duration(milliseconds: 200);
  static const slow = Duration(milliseconds: 320);
  static const curve = Cubic(0.2, 0.8, 0.2, 1);
}

/// Alvo de toque mínimo adotado (acima dos 24×24 exigidos pela WCAG 2.5.8).
const double kPgMinTouchTarget = 44;
