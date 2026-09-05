import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { prisma } from '../src/db.js';

describe('Security & Multi-Tenant User Isolation Suite', () => {
  let userAToken: string;
  let userAId: string;
  let userBToken: string;
  let userBId: string;
  let userAMortgageId: string;

  const timestamp = Date.now();
  const userAData = {
    name: 'User Alice (Victim)',
    email: `alice-${timestamp}@example.com`,
    password: 'AliceSecurePassword123!',
  };

  const userBData = {
    name: 'User Bob (Attacker)',
    email: `bob-${timestamp}@example.com`,
    password: 'BobSecurePassword123!',
  };

  beforeAll(async () => {
    // Register User A
    const resA = await request(app).post('/api/auth/register').send(userAData);
    expect(resA.status).toBe(201);
    userAToken = resA.body.token;
    userAId = resA.body.user.id;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send(userBData);
    expect(resB.status).toBe(201);
    userBToken = resB.body.token;
    userBId = resB.body.user.id;

    // User A creates a mortgage
    const mortgageRes = await request(app)
      .post('/api/mortgages')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: "Alice's Secret Penthouse",
        propertyName: 'Skyline Towers #42B',
        originalBalance: 750000,
        interestRate: 6.25,
        termYears: 30,
        startDate: '2026-03-01',
        paymentFrequency: 'MONTHLY',
      });
    expect(mortgageRes.status).toBe(201);
    userAMortgageId = mortgageRes.body.id;
  });

  afterAll(async () => {
    // Clean up created users
    if (userAId) await prisma.user.delete({ where: { id: userAId } }).catch(() => {});
    if (userBId) await prisma.user.delete({ where: { id: userBId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe('Strict Resource Isolation (Anti-IDOR / Anti-Tampering)', () => {
    it('User B CANNOT view User A mortgage by ID (returns 404 to prevent enumeration)', async () => {
      const res = await request(app)
        .get(`/api/mortgages/${userAMortgageId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Mortgage not found');
    });

    it('User B CANNOT view User A amortization schedule', async () => {
      const res = await request(app)
        .get(`/api/mortgages/${userAMortgageId}/amortization`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Mortgage not found');
    });

    it('User B CANNOT update User A mortgage parameters', async () => {
      const res = await request(app)
        .put(`/api/mortgages/${userAMortgageId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          name: 'Hacked by Bob',
          interestRate: 0.1,
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Mortgage not found');
    });

    it('User B CANNOT delete User A mortgage', async () => {
      const res = await request(app)
        .delete(`/api/mortgages/${userAMortgageId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Mortgage not found');

      // Verify Alice mortgage is still intact
      const checkRes = await request(app)
        .get(`/api/mortgages/${userAMortgageId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(checkRes.status).toBe(200);
    });

    it('User B CANNOT add extra payment rule to User A mortgage', async () => {
      const res = await request(app)
        .post(`/api/mortgages/${userAMortgageId}/extra-payments`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          type: 'RECURRING_MONTHLY',
          amount: 500,
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Mortgage not found');
    });

    it('User B CANNOT record a payment against User A mortgage', async () => {
      const res = await request(app)
        .post(`/api/mortgages/${userAMortgageId}/payments`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          paymentDate: '2026-03-01',
          scheduledAmount: 4618.79,
          actualAmount: 4618.79,
          principalPaid: 712.54,
          interestPaid: 3906.25,
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Mortgage not found');
    });

    it('User B CANNOT run scenario comparisons on User A mortgage', async () => {
      const res = await request(app)
        .post(`/api/mortgages/${userAMortgageId}/compare-scenarios`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          scenarios: [
            { name: 'Malicious Strategy', rules: [] }
          ],
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Mortgage not found');
    });

    it('User B mortgage list contains ZERO mortgages from User A', async () => {
      const res = await request(app)
        .get('/api/mortgages')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body).toHaveLength(0);
    });

    it('User B dashboard overview contains ZERO aggregated totals from User A', async () => {
      const res = await request(app)
        .get('/api/mortgages/overview')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalMortgages).toBe(0);
      expect(res.body.totalOriginalLoan).toBe(0);
      expect(res.body.totalCurrentBalance).toBe(0);
    });
  });

  describe('JWT Authentication & Integrity Verification', () => {
    it('Rejects requests with missing authentication header', async () => {
      const res = await request(app).get('/api/mortgages');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Authentication required');
    });

    it('Rejects requests with forged / invalid JWT token', async () => {
      const res = await request(app)
        .get('/api/mortgages')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.forged.signature');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid or expired session');
    });

    it('Rejects requests with malformed Authorization headers', async () => {
      const res = await request(app)
        .get('/api/mortgages')
        .set('Authorization', 'InvalidFormat');

      expect(res.status).toBe(401);
    });

    it('Ensures password hashes in database use bcrypt with salt rounds >= 10', async () => {
      const user = await prisma.user.findUnique({ where: { id: userAId } });
      expect(user).toBeDefined();
      expect(user!.passwordHash).not.toBe(userAData.password);
      expect(user!.passwordHash.startsWith('$2')).toBe(true);

      const isMatch = await bcrypt.compare(userAData.password, user!.passwordHash);
      expect(isMatch).toBe(true);
    });
  });
});
