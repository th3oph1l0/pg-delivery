import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/restaurant_repository_impl.dart';
import '../domain/restaurant.dart';

/// Localização de entrega selecionada (endereço padrão ou GPS).
class DeliveryLocation {
  const DeliveryLocation({required this.lat, required this.lng, required this.label});
  final double lat;
  final double lng;
  final String label;
}

final deliveryLocationProvider = Provider<DeliveryLocation>(
  // TODO: ligar ao endereço padrão do usuário / geolocator
  (ref) => const DeliveryLocation(lat: -22.5137, lng: -44.0956, label: 'Rua 33, 120'),
);

class HomeController extends AsyncNotifier<HomeFeed> {
  @override
  Future<HomeFeed> build() {
    final loc = ref.watch(deliveryLocationProvider);
    return ref.read(restaurantRepositoryProvider).homeFeed(lat: loc.lat, lng: loc.lng);
  }

  /// Pull to refresh: mantém os dados atuais visíveis enquanto recarrega.
  Future<void> refresh() async {
    final loc = ref.read(deliveryLocationProvider);
    state = await AsyncValue.guard(
      () => ref.read(restaurantRepositoryProvider).homeFeed(lat: loc.lat, lng: loc.lng),
    );
  }
}

final homeControllerProvider = AsyncNotifierProvider<HomeController, HomeFeed>(HomeController.new);
