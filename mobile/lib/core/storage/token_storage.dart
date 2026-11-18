import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Tokens no Keychain (iOS) / Keystore (Android). Nunca em SharedPreferences.
class TokenStorage {
  TokenStorage(this._storage);

  final FlutterSecureStorage _storage;
  static const _access = 'pg_access';
  static const _refresh = 'pg_refresh';

  Future<String?> get accessToken => _storage.read(key: _access);
  Future<String?> get refreshToken => _storage.read(key: _refresh);

  Future<void> save({required String access, required String refresh}) => Future.wait([
        _storage.write(key: _access, value: access),
        _storage.write(key: _refresh, value: refresh),
      ]);

  Future<void> clear() => _storage.deleteAll();
}

final tokenStorageProvider = Provider<TokenStorage>(
  (ref) => TokenStorage(
    const FlutterSecureStorage(aOptions: AndroidOptions(encryptedSharedPreferences: true)),
  ),
);
