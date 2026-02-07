import { Catch, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException)
export class WsExceptionFilter implements ExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const data = host.switchToWs().getData();

    // Format the error response
    const error = {
      status: 'error',
      message: exception.message,
      timestamp: new Date().toISOString(),
    };

    // Emit error back to client
    client.emit('exception', error);
  }
}
