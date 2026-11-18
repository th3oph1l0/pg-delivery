import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from '../domain/domain-error';

/** Converte qualquer erro em RFC 9457 (application/problem+json). */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const req = host.switchToHttp().getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let title = 'Erro interno';
    let detail: unknown = 'Ocorreu um erro inesperado. Tente novamente.';

    if (exception instanceof DomainError) {
      status = exception.status;
      code = exception.code;
      title = exception.message;
      detail = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      code = HttpStatus[status] ?? 'HTTP_ERROR';
      title = exception.message;
      detail = typeof body === 'object' && body && 'message' in body ? (body as { message: unknown }).message : body;
    } else {
      this.logger.error(exception);
    }

    res
      .status(status)
      .type('application/problem+json')
      .json({
        type: `https://docs.pgdelivery.com.br/errors/${code.toLowerCase().replace(/_/g, '-')}`,
        title,
        status,
        code,
        detail,
        instance: req.originalUrl,
        traceId: req.headers['x-request-id'],
      });
  }
}
