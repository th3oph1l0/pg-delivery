import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/design_system/components/pg_components.dart';
import '../../../core/design_system/tokens/pg_tokens.dart';
import '../../../core/network/api_client.dart';
import '../../../core/router/app_router.dart';
import '../../../core/storage/token_storage.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ref
          .read(dioProvider)
          .post<Map<String, dynamic>>('/auth/login', data: {'email': _email.text.trim(), 'password': _password.text});
      await ref.read(tokenStorageProvider).save(
            access: res.data!['accessToken'] as String,
            refresh: res.data!['refreshToken'] as String,
          );
      ref.read(authStateProvider.notifier).signedIn();
      if (mounted) context.go('/');
    } on DioException catch (e) {
      setState(() => _error = e.error is ApiException ? (e.error! as ApiException).message : 'Erro ao entrar');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(PgSpace.xl),
            child: Form(
              key: _form,
              child: AutofillGroup(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('pg', textAlign: TextAlign.center, style: theme.textTheme.displaySmall?.copyWith(color: theme.colorScheme.primary)),
                    const SizedBox(height: PgSpace.xs),
                    Text('Pequeno no tamanho,\ngigante na entrega.', textAlign: TextAlign.center, style: theme.textTheme.titleLarge),
                    const SizedBox(height: PgSpace.xxl),
                    OutlinedButton.icon(
                      onPressed: () {/* TODO: google_sign_in → POST /auth/oauth/google */},
                      icon: const Icon(Icons.g_mobiledata, size: 28),
                      label: const Text('Continuar com Google'),
                    ),
                    const SizedBox(height: PgSpace.sm),
                    OutlinedButton.icon(
                      onPressed: () {/* TODO: sign_in_with_apple → POST /auth/oauth/apple */},
                      icon: const Icon(Icons.apple),
                      label: const Text('Continuar com Apple'),
                    ),
                    const SizedBox(height: PgSpace.sm),
                    OutlinedButton.icon(
                      onPressed: () {/* TODO: telefone + OTP SMS */},
                      icon: const Icon(Icons.sms_outlined),
                      label: const Text('Entrar com celular'),
                    ),
                    const Padding(padding: EdgeInsets.symmetric(vertical: PgSpace.lg), child: Divider()),
                    TextFormField(
                      controller: _email,
                      decoration: const InputDecoration(labelText: 'E-mail'),
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      validator: (v) => (v == null || !v.contains('@')) ? 'Informe um e-mail válido' : null,
                    ),
                    const SizedBox(height: PgSpace.sm),
                    TextFormField(
                      controller: _password,
                      decoration: const InputDecoration(labelText: 'Senha'),
                      obscureText: true,
                      autofillHints: const [AutofillHints.password],
                      validator: (v) => (v == null || v.length < 8) ? 'Mínimo de 8 caracteres' : null,
                      onFieldSubmitted: (_) => _submit(),
                    ),
                    if (_error != null)
                      Padding(
                        padding: const EdgeInsets.only(top: PgSpace.sm),
                        child: Semantics(
                          liveRegion: true,
                          child: Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
                        ),
                      ),
                    const SizedBox(height: PgSpace.lg),
                    PgButton(label: 'Entrar', loading: _loading, onPressed: _submit),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
