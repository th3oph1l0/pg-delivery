import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../../../core/config/env.dart';
import '../../../core/design_system/tokens/pg_tokens.dart';
import '../../../core/storage/token_storage.dart';

const _steps = [
  ('PLACED', 'Pedido recebido', Icons.receipt_long),
  ('CONFIRMED', 'Confirmado', Icons.thumb_up_alt_outlined),
  ('PREPARING', 'Em preparo', Icons.soup_kitchen_outlined),
  ('PICKED_UP', 'A caminho', Icons.delivery_dining),
  ('DELIVERED', 'Entregue', Icons.check_circle_outline),
];

class TrackingState {
  const TrackingState({this.status = 'PLACED', this.courier, this.etaAt});
  final String status;
  final LatLng? courier;
  final DateTime? etaAt;

  TrackingState copyWith({String? status, LatLng? courier, DateTime? etaAt}) =>
      TrackingState(status: status ?? this.status, courier: courier ?? this.courier, etaAt: etaAt ?? this.etaAt);
}

/// Assina a sala `order:{id}` no gateway realtime e mantém o estado do tracking.
class TrackingController extends Notifier<TrackingState> {
  TrackingController(this.orderId);
  final String orderId;
  io.Socket? _socket;

  @override
  TrackingState build() {
    ref.onDispose(() => _socket?.dispose());
    _connect();
    return const TrackingState();
  }

  Future<void> _connect() async {
    final token = await ref.read(tokenStorageProvider).accessToken;
    final socket = io.io(
      Env.rtUrl,
      io.OptionBuilder().setTransports(['websocket']).setAuth({'token': token}).enableReconnection().build(),
    );
    _socket = socket;
    socket.onConnect((_) => socket.emitWithAck('subscribe:order', {'orderId': orderId}, ack: (dynamic data) {
          final status = (data is Map ? data['status'] : null) as String?;
          if (status != null) state = state.copyWith(status: status);
        }));
    socket.on('order:status', (dynamic d) {
      final status = (d as Map)['status'] as String?;
      if (status == null) return;
      state = state.copyWith(status: status);
      final shown = status == 'READY_FOR_PICKUP' ? 'PREPARING' : status;
      final label = _steps.firstWhere((s) => s.$1 == shown, orElse: () => _steps.first).$2;
      SemanticsService.announce('Status do pedido: $label', TextDirection.ltr);
    });
    socket.on('courier:location', (dynamic d) {
      final m = d as Map;
      state = state.copyWith(courier: LatLng((m['lat'] as num).toDouble(), (m['lng'] as num).toDouble()));
    });
    socket.on('order:eta', (dynamic d) {
      final eta = (d as Map)['etaAt'] as String?;
      if (eta != null) state = state.copyWith(etaAt: DateTime.parse(eta).toLocal());
    });
  }
}

final trackingProvider =
    NotifierProvider.autoDispose.family<TrackingController, TrackingState, String>(TrackingController.new);

class TrackingPage extends ConsumerWidget {
  const TrackingPage({super.key, required this.orderId});
  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(trackingProvider(orderId));
    final theme = Theme.of(context);
    // READY_FOR_PICKUP aparece como "Em preparo" para o cliente (ainda não saiu da loja)
    final shown = s.status == 'READY_FOR_PICKUP' ? 'PREPARING' : s.status;
    final current = _steps.indexWhere((e) => e.$1 == shown).clamp(0, _steps.length - 1);
    final eta = s.etaAt;

    return Scaffold(
      appBar: AppBar(title: const Text('Acompanhar pedido')),
      body: Column(
        children: [
          SizedBox(
            height: 260,
            child: GoogleMap(
              initialCameraPosition: CameraPosition(target: s.courier ?? const LatLng(-22.5137, -44.0956), zoom: 14),
              markers: {
                if (s.courier != null) Marker(markerId: const MarkerId('courier'), position: s.courier!, infoWindow: const InfoWindow(title: 'Entregador')),
              },
              myLocationButtonEnabled: false,
              zoomControlsEnabled: true, // alternativa aos gestos de pinça
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(PgSpace.md),
              children: [
                Text(
                  eta == null ? 'Calculando previsão…' : 'Chega por volta de ${TimeOfDay.fromDateTime(eta).format(context)}',
                  style: theme.textTheme.headlineSmall,
                ),
                const SizedBox(height: PgSpace.lg),
                for (var i = 0; i < _steps.length; i++)
                  Semantics(
                    label: '${_steps[i].$2}${i < current ? ', concluído' : i == current ? ', etapa atual' : ''}',
                    excludeSemantics: true,
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Icon(
                        _steps[i].$3,
                        color: i <= current ? theme.colorScheme.primary : theme.colorScheme.outline,
                      ),
                      title: Text(
                        _steps[i].$2,
                        style: i == current ? theme.textTheme.titleMedium : theme.textTheme.bodyMedium,
                      ),
                      trailing: i < current ? Icon(Icons.check, color: theme.colorScheme.secondary) : null,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
