/// Entidade de domínio (sem dependência de Flutter, Dio ou JSON).
class Restaurant {
  const Restaurant({
    required this.id,
    required this.name,
    required this.rating,
    required this.ratingCount,
    required this.distanceMeters,
    required this.etaMin,
    required this.etaMax,
    required this.deliveryFeeCents,
    required this.isOpen,
    this.logoUrl,
    this.isSponsored = false,
  });

  final String id;
  final String name;
  final String? logoUrl;
  final double rating;
  final int ratingCount;
  final int distanceMeters;
  final int etaMin;
  final int etaMax;
  final int deliveryFeeCents;
  final bool isOpen;
  final bool isSponsored;

  bool get freeDelivery => deliveryFeeCents == 0;
}

class HomeFeed {
  const HomeFeed({required this.sponsored, required this.nearby, this.fromCache = false});

  final List<Restaurant> sponsored;
  final List<Restaurant> nearby;

  /// true quando exibimos dados salvos por estar offline.
  final bool fromCache;
}

abstract interface class RestaurantRepository {
  Future<HomeFeed> homeFeed({required double lat, required double lng});
}
