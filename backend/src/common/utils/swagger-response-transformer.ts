import { OpenAPIObject } from '@nestjs/swagger';

/**
 * Transforms Swagger/OpenAPI document to wrap all responses with ResponseInterceptor structure
 * @param document - The OpenAPI document to transform
 * @returns The transformed document
 */
export function transformSwaggerResponses(
  document: OpenAPIObject,
): OpenAPIObject {
  if (!document.paths) {
    return document;
  }

  Object.keys(document.paths).forEach((path) => {
    const pathItem = document.paths[path];
    if (!pathItem) return;

    Object.keys(pathItem).forEach((method) => {
      const operation = pathItem[method];
      if (!operation?.responses) return;

      Object.keys(operation.responses).forEach((statusCode) => {
        const response = operation.responses[statusCode];
        if (!response?.content?.['application/json']?.schema) return;

        const originalSchema = response.content['application/json'].schema;

        // Wrap the original schema with interceptor structure
        response.content['application/json'].schema = {
          type: 'object',
          properties: {
            data: originalSchema,
            server_meta: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: true,
                  description: 'Indicates if the request was successful',
                },
                statusCode: {
                  type: 'number',
                  example: parseInt(statusCode) || 200,
                  description: 'HTTP status code',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  example: new Date().toISOString(),
                  description: 'Server response timestamp',
                },
              },
              required: ['success', 'statusCode', 'timestamp'],
            },
          },
          required: ['data', 'server_meta'],
        };
      });
    });
  });

  return document;
}
