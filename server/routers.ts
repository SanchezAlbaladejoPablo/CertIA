import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Profile procedures
  profile: router({
    get: protectedProcedure.query(({ ctx }) =>
      db.getProfileByUserId(ctx.user.id)
    ),
    upsert: protectedProcedure
      .input(z.object({
        fullName: z.string().optional(),
        companyName: z.string().optional(),
        cifNif: z.string().optional(),
        installerNumber: z.string().optional(),
        installerCategory: z.string().optional(),
        autonomousCommunity: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.upsertProfile({ userId: ctx.user.id, ...input })
      ),
  }),

  // Subscription procedures
  subscription: router({
    get: protectedProcedure.query(({ ctx }) =>
      db.getSubscriptionByUserId(ctx.user.id)
    ),
    getPlanInfo: protectedProcedure.query(({ ctx }) =>
      db.getUserPlanInfo(ctx.user.id)
    ),
    canCreateCertificate: protectedProcedure.query(({ ctx }) =>
      db.canUserCreateCertificate(ctx.user.id)
    ),
    getAvailableCertificates: protectedProcedure.query(({ ctx }) =>
      db.getAvailableCertificates(ctx.user.id)
    ),
    createCheckoutSession: protectedProcedure
      .input(z.object({
        priceId: z.string(),
        successUrl: z.string(),
        cancelUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createCheckoutSession, getOrCreateStripeCustomer } = require('./services/subscription-service');
        const profile = await db.getProfileByUserId(ctx.user.id);
        const customerId = await getOrCreateStripeCustomer(
          ctx.user.id,
          ctx.user.email || '',
          profile?.fullName || ctx.user.name || 'User'
        );
        const sessionId = await createCheckoutSession(
          customerId,
          input.priceId,
          input.successUrl,
          input.cancelUrl
        );
        return { sessionId };
      }),
    createPortalSession: protectedProcedure
      .input(z.object({
        returnUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createPortalSession } = require('./services/subscription-service');
        const subscription = await db.getSubscriptionByUserId(ctx.user.id);
        if (!subscription?.stripeCustomerId) {
          throw new Error('No Stripe customer found');
        }
        const portalUrl = await createPortalSession(
          subscription.stripeCustomerId,
          input.returnUrl
        );
        return { portalUrl };
      }),
    incrementCertificateUsage: protectedProcedure.mutation(({ ctx }) =>
      db.incrementCertificateUsage(ctx.user.id)
    ),
  }),

  // Client procedures
  clients: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getClientsByUserId(ctx.user.id)
    ),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) =>
        db.getClientById(input.id, ctx.user.id)
      ),
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["person", "company"]),
        name: z.string(),
        dniNif: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createClient({ userId: ctx.user.id, ...input })
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        type: z.enum(["person", "company"]).optional(),
        name: z.string().optional(),
        dniNif: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateClient(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        db.deleteClient(input.id, ctx.user.id)
      ),
  }),

  // Installation procedures
  installations: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getInstallationsByUserId(ctx.user.id)
    ),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) =>
        db.getInstallationById(input.id, ctx.user.id)
      ),
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        name: z.string(),
        type: z.string().optional(),
        address: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        cadastralReference: z.string().optional(),
        cups: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createInstallation({ userId: ctx.user.id, ...input })
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        type: z.string().optional(),
        address: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        cadastralReference: z.string().optional(),
        cups: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateInstallation(id, ctx.user.id, data);
      }),
  }),

  // Certificate procedures
  certificates: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getCertificatesByUserId(ctx.user.id)
    ),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) =>
        db.getCertificateById(input.id, ctx.user.id)
      ),
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        installationId: z.number(),
        installationType: z.string().optional(),
        supplyVoltage: z.number().optional(),
        installedPower: z.number().optional(),
        phases: z.number().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createCertificate({ userId: ctx.user.id, status: 'draft', ...input })
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        installationType: z.string().optional(),
        supplyVoltage: z.number().optional(),
        installedPower: z.number().optional(),
        phases: z.number().optional(),
        diLength: z.string().optional(),
        diCableSection: z.string().optional(),
        diCableMaterial: z.string().optional(),
        diCableInsulation: z.string().optional(),
        boardLocation: z.string().optional(),
        igaRating: z.number().optional(),
        idSensitivity: z.number().optional(),
        overvoltageProtection: z.boolean().optional(),
        earthResistance: z.string().optional(),
        insulationResistance: z.string().optional(),
        continuityContinuity: z.string().optional(),
        rcdTestCurrent: z.number().optional(),
        rcdTestTime: z.number().optional(),
        observations: z.string().optional(),
        mermaidDiagram: z.string().optional(),
        pdfUrl: z.string().optional(),
        status: z.enum(["draft", "issued", "signed", "archived"]).optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateCertificate(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        db.deleteCertificate(input.id, ctx.user.id)
      ),
    duplicate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        db.duplicateCertificate(input.id, ctx.user.id)
      ),
    stats: protectedProcedure.query(({ ctx }) =>
      db.getCertificateStats(ctx.user.id)
    ),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['draft', 'issued', 'signed', 'archived']),
      }))
      .mutation(({ ctx, input }) =>
        db.updateCertificateStatus(input.id, ctx.user.id, input.status)
      ),
  }),

  // Calculations procedures
  calculations: router({
    cableSection: protectedProcedure
      .input(z.object({
        power: z.number(),
        voltage: z.number(),
        phases: z.number(),
        length: z.number(),
        material: z.enum(['Cu', 'Al']),
        maxVoltageDrop: z.number().optional().default(3),
      }))
      .query(({ input }) => {
        const { calculateCableSection } = require('./services/electrical-calculations');
        return calculateCableSection(
          input.power,
          input.voltage,
          input.phases,
          input.length,
          input.material,
          input.maxVoltageDrop
        );
      }),
    mainSwitch: protectedProcedure
      .input(z.object({
        installedPower: z.number(),
        phases: z.number(),
      }))
      .query(({ input }) => {
        const { calculateMainSwitchRating } = require('./services/electrical-calculations');
        return calculateMainSwitchRating(input.installedPower, input.phases);
      }),
    earthResistance: protectedProcedure
      .input(z.object({
        rcdRating: z.number(),
      }))
      .query(({ input }) => {
        const { calculateMaxEarthResistance } = require('./services/electrical-calculations');
        return calculateMaxEarthResistance(input.rcdRating);
      }),
  }),

  // AI procedures
  ai: router({
    suggestCircuits: protectedProcedure
      .input(z.object({
        installationType: z.string(),
        installedPower: z.number(),
      }))
      .query(({ input }) => {
        const { suggestCircuitsForInstallationType, suggestProtections } = require('./services/electrical-calculations');
        const circuits = suggestCircuitsForInstallationType(input.installationType, input.installedPower);
        const protections = suggestProtections(input.installedPower, 1);
        return {
          circuits,
          protections,
          notes: [
            'Estos son circuitos típicos recomendados según el tipo de instalación.',
            'Puedes modificarlos según las necesidades específicas del proyecto.',
            'Recuerda que las protecciones deben cumplir con el REBT.',
          ],
        };
      }),
    generateDiagram: protectedProcedure
      .input(z.object({
        installationType: z.string(),
        supplyVoltage: z.number(),
        supplyPhases: z.number(),
        groundingSystem: z.string(),
        mainSwitchRating: z.number(),
        mainRcdRating: z.number(),
        circuits: z.array(z.object({
          circuitNumber: z.string(),
          circuitName: z.string(),
          installedPower: z.number(),
          cableSection: z.number(),
          mcbRating: z.number(),
          rcdRequired: z.boolean(),
        })),
      }))
      .query(({ input }) => {
        const { generateUnifilarMermaidCode, generateUnifilarHTML } = require('./services/diagram-generation');
        const mermaidCode = generateUnifilarMermaidCode(input);
        const htmlRepresentation = generateUnifilarHTML(input);
        return {
          mermaidCode,
          htmlRepresentation,
        };
      }),
  }),

  // PDF procedures
  pdf: router({
    generateCertificate: protectedProcedure
      .input(z.object({
        certificateId: z.number(),
        clientName: z.string(),
        clientDni: z.string().optional(),
        clientAddress: z.string().optional(),
        clientPhone: z.string().optional(),
        installationType: z.string(),
        installationAddress: z.string(),
        installationCity: z.string().optional(),
        installationProvince: z.string().optional(),
        postalCode: z.string().optional(),
        cadastralReference: z.string().optional(),
        cups: z.string().optional(),
        supplyVoltage: z.number(),
        supplyPhases: z.number(),
        installedPower: z.number(),
        mainSwitchRating: z.number(),
        mainRcdRating: z.number(),
        earthResistance: z.number(),
        diLength: z.number(),
        diCableSection: z.number(),
        diCableMaterial: z.string(),
        insulationResistance: z.number(),
        continuityContinuity: z.number(),
        rcdTestCurrent: z.number(),
        rcdTestTime: z.number(),
        observations: z.string().optional(),
        circuits: z.array(z.object({
          circuitNumber: z.string(),
          circuitName: z.string(),
          installedPower: z.number(),
          cableSection: z.number(),
          mcbRating: z.number(),
          rcdRequired: z.boolean(),
        })),
        installerName: z.string().optional(),
        installerNumber: z.string().optional(),
      }))
      .query(({ input }) => {
        const { generateCertificateHTML } = require('./services/pdf-generation');
        const html = generateCertificateHTML(input);
        return {
          html,
          certificateId: input.certificateId,
        };
      }),
  }),

  // Circuit procedures
  circuits: router({
    listByCertificate: protectedProcedure
      .input(z.object({ certificateId: z.number() }))
      .query(({ input }) =>
        db.getCircuitsByCertificateId(input.certificateId)
      ),
    create: protectedProcedure
      .input(z.object({
        certificateId: z.number(),
        circuitNumber: z.string(),
        circuitName: z.string(),
        circuitType: z.string().optional(),
        installedPower: z.number().optional(),
        length: z.string().optional(),
        cableSection: z.string().optional(),
        cableMaterial: z.string().optional(),
        cableInsulation: z.string().optional(),
        cableCores: z.number().optional(),
        mcbRating: z.number().optional(),
        mcbCurve: z.string().optional(),
        rcdRequired: z.boolean().optional(),
        rcdRating: z.number().optional(),
        loadDescription: z.string().optional(),
      }))
      .mutation(({ input }) =>
        db.createCircuit(input)
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        circuitNumber: z.string().optional(),
        circuitName: z.string().optional(),
        circuitType: z.string().optional(),
        installedPower: z.number().optional(),
        length: z.string().optional(),
        cableSection: z.string().optional(),
        cableMaterial: z.string().optional(),
        cableInsulation: z.string().optional(),
        cableCores: z.number().optional(),
        mcbRating: z.number().optional(),
        mcbCurve: z.string().optional(),
        rcdRequired: z.boolean().optional(),
        rcdRating: z.number().optional(),
        loadDescription: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateCircuit(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) =>
        db.deleteCircuit(input.id)
      ),
  }),
});

export type AppRouter = typeof appRouter;

// Re-export types for client usage
export type { CableCalculationResult } from './services/electrical-calculations';
export type { DiagramGenerationInput } from './services/diagram-generation';
export type { CertificatePDFInput } from './services/pdf-generation';
