import 'package:intl/intl.dart';

final _brl = NumberFormat.currency(locale: 'pt_BR', symbol: r'R$');

/// Dinheiro trafega em centavos (int) em todo o sistema.
String formatBRL(int cents) => _brl.format(cents / 100);

String formatDistance(int meters) =>
    meters < 1000 ? '$meters m' : '${(meters / 1000).toStringAsFixed(1).replaceAll('.', ',')} km';

String formatRating(double rating) => rating.toStringAsFixed(1).replaceAll('.', ',');
