import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';

import '../../../core/design_system/components/pg_components.dart';
import '../../../core/design_system/tokens/pg_tokens.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/formatters.dart';
import 'cart_controller.dart';

class CartPage extends ConsumerStatefulWidget {
  const CartPage({super.key});

  @override
  ConsumerState<CartPage> createState() => _CartPageState();
}

class _CartPageState extends ConsumerState<CartPage> {
  bool _placing = false;

  /// A chave é gerada uma vez por tentativa de checkout: se a rede cair e o usuário
  /// tocar de novo, o backend devolve o MESMO pedido em vez de cobrar duas vezes.
  late String _idempotencyKey = const Uuid().v4();

  Future<void> _placeOrder() async {
    final cart = ref.read(cartControllerProvider);
    setState(() => _placing = true);
    try {
      final res = await ref.read(dioProvider).post<Map<String, dynamic>>(
            '/orders',
            data: {
              ...cart.toOrderPayload(),
              'addressId': 'TODO-endereco-selecionado',
              'payment': {'method': 'PIX'},
            },
            options: Options(headers: {'Idempotency-Key': _idempotencyKey}),
          );
      ref.read(cartControllerProvider.notifier).clear();
      _idempotencyKey = const Uuid().v4();
      if (mounted) context.go('/orders/${res.data!['id']}');
    } on DioException catch (e) {
      final msg = e.error is ApiException ? (e.error! as ApiException).message : 'Não foi possível finalizar o pedido';
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    } finally {
      if (mounted) setState(() => _placing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartControllerProvider);
    final ctrl = ref.read(cartControllerProvider.notifier);
    final theme = Theme.of(context);

    if (cart.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Sacola')),
        body: Center(child: Text('Sua sacola está vazia', style: theme.textTheme.titleMedium)),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sacola'),
        actions: [
          TextButton(
            onPressed: ctrl.clear,
            style: TextButton.styleFrom(foregroundColor: PgColors.onHeader),
            child: const Text('Limpar'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(PgSpace.md),
        children: [
          Text(cart.restaurantName ?? '', style: theme.textTheme.titleLarge),
          const SizedBox(height: PgSpace.sm),
          for (final item in cart.items)
            Dismissible(
              key: ValueKey(item.lineKey),
              direction: DismissDirection.endToStart,
              background: Container(
                alignment: Alignment.centerRight,
                padding: const EdgeInsets.only(right: PgSpace.lg),
                color: PgColors.danger,
                child: const Icon(Icons.delete_outline, color: Colors.white),
              ),
              onDismissed: (_) => ctrl.setQuantity(item.lineKey, 0),
              child: ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text('${item.quantity}× ${item.name}'),
                subtitle: item.options.isEmpty ? null : Text(item.options.map((o) => o.name).join(' · ')),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(formatBRL(item.totalCents), style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                    // Alternativa acessível ao gesto de deslizar (WCAG 2.5.7)
                    IconButton(
                      tooltip: 'Diminuir quantidade de ${item.name}',
                      onPressed: () => ctrl.setQuantity(item.lineKey, item.quantity - 1),
                      icon: const Icon(Icons.remove_circle_outline),
                    ),
                    IconButton(
                      tooltip: 'Aumentar quantidade de ${item.name}',
                      onPressed: () => ctrl.setQuantity(item.lineKey, item.quantity + 1),
                      icon: const Icon(Icons.add_circle_outline),
                    ),
                  ],
                ),
              ),
            ),
          const Divider(height: PgSpace.xxl),
          TextField(
            decoration: const InputDecoration(labelText: 'Cupom', prefixIcon: Icon(Icons.confirmation_number_outlined)),
            textCapitalization: TextCapitalization.characters,
            onSubmitted: ctrl.applyCoupon,
          ),
          const SizedBox(height: PgSpace.lg),
          _Line('Subtotal', formatBRL(cart.subtotalCents)),
          const _Line('Taxa de entrega', 'calculada no checkout'),
          const SizedBox(height: 120),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(PgSpace.md),
          child: PgButton(label: 'Fazer pedido · PIX', loading: _placing, onPressed: _placeOrder, icon: Icons.bolt),
        ),
      ),
    );
  }
}

class _Line extends StatelessWidget {
  const _Line(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: PgSpace.xxs),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [Text(label), Text(value)],
        ),
      );
}
