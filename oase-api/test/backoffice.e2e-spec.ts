import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Backoffice E2E', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('/health (GET) doit être accessible', () => {
    return request(app.getHttpServer()).get('/api/v1/health').expect(200);
  });

  it('/bases-juridiques (GET) doit exiger une authentification', () => {
    return request(app.getHttpServer()).get('/api/v1/bases-juridiques').expect(401);
  });

  it('/rapports/opendata (GET) doit exiger une authentification', () => {
    return request(app.getHttpServer()).get('/api/v1/rapports/opendata').expect(401);
  });

  it('/dashboards/p4 (GET) doit exiger une authentification', () => {
    return request(app.getHttpServer()).get('/api/v1/dashboards/p4').expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
