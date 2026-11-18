import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../tokens/pg_tokens.dart';

/// Botão primário com estado de loading acessível e háptico leve.
class PgButton extends StatelessWidget {
  const PgButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
    this.icon,
    this.expand = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final button = FilledButton.icon(
      onPressed: loading || onPressed == null
          ? null
          : () {
              HapticFeedback.lightImpact();
              onPressed!();
            },
      icon: loading
          ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2))
          : (icon != null ? Icon(icon) : const SizedBox.shrink()),
      label: Text(label),
    );
    return Semantics(
      button: true,
      enabled: !loading && onPressed != null,
      label: loading ? '$label, carregando' : null,
      child: expand ? SizedBox(width: double.infinity, child: button) : button,
    );
  }
}

/// Skeleton com shimmer; respeita "reduzir movimento" do sistema.
class PgSkeleton extends StatefulWidget {
  const PgSkeleton({super.key, this.height = 16, this.width = double.infinity, this.radius = PgRadius.sm});

  final double height;
  final double width;
  final Radius radius;

  @override
  State<PgSkeleton> createState() => _PgSkeletonState();
}

class _PgSkeletonState extends State<PgSkeleton> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    MediaQuery.disableAnimationsOf(context) ? _c.stop() : _c.repeat();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return ExcludeSemantics(
      child: AnimatedBuilder(
        animation: _c,
        builder: (_, __) => Container(
          height: widget.height,
          width: widget.width,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.all(widget.radius),
            gradient: LinearGradient(
              begin: Alignment(-1 + 2 * _c.value - 1, 0),
              end: Alignment(1 + 2 * _c.value - 1, 0),
              colors: [scheme.surfaceContainer, scheme.outlineVariant, scheme.surfaceContainer],
            ),
          ),
        ),
      ),
    );
  }
}

/// Selo de status com ícone + texto + cor (a cor nunca é o único indicador).
class PgStatusBadge extends StatelessWidget {
  const PgStatusBadge({super.key, required this.label, required this.icon, required this.color});

  final String label;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: PgSpace.xs, vertical: PgSpace.xxs),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: const BorderRadius.all(PgRadius.full)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: PgSpace.xxs),
          Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
