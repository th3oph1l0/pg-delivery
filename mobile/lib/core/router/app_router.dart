import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/login_page.dart';
import '../../features/cart/presentation/cart_page.dart';
import '../../features/home/presentation/home_page.dart';
import '../../features/orders/presentation/tracking_page.dart';
import '../storage/token_storage.dart';

enum AuthStatus { unknown, signedIn, signedOut }

class AuthStateController extends Notifier<AuthStatus> {
  @override
  AuthStatus build() {
    _restore();
    return AuthStatus.unknown;
  }

  Future<void> _restore() async {
    final token = await ref.read(tokenStorageProvider).refreshToken;
    state = token == null ? AuthStatus.signedOut : AuthStatus.signedIn;
  }

  void signedIn() => state = AuthStatus.signedIn;

  Future<void> signOut() async {
    await ref.read(tokenStorageProvider).clear();
    state = AuthStatus.signedOut;
  }
}

final authStateProvider = NotifierProvider<AuthStateController, AuthStatus>(AuthStateController.new);

/// Converte o estado do Riverpod em Listenable para o GoRouter reavaliar o redirect.
class _RouterRefresh extends ChangeNotifier {
  _RouterRefresh(Ref ref) {
    ref.listen(authStateProvider, (_, __) => notifyListeners());
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    refreshListenable: _RouterRefresh(ref),
    redirect: (context, state) {
      final auth = ref.read(authStateProvider);
      final atLogin = state.matchedLocation == '/login';
      if (auth == AuthStatus.unknown) return null;
      if (auth == AuthStatus.signedOut && !atLogin) return '/login';
      if (auth == AuthStatus.signedIn && atLogin) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
      GoRoute(path: '/', builder: (_, __) => const HomePage()),
      GoRoute(path: '/cart', builder: (_, __) => const CartPage()),
      GoRoute(
        path: '/orders/:id',
        builder: (_, state) => TrackingPage(orderId: state.pathParameters['id']!),
      ),
      // Deep links de push: pgdelivery://orders/<id> → mesma rota
      // TODO: /search, /restaurant/:id, /checkout, /profile, /orders (histórico)
    ],
    errorBuilder: (_, state) => Scaffold(body: Center(child: Text('Página não encontrada: ${state.uri}'))),
  );
});
