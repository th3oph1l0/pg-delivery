/// Carrinho imutável. Os preços aqui são só uma estimativa para a UI:
/// o valor final é sempre recalculado pelo backend em POST /cart/quote e POST /orders.
class CartOption {
  const CartOption({required this.id, required this.name, required this.priceCents});
  final String id;
  final String name;
  final int priceCents;
}

class CartItem {
  const CartItem({
    required this.productId,
    required this.name,
    required this.unitPriceCents,
    this.quantity = 1,
    this.options = const [],
    this.notes,
  });

  final String productId;
  final String name;
  final int unitPriceCents;
  final int quantity;
  final List<CartOption> options;
  final String? notes;

  /// Mesmo produto com os mesmos complementos e observação = mesma linha.
  String get lineKey => '$productId|${(options.map((o) => o.id).toList()..sort()).join(',')}|${notes ?? ''}';

  int get totalCents => (unitPriceCents + options.fold<int>(0, (s, o) => s + o.priceCents)) * quantity;

  CartItem copyWith({int? quantity}) => CartItem(
        productId: productId,
        name: name,
        unitPriceCents: unitPriceCents,
        quantity: quantity ?? this.quantity,
        options: options,
        notes: notes,
      );
}

class Cart {
  const Cart({this.restaurantId, this.restaurantName, this.items = const [], this.couponCode});

  final String? restaurantId;
  final String? restaurantName;
  final List<CartItem> items;
  final String? couponCode;

  bool get isEmpty => items.isEmpty;
  int get itemCount => items.fold(0, (s, i) => s + i.quantity);
  int get subtotalCents => items.fold(0, (s, i) => s + i.totalCents);

  Map<String, dynamic> toOrderPayload() => {
        'restaurantId': restaurantId,
        'items': [
          for (final i in items)
            {
              'productId': i.productId,
              'quantity': i.quantity,
              'options': [for (final o in i.options) o.id],
              if (i.notes != null) 'notes': i.notes,
            },
        ],
        if (couponCode != null) 'couponCode': couponCode,
      };
}

/// Lançada quando o usuário tenta misturar lojas na mesma sacola.
class DifferentRestaurantException implements Exception {
  const DifferentRestaurantException(this.currentRestaurantName);
  final String currentRestaurantName;
}
