import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/db.js';

describe('Mortgage Tracker Backend API Integration Suite', () => {
  let authToken: string;
  let userId: string;
  let mortgageId: string;

  const testUser = {
    name: 'Integration Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'Password123!',
  };

  afterAll(async () => {
    // Clean up test data
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('GET /api/health should return status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/auth/register should create user and return JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.user.name).toBe(testUser.name);

    authToken = res.body.token;
    userId = res.body.user.id;
  });

  it('POST /api/auth/login should authenticate with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.id).toBe(userId);
  });

  it('GET /api/mortgages should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/mortgages');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('POST /api/mortgages should create a mortgage and calculate scheduled monthly payment', async () => {
    const res = await request(app)
      .post('/api/mortgages')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Austin Family Home',
        propertyName: 'Maple Residence',
        propertyAddress: '123 Maple St',
        propertyValue: 400000,
        purchasePrice: 380000,
        originalBalance: 300000,
        interestRate: 6.5,
        termYears: 30,
        startDate: '2026-01-01',
        paymentFrequency: 'MONTHLY',
        propertyTaxMonthly: 300,
        homeInsuranceMonthly: 100,
        hoaMonthly: 50,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.scheduledPayment).toBe(1896.20);
    expect(res.body.originalBalance).toBe(300000);
    expect(res.body.property).toBeDefined();

    mortgageId = res.body.id;
  });

  it('GET /api/mortgages/:id should return mortgage details with property', async () => {
    const res = await request(app)
      .get(`/api/mortgages/${mortgageId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(mortgageId);
    expect(res.body.name).toBe('Austin Family Home');
  });

  it('GET /api/mortgages/:id/amortization should return dynamic schedule', async () => {
    const res = await request(app)
      .get(`/api/mortgages/${mortgageId}/amortization?extraMonthly=200`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.schedule).toBeInstanceOf(Array);
    expect(res.body.schedule.length).toBeLessThan(360); // 200 extra/mo accelerates payoff
    expect(res.body.impact.savings.monthsSaved).toBeGreaterThan(0);
    expect(res.body.impact.savings.interestSaved).toBeGreaterThan(0);
  });

  it('POST /api/mortgages/:id/extra-payments should add a recurring extra payment rule', async () => {
    const res = await request(app)
      .post(`/api/mortgages/${mortgageId}/extra-payments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'RECURRING_MONTHLY',
        amount: 300,
        startMonth: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.amount).toBe(300);
  });

  it('POST /api/mortgages/:id/payments should record an actual payment and update remaining balance', async () => {
    const res = await request(app)
      .post(`/api/mortgages/${mortgageId}/payments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        paymentDate: '2026-02-01',
        scheduledAmount: 1896.20,
        actualAmount: 2396.20,
        principalPaid: 271.20,
        interestPaid: 1625.00,
        extraPrincipal: 500.00,
        notes: 'First payment with $500 extra principal bonus',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.actualAmount).toBe(2396.20);
    expect(res.body.extraPrincipal).toBe(500);

    // Verify balance was reduced: 300000 - 271.20 - 500 = 299228.80
    const mRes = await request(app)
      .get(`/api/mortgages/${mortgageId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(mRes.body.currentBalance).toBe(299228.80);
  });

  it('GET /api/mortgages/overview should return accurate aggregated portfolio stats', async () => {
    const res = await request(app)
      .get('/api/mortgages/overview')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalMortgages).toBe(1);
    expect(res.body.totalOriginalLoan).toBe(300000);
    expect(res.body.totalCurrentBalance).toBe(299228.80);
    expect(res.body.totalPrincipalPaid).toBe(771.20);
  });

  it('POST /api/mortgages/:id/compare-scenarios should compare strategies', async () => {
    const res = await request(app)
      .post(`/api/mortgages/${mortgageId}/compare-scenarios`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        scenarios: [
          { id: 'baseline', name: 'Baseline' },
          { id: 's2', name: '+$200/mo', extraMonthlyAmount: 200 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[1].monthsSaved).toBeGreaterThan(0);
  });
});
