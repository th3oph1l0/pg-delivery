import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/network/api_client.dart';
import '../domain/restaurant.dart';

/// DTO ↔ entidade. Mapeamento manual mantém o build sem code generation.
extension RestaurantJson on Restaurant {
  static Restaurant fromJson(Map<String, dynamic> j) {
    final eta = (j['etaMinutes'] as List<dynamic>).cast<num>();
    return Restaurant(
      id: j['id'] as String,
      name: j['name'] as String,
      logoUrl: j['logoUrl'] as String?,
      rating: (j['rating'] as num).toDouble(),
      ratingCount: (j['ratingCount'] as num).toInt(),
      distanceMeters: (j['distanceMeters'] as num).toInt(),
      etaMin: eta[0].toInt(),
      etaMax: eta[1].toInt(),
      deliveryFeeCents: (j['deliveryFeeCents'] as num).toInt(),
      isOpen: j['isOpen'] as bool,
      isSponsored: (j['isSponsored'] as bool?) ?? false,
    );
  }
}

/// Offline-first: rede primeiro, cache local como fallback (stale-if-error).
class RestaurantRepositoryImpl implements RestaurantRepository {
  RestaurantRepositoryImpl(this._dio);

  final Dio _dio;
  static const _cacheKey = 'cache:home_feed';

  @override
  Future<HomeFeed> homeFeed({required double lat, required double lng}) async {
    final prefs = await SharedPreferences.getInstance();
    try {
      final res = await _dio.get<Map<String, dynamic>>('/restaurants', queryParameters: {'lat': lat, 'lng': lng, 'limit': 30});
      final body = res.data!;
      await prefs.setString(_cacheKey, jsonEncode(body));
      return _parse(body);
    } on DioException catch (e) {
      final cached = prefs.getString(_cacheKey);
      final isOffline = e.error is ApiException && (e.error! as ApiException).isNetwork;
      if (cached != null && isOffline) {
        return _parse(jsonDecode(cached) as Map<String, dynamic>, fromCache: true);
      }
      rethrow;
    }
  }

  HomeFeed _parse(Map<String, dynamic> body, {bool fromCache = false}) {
    final all = (body['data'] as List<dynamic>).cast<Map<String, dynamic>>().map(RestaurantJson.fromJson).toList();
    return HomeFeed(
      sponsored: all.where((r) => r.isSponsored).toList(),
      nearby: all.where((r) => !r.isSponsored).toList(),
      fromCache: fromCache,
    );
  }
}

final restaurantRepositoryProvider = Provider<RestaurantRepository>(
  (ref) => RestaurantRepositoryImpl(ref.watch(dioProvider)),
);
