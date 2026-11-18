import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/design_system/components/pg_components.dart';
import '../../../core/design_system/tokens/pg_tokens.dart';
import '../../cart/presentation/cart_controller.dart';
import '../../../core/utils/formatters.dart';
import 'home_controller.dart';
import 'restaurant_card.dart';

const _categories = [
  ('🍔', 'Lanches'),
  ('🍕', 'Pizza'),
  ('🍣', 'Japonesa'),
  ('🥗', 'Saudável'),
  ('🍰', 'Doces'),
  ('🛒', 'Mercado'),
];

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(homeControllerProvider);
    final location = ref.watch(deliveryLocationProvider);
    final cart = ref.watch(cartControllerProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: InkWell(
          onTap: () {/* TODO: bottom sheet de endereços */},
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Entregar em', style: theme.textTheme.bodySmall?.copyWith(color: PgColors.onHeader)),
              Row(children: [
                Text(location.label, style: theme.textTheme.titleMedium?.copyWith(color: PgColors.onHeader)),
                const Icon(Icons.expand_more),
              ]),
            ],
          ),
        ),
        actions: [IconButton(onPressed: () {}, tooltip: 'Notificações', icon: const Icon(Icons.notifications_none))],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(homeControllerProvider.notifier).refresh(),
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: PgSpace.md),
              sliver: SliverList.list(
                children: [
                  const SizedBox(height: PgSpace.xs),
                  SearchBar(
                    hintText: 'Buscar pratos ou restaurantes',
                    leading: const Icon(Icons.search),
                    elevation: const WidgetStatePropertyAll(0),
                    onTap: () => context.push('/search'),
                  ),
                  const SizedBox(height: PgSpace.md),
                  SizedBox(
                    height: 84,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _categories.length,
                      separatorBuilder: (_, __) => const SizedBox(width: PgSpace.sm),
                      itemBuilder: (_, i) => _CategoryChip(emoji: _categories[i].$1, label: _categories[i].$2),
                    ),
                  ),
                  if (feed.hasValue && feed.requireValue.fromCache)
                    MaterialBanner(
                      content: const Text('Você está offline · mostrando dados salvos'),
                      leading: const Icon(Icons.cloud_off),
                      actions: [TextButton(onPressed: () => ref.invalidate(homeControllerProvider), child: const Text('Tentar de novo'))],
                    ),
                  const SizedBox(height: PgSpace.md),
                  Text('Perto de você', style: theme.textTheme.titleLarge, semanticsLabel: 'Restaurantes perto de você'),
                ],
              ),
            ),
            feed.when(
              skipLoadingOnRefresh: true,
              loading: () => SliverList.builder(itemCount: 6, itemBuilder: (_, __) => const _RestaurantSkeleton()),
              error: (e, _) => SliverFillRemaining(
                hasScrollBody: false,
                child: _ErrorState(onRetry: () => ref.invalidate(homeControllerProvider)),
              ),
              data: (data) => SliverPadding(
                padding: const EdgeInsets.fromLTRB(PgSpace.md, 0, PgSpace.md, 96),
                sliver: SliverList.separated(
                  itemCount: data.sponsored.length + data.nearby.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (_, i) {
                    final r = i < data.sponsored.length ? data.sponsored[i] : data.nearby[i - data.sponsored.length];
                    return RestaurantCard(restaurant: r, onTap: () => context.push('/restaurant/${r.id}'));
                  },
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: cart.isEmpty
          ? null
          : Padding(
              padding: const EdgeInsets.symmetric(horizontal: PgSpace.md),
              child: PgButton(
                label: 'Ver sacola · ${cart.itemCount} ${cart.itemCount == 1 ? 'item' : 'itens'} · ${formatBRL(cart.subtotalCents)}',
                icon: Icons.shopping_bag_outlined,
                onPressed: () => context.push('/cart'),
              ),
            ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({required this.emoji, required this.label});
  final String emoji;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Categoria $label',
      excludeSemantics: true,
      child: InkWell(
        borderRadius: const BorderRadius.all(PgRadius.md),
        onTap: () => context.push('/search?category=$label'),
        child: SizedBox(
          width: 68,
          child: Column(
            children: [
              Container(
                height: 56,
                width: 56,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  borderRadius: const BorderRadius.all(PgRadius.lg),
                ),
                child: Text(emoji, style: const TextStyle(fontSize: 26)),
              ),
              const SizedBox(height: PgSpace.xxs),
              Text(label, style: Theme.of(context).textTheme.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ),
    );
  }
}

class _RestaurantSkeleton extends StatelessWidget {
  const _RestaurantSkeleton();

  @override
  Widget build(BuildContext context) => const Padding(
        padding: EdgeInsets.symmetric(horizontal: PgSpace.md, vertical: PgSpace.sm),
        child: Row(
          children: [
            PgSkeleton(height: 64, width: 64, radius: PgRadius.md),
            SizedBox(width: PgSpace.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [PgSkeleton(width: 180), SizedBox(height: 8), PgSkeleton(width: 120, height: 12), SizedBox(height: 6), PgSkeleton(width: 140, height: 12)],
              ),
            ),
          ],
        ),
      );
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.all(PgSpace.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off_rounded, size: 48),
            const SizedBox(height: PgSpace.sm),
            Text('Não conseguimos carregar os restaurantes', style: Theme.of(context).textTheme.titleMedium, textAlign: TextAlign.center),
            const SizedBox(height: PgSpace.md),
            PgButton(label: 'Tentar de novo', onPressed: onRetry, expand: false),
          ],
        ),
      );
}
