/** Erro de regra de negócio. O filtro global converte em 422 application/problem+json. */
export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 422,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity.toUpperCase()}_NOT_FOUND`, `${entity} ${id} não encontrado`, 404);
  }
}

export class ConcurrencyError extends DomainError {
  constructor(entity: string) {
    super('CONCURRENT_MODIFICATION', `${entity} foi alterado por outra operação; tente novamente`, 409);
  }
}
