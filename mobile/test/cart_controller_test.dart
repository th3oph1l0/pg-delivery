import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pg_delivery/features/cart/domain/cart.dart';
import 'package:pg_delivery/features/cart/presentation/cart_controller.dart';

void main() {
  late ProviderContainer container;
  CartController ctrl() => container.read(cartControllerProvider.notifier);
  Cart cart() => container.read(cartControllerProvider);

  const bacon = CartOption(id: 'o-bacon', name: 'Bacon', priceCents: 400);
  const xGigante = CartItem(productId: 'p1', name: 'X-Gigante', unitPriceCents: 3290, options: [bacon]);

  setUp(() => container = ProviderContainer());
  tearDown(() => container.dispose());

  test('agrupa itens iguais e soma com complementos', () {
    ctrl().add(restaurantId: 'r1', restaurantName: 'Burger do Zé', item: xGigante);
    ctrl().add(restaurantId: 'r1', restaurantName: 'Burger do Zé', item: xGigante);
    expect(cart().items, hasLength(1));
    expect(cart().itemCount, 2);
    expect(cart().subtotalCents, (3290 + 400) * 2);
  });

  test('impede misturar restaurantes sem confirmação', () {
    ctrl().add(restaurantId: 'r1', restaurantName: 'Burger do Zé', item: xGigante);
    expect(
      () => ctrl().add(restaurantId: 'r2', restaurantName: 'Pizza', item: xGigante),
      throwsA(isA<DifferentRestaurantException>()),
    );
    ctrl().add(restaurantId: 'r2', restaurantName: 'Pizza', item: xGigante, replace: true);
    expect(cart().restaurantId, 'r2');
    expect(cart().itemCount, 1);
  });

  test('quantidade zero remove o item e esvazia a sacola', () {
    ctrl().add(restaurantId: 'r1', restaurantName: 'Burger do Zé', item: xGigante);
    ctrl().setQuantity(xGigante.lineKey, 0);
    expect(cart().isEmpty, isTrue);
    expect(cart().restaurantId, isNull);
  });
}
