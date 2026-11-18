import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../core/design_system/components/pg_components.dart';
import '../../../core/design_system/tokens/pg_tokens.dart';
import '../../../core/utils/formatters.dart';
import '../domain/restaurant.dart';

class RestaurantCard extends StatelessWidget {
  const RestaurantCard({super.key, required this.restaurant, required this.onTap});

  final Restaurant restaurant;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final r = restaurant;
    final theme = Theme.of(context);
    final fee = r.freeDelivery ? 'Entrega grátis' : formatBRL(r.deliveryFeeCents);

    // Um único rótulo semântico para o card inteiro (leitor de tela não lê pedaço por pedaço)
    return Semantics(
      button: true,
      label: '${r.name}. Nota ${formatRating(r.rating)}. ${formatDistance(r.distanceMeters)}. '
          '${r.etaMin} a ${r.etaMax} minutos. $fee.${r.isOpen ? '' : ' Fechado agora.'}'
          '${r.isSponsored ? ' Patrocinado.' : ''}',
      excludeSemantics: true,
      child: Opacity(
        opacity: r.isOpen ? 1 : 0.55,
        child: InkWell(
          onTap: onTap,
          borderRadius: const BorderRadius.all(PgRadius.md),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: PgSpace.sm),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.all(PgRadius.md),
                  child: SizedBox.square(
                    dimension: 64,
                    child: r.logoUrl == null
                        ? ColoredBox(color: theme.colorScheme.surfaceContainer, child: const Icon(Icons.storefront))
                        : CachedNetworkImage(imageUrl: r.logoUrl!, fit: BoxFit.cover),
                  ),
                ),
                const SizedBox(width: PgSpace.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(r.name, style: theme.textTheme.titleMedium, maxLines: 2, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 2),
                      Text(
                        '★ ${formatRating(r.rating)} · ${formatDistance(r.distanceMeters)}',
                        style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                      ),
                      const SizedBox(height: 2),
                      Wrap(
                        spacing: PgSpace.xs,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text('${r.etaMin}–${r.etaMax} min', style: theme.textTheme.bodySmall),
                          if (r.freeDelivery)
                            PgStatusBadge(label: 'Grátis', icon: Icons.delivery_dining, color: theme.colorScheme.secondary)
                          else
                            Text(fee, style: theme.textTheme.bodySmall),
                          if (r.isSponsored) Text('Patrocinado', style: theme.textTheme.labelSmall),
                          if (!r.isOpen) Text('Fechado', style: theme.textTheme.bodySmall?.copyWith(color: PgColors.danger)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
