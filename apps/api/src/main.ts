import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErrorApiFilter } from './common/filters/error-api.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Documento 010, seccion 1: versionado explicito en el path.
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Documento 010, seccion 5: formato de error unico en toda la API.
  app.useGlobalFilters(new ErrorApiFilter());

  // El frontend (Next.js) es el unico origen esperado en esta fase - vive
  // fuera de la red de Gammacargo (Documento 013, seccion 2).
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3001',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
