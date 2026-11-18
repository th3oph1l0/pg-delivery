import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../config/env.dart';
import '../storage/token_storage.dart';

/// Erro de domínio vindo do backend (application/problem+json).
class ApiException implements Exception {
  ApiException(this.status, this.code, this.message);
  final int status;
  final String code;
  final String message;

  bool get isNetwork => status == 0;

  @override
  String toString() => 'ApiException($status, $code): $message';
}

final dioProvider = Provider<Dio>((ref) {
  final storage = ref.watch(tokenStorageProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: Env.apiUrl,
      connectTimeout: const Duration(seconds: 8),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Accept': 'application/json'},
    ),
  );
  dio.interceptors.add(_AuthInterceptor(dio, storage));
  return dio;
});

/// Injeta o bearer, gera Idempotency-Key para POSTs críticos e faz refresh único em 401.
class _AuthInterceptor extends QueuedInterceptor {
  _AuthInterceptor(this._dio, this._storage);

  final Dio _dio;
  final TokenStorage _storage;
  static const _uuid = Uuid();

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.accessToken;
    if (token != null) options.headers['Authorization'] = 'Bearer $token';
    if (options.method == 'POST' && options.extra['idempotent'] == true) {
      options.headers['Idempotency-Key'] ??= _uuid.v4();
    }
    handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final response = err.response;
    final alreadyRetried = err.requestOptions.extra['retried'] == true;

    if (response?.statusCode == 401 && !alreadyRetried) {
      final refresh = await _storage.refreshToken;
      if (refresh != null) {
        try {
          final r = await Dio(BaseOptions(baseUrl: Env.apiUrl))
              .post<Map<String, dynamic>>('/auth/refresh', data: {'refreshToken': refresh});
          await _storage.save(access: r.data!['accessToken'] as String, refresh: r.data!['refreshToken'] as String);
          final retry = err.requestOptions..extra['retried'] = true;
          return handler.resolve(await _dio.fetch<dynamic>(retry));
        } catch (_) {
          await _storage.clear(); // sessão inválida → o router redireciona para o login
        }
      }
    }

    final data = response?.data;
    final problem = data is Map<String, dynamic> ? data : const <String, dynamic>{};
    handler.reject(
      err.copyWith(
        error: ApiException(
          response?.statusCode ?? 0,
          (problem['code'] as String?) ?? (response == null ? 'NETWORK' : 'HTTP_ERROR'),
          (problem['title'] as String?) ?? (response == null ? 'Sem conexão com a internet' : 'Algo deu errado'),
        ),
      ),
    );
  }
}
