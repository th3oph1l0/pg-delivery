import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/cart.dart';

class CartController extends Notifier<Cart> {
  @override
  Cart build() => const Cart();

  /// Adiciona um item. Se a sacola for de outra loja, lança [DifferentRestaurantException]
  /// para a UI perguntar "Esvaziar sacola e adicionar?" (passando replace: true).
  void add({
    required String restaurantId,
    required String restaurantName,
    required CartItem item,
    bool replace = false,
  }) {
    if (!state.isEmpty && state.restaurantId != restaurantId && !replace) {
      throw DifferentRestaurantException(state.restaurantName ?? 'outra loja');
    }
    final base = (state.restaurantId == restaurantId) ? state : Cart(restaurantId: restaurantId, restaurantName: restaurantName);
    final idx = base.items.indexWhere((i) => i.lineKey == item.lineKey);
    final items = [...base.items];
    if (idx >= 0) {
      items[idx] = items[idx].copyWith(quantity: (items[idx].quantity + item.quantity).clamp(1, 99));
    } else {
      items.add(item);
    }
    state = Cart(restaurantId: restaurantId, restaurantName: restaurantName, items: items, couponCode: base.couponCode);
  }

  void setQuantity(String lineKey, int quantity) {
    final items = quantity <= 0
        ? state.items.where((i) => i.lineKey != lineKey).toList()
        : [for (final i in state.items) i.lineKey == lineKey ? i.copyWith(quantity: quantity.clamp(1, 99)) : i];
    state = items.isEmpty
        ? const Cart()
        : Cart(restaurantId: state.restaurantId, restaurantName: state.restaurantName, items: items, couponCode: state.couponCode);
  }

  void applyCoupon(String? code) => state = Cart(
        restaurantId: state.restaurantId,
        restaurantName: state.restaurantName,
        items: state.items,
        couponCode: code?.trim().toUpperCase(),
      );

  void clear() => state = const Cart();
}

final cartControllerProvider = NotifierProvider<CartController, Cart>(CartController.new);
