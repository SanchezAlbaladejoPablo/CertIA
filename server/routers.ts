import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { calculateCableSection } from "./services/electrical-calculations";

// Helper: parsea una dirección española en tipo de vía, nombre y número
function parseSpanishAddress(address: string): { sigla: string; nombre: string; numero: string } | null {
  const normalized = address.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const streetTypes: Record<string, string> = {
    "CALLE": "CL", "C/": "CL", "CL ": "CL",
    "AVENIDA": "AV", "AVDA": "AV", "AV ": "AV",
    "PASEO": "PG",
    "PLAZA": "PZ", "PL ": "PZ",
    "CAMINO": "CM",
    "CARRETERA": "CR", "CTRA": "CR",
    "RONDA": "RD",
    "TRAVESIA": "TV",
    "GRAN VIA": "GV",
    "BOULEVARD": "BD",
  };
  const typePattern = Object.keys(streetTypes).map(k => k.trim()).join("|");
  const regex = new RegExp(`^(${typePattern})\\.?\\s+(.+?)\\s+(\\d+)`, "i");
  const match = normalized.match(regex);
  if (!match) return null;
  const typeKey = Object.keys(streetTypes).find(k => k.trim() === match[1].trim()) ?? match[1];
  return {
    sigla: streetTypes[typeKey] ?? "CL",
    nombre: match[2].trim(),
    numero: match[3],
  };
}

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
        companyName: z.string().optional(),
        cifNif: z.string().optional(),
        email: z.string().optional(),
        companyAuthNumber: z.string().optional(),
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

  // Installer procedures
  installers: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getInstallersByUserId(ctx.user.id)
    ),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) =>
        db.getInstallerById(input.id, ctx.user.id)
      ),
    create: protectedProcedure
      .input(z.object({
        fullName: z.string(),
        nif: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        installerNumber: z.string().optional(),
        installerCategory: z.string().optional(),
        signatureUrl: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createInstaller({ userId: ctx.user.id, ...input })
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        fullName: z.string().optional(),
        nif: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        installerNumber: z.string().optional(),
        installerCategory: z.string().optional(),
        signatureUrl: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateInstaller(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        db.deleteInstaller(input.id, ctx.user.id)
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
    getWithRelations: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const [client, allInstallations, allCertificates] = await Promise.all([
          db.getClientById(input.id, ctx.user.id),
          db.getInstallationsByUserId(ctx.user.id),
          db.getCertificatesByUserId(ctx.user.id),
        ]);
        if (!client) return null;
        const installations = allInstallations.filter((i) => i.clientId === input.id);
        const certificates = allCertificates.filter((c) => c.clientId === input.id);
        return { client, installations, certificates };
      }),
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
    // FASE 5.4: filtrado avanzado
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        installationType: z.string().optional(),
        search: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const [certs, clients] = await Promise.all([
          db.getCertificatesByUserId(ctx.user.id),
          db.getClientsByUserId(ctx.user.id),
        ]);
        const clientMap = new Map(clients.map((c) => [c.id, c.name]));
        let result = certs.map((cert) => ({
          ...cert,
          clientName: clientMap.get(cert.clientId) ?? '-',
        }));
        if (input?.status && input.status !== 'all') {
          result = result.filter((c) => c.status === input.status);
        }
        if (input?.installationType) {
          result = result.filter((c) =>
            c.installationType?.toLowerCase().includes(input.installationType!.toLowerCase())
          );
        }
        if (input?.search) {
          const q = input.search.toLowerCase();
          result = result.filter((c) =>
            c.clientName.toLowerCase().includes(q) ||
            c.certificateNumber?.toLowerCase().includes(q)
          );
        }
        if (input?.dateFrom) {
          const from = new Date(input.dateFrom);
          result = result.filter((c) => new Date(c.createdAt) >= from);
        }
        if (input?.dateTo) {
          const to = new Date(input.dateTo);
          to.setHours(23, 59, 59, 999);
          result = result.filter((c) => new Date(c.createdAt) <= to);
        }
        return result;
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) =>
        db.getCertificateById(input.id, ctx.user.id)
      ),
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        installationId: z.number(),
        installerId: z.number().optional(),
        installationType: z.string().optional(),
        locationCategory: z.string().optional(),
        electrificationGrade: z.string().optional(),
        maxAdmissiblePower: z.number().optional(),
        serviceCommissionDate: z.string().optional(),
        lightingPointsCount: z.number().optional(),
        outletsCount: z.number().optional(),
        groundingSystem: z.string().optional(),
        supplyVoltage: z.number().optional(),
        installedPower: z.number().optional(),
        phases: z.number().optional(),
        diLength: z.string().optional(),
        diCableSection: z.string().optional(),
        diCableMaterial: z.string().optional(),
        diCableInsulation: z.string().optional(),
        ambientTemp: z.number().optional(),
        installMethod: z.string().optional(),
        groupedCables: z.number().optional(),
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
        status: z.enum(["draft", "issued", "signed", "archived"]).optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { serviceCommissionDate, ...rest } = input;
        return db.createCertificate({
          userId: ctx.user.id,
          status: 'draft',
          ...rest,
          ...(serviceCommissionDate ? { serviceCommissionDate: new Date(serviceCommissionDate) } : {}),
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        installerId: z.number().optional(),
        installationType: z.string().optional(),
        locationCategory: z.string().optional(),
        electrificationGrade: z.string().optional(),
        maxAdmissiblePower: z.number().optional(),
        serviceCommissionDate: z.string().optional(),
        lightingPointsCount: z.number().optional(),
        outletsCount: z.number().optional(),
        groundingSystem: z.string().optional(),
        supplyVoltage: z.number().optional(),
        installedPower: z.number().optional(),
        phases: z.number().optional(),
        diLength: z.string().optional(),
        diCableSection: z.string().optional(),
        diCableMaterial: z.string().optional(),
        diCableInsulation: z.string().optional(),
        ambientTemp: z.number().optional(),
        installMethod: z.string().optional(),
        groupedCables: z.number().optional(),
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
        const { id, serviceCommissionDate, ...rest } = input;
        return db.updateCertificate(id, ctx.user.id, {
          ...rest,
          ...(serviceCommissionDate ? { serviceCommissionDate: new Date(serviceCommissionDate) } : {}),
        });
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
        // FASE 5.3: estados extendidos — draft → issued → submitted → registered → signed → archived
        status: z.enum(['draft', 'issued', 'submitted', 'registered', 'signed', 'archived']),
        expedienteNumber: z.string().optional(),
        submittedAt: z.string().optional(), // ISO date string
      }))
      .mutation(({ ctx, input }) => {
        const extra: { expedienteNumber?: string; submittedAt?: Date } = {};
        if (input.expedienteNumber) extra.expedienteNumber = input.expedienteNumber;
        if (input.submittedAt) extra.submittedAt = new Date(input.submittedAt);
        return db.updateCertificateStatus(input.id, ctx.user.id, input.status, extra);
      }),
    // FASE 5.2: envío de certificado por email al cliente
    sendToClient: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { buildCertificatePdfInputFromId } = await import('./services/export/certificate-package');
        const { generateCertificateHTMLByCCAA } = await import('./services/pdf-generation');
        const { sendCertificateEmail } = await import('./services/email-service');

        const pdfInput = await buildCertificatePdfInputFromId(input.id, ctx.user.id);
        const client = await db.getClientById(pdfInput.certificateId, ctx.user.id);
        const actualClient = await db.getClientById(
          (await db.getCertificateById(input.id, ctx.user.id))?.clientId ?? 0,
          ctx.user.id
        );
        if (!actualClient?.email) {
          throw new Error('El cliente no tiene email registrado');
        }
        const html = await generateCertificateHTMLByCCAA(pdfInput, pdfInput.autonomousCommunity);
        await sendCertificateEmail({
          toEmail: actualClient.email,
          toName: actualClient.name,
          installerName: pdfInput.installerFullName ?? 'Instalador',
          certificateNumber: pdfInput.certificateNumber ?? String(input.id),
          certificateHtml: html,
        });
        return { success: true };
      }),
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
        // ITC-BT-15: DI → 1%   ITC-BT-19: circuitos → 3%   ITC-BT-47: industrial → 5%
        maxVoltageDrop: z.number().optional().default(3),
        insulation: z.enum(['PVC', 'XLPE']).optional().default('PVC'),
        ambientTemp: z.number().optional().default(30),
        groupedCables: z.number().optional().default(1),
        installMethod: z.string().optional().default('air'),
      }))
      .query(({ input }) => {
        const { calculateCableSection } = require('./services/electrical-calculations');
        return calculateCableSection(
          input.power, input.voltage, input.phases, input.length,
          input.material, input.maxVoltageDrop, input.insulation,
          input.ambientTemp, input.groupedCables, input.installMethod
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
    rcdTripTime: protectedProcedure
      .input(z.object({
        measuredTimeMs: z.number(),
        sensitivityMa: z.number(),
        multiplier: z.union([z.literal(1), z.literal(2), z.literal(5)]).default(1),
        rcdType: z.enum(['AC', 'A', 'S', 'B']).default('AC'),
      }))
      .query(({ input }) => {
        const { verifyRcdTripTime } = require('./services/electrical-calculations');
        return verifyRcdTripTime(
          input.measuredTimeMs,
          input.sensitivityMa,
          input.multiplier,
          input.rcdType
        );
      }),
    protectionCoordination: protectedProcedure
      .input(z.object({
        mcbRating: z.number(),
        cableSection: z.number(),
        material: z.enum(['Cu', 'Al']).optional().default('Cu'),
        insulation: z.enum(['PVC', 'XLPE']).optional().default('PVC'),
        correctionFactor: z.number().optional().default(1.0),
      }))
      .query(({ input }) => {
        const { validateProtectionCoordination } = require('./services/electrical-calculations');
        return validateProtectionCoordination(
          input.mcbRating, input.cableSection,
          input.material, input.insulation, input.correctionFactor
        );
      }),
    contactVoltage: protectedProcedure
      .input(z.object({
        earthResistance: z.number(),
        rcdSensitivity: z.number(),
      }))
      .query(({ input }) => {
        const { calculateContactVoltage } = require('./services/electrical-calculations');
        return calculateContactVoltage(input.earthResistance, input.rcdSensitivity);
      }),
    correctionFactor: protectedProcedure
      .input(z.object({
        ambientTemp: z.number().optional().default(30),
        groupedCables: z.number().optional().default(1),
        installMethod: z.string().optional().default('air'),
        material: z.enum(['Cu', 'Al']).optional().default('Cu'),
        insulation: z.enum(['PVC', 'XLPE']).optional().default('PVC'),
      }))
      .query(({ input }) => {
        const { getCorrectionFactor, INSTALL_METHODS } = require('./services/electrical-calculations');
        return {
          factor: getCorrectionFactor(
            input.ambientTemp, input.groupedCables, input.installMethod,
            input.material, input.insulation
          ),
          installMethods: INSTALL_METHODS,
        };
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
    // FASE 6.1: revisión IA del certificado completo
    reviewCertificate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const { buildCertificatePdfInputFromId } = await import('./services/export/certificate-package');
        const pdfInput = await buildCertificatePdfInputFromId(input.id, ctx.user.id);

        // Análisis determinístico REBT (sin OpenAI para no requerir API key)
        const issues: Array<{ severity: 'error' | 'warning' | 'suggestion'; message: string }> = [];

        if (!pdfInput.installerFullName) {
          issues.push({ severity: 'error', message: 'Datos del instalador incompletos. Completa tu perfil.' });
        }
        if (!pdfInput.clientName || pdfInput.clientName === '-') {
          issues.push({ severity: 'error', message: 'Nombre del cliente no especificado.' });
        }
        if (!pdfInput.installationAddress || pdfInput.installationAddress === '-') {
          issues.push({ severity: 'error', message: 'Dirección de la instalación no especificada.' });
        }
        if ((pdfInput.circuits?.length ?? 0) === 0) {
          issues.push({ severity: 'error', message: 'No hay circuitos definidos.' });
        }
        if (pdfInput.earthResistance <= 0) {
          issues.push({ severity: 'warning', message: 'Resistencia de tierra no medida o no válida.' });
        }
        if (pdfInput.insulationResistance <= 0) {
          issues.push({ severity: 'warning', message: 'Resistencia de aislamiento no especificada.' });
        }
        // C5 obligatorio en viviendas (ITC-BT-25)
        if (pdfInput.installationType?.toLowerCase().includes('vivienda')) {
          const hasC5 = pdfInput.circuits?.some(
            (c) => c.circuitNumber === 'C5' || c.circuitName?.toLowerCase().includes('baño')
          );
          if (!hasC5) {
            issues.push({ severity: 'warning', message: 'ITC-BT-25: Circuito C5 (baños) no detectado. Obligatorio en viviendas.' });
          }
        }
        // Verificar tensión de contacto
        if (pdfInput.earthResistance > 0 && pdfInput.mainRcdRating > 0) {
          const uc = pdfInput.earthResistance * (pdfInput.mainRcdRating / 1000);
          if (uc > 50) {
            issues.push({ severity: 'error', message: `Tensión de contacto Uc=${uc.toFixed(1)}V supera 50V (ITC-BT-24). Revisar Rt o sensibilidad del diferencial.` });
          }
        }
        if (issues.length === 0) {
          issues.push({ severity: 'suggestion', message: 'El certificado supera las comprobaciones básicas REBT. Verifica los cálculos de circuitos manualmente.' });
        }
        return { issues };
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
        const { generateUnifilarMermaidCode, generateUnifilarHTML, generateUnifilarSVG } = require('./services/diagram-generation');
        const mermaidCode = generateUnifilarMermaidCode(input);
        const htmlRepresentation = generateUnifilarHTML(input);
        const svgContent = generateUnifilarSVG(input);
        return { mermaidCode, htmlRepresentation, svgContent };
      }),

    // Genera SVG unifilar interactivo desde certificateId (para la lista de certificados)
    unifilarSvgFromId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const cert = await db.getCertificateById(input.id, ctx.user.id);
        if (!cert) throw new Error('Certificado no encontrado');
        const circuits = await db.getCircuitsByCertificateId(cert.id);
        const { generateUnifilarSVG } = await import('./services/diagram-generation');
        const svgContent = generateUnifilarSVG({
          installationType: cert.installationType ?? '-',
          supplyVoltage: cert.supplyVoltage ?? 230,
          supplyPhases: cert.phases ?? 1,
          groundingSystem: cert.groundingSystem ?? 'TT',
          mainSwitchRating: cert.igaRating ?? 0,
          mainRcdRating: cert.idSensitivity ?? 30,
          circuits: circuits.map(c => ({
            circuitNumber: c.circuitNumber,
            circuitName: c.circuitName,
            installedPower: c.installedPower ?? 0,
            cableSection: parseFloat(c.cableSection ?? '0'),
            mcbRating: c.mcbRating ?? 0,
            rcdRequired: c.rcdRequired ?? false,
          })),
        });
        return { svgContent, certificateNumber: cert.certificateNumber };
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
        locationCategory: z.string().optional(),
        electrificationGrade: z.string().optional(),
        groundingSystem: z.string().optional(),
        maxAdmissiblePower: z.number().optional(),
        serviceCommissionDate: z.string().optional(),
        lightingPointsCount: z.number().optional(),
        outletsCount: z.number().optional(),
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
        idSensitivity: z.number().optional(),
        overvoltageProtection: z.boolean().optional(),
        earthResistance: z.number(),
        diLength: z.number(),
        diCableSection: z.number(),
        diCableMaterial: z.string(),
        diCableInsulation: z.string().optional(),
        ambientTemp: z.number().optional(),
        installMethod: z.string().optional(),
        insulationResistance: z.number(),
        continuityContinuity: z.number(),
        rcdTestCurrent: z.number(),
        rcdTestTime: z.number(),
        observations: z.string().optional(),
        circuits: z.array(z.object({
          circuitNumber: z.string(),
          circuitName: z.string(),
          circuitType: z.string().optional(),
          installedPower: z.number(),
          length: z.number().optional(),
          cableSection: z.number(),
          cableMaterial: z.string().optional(),
          cableInsulation: z.string().optional(),
          mcbRating: z.number(),
          mcbCurve: z.string().optional(),
          rcdRequired: z.boolean(),
          rcdRating: z.number().optional(),
          loadDescription: z.string().optional(),
        })),
        installerFullName: z.string().optional(),
        installerName: z.string().optional(),
        installerNumber: z.string().optional(),
        installerCategory: z.string().optional(),
        companyName: z.string().optional(),
        companyNif: z.string().optional(),
        companyAuthNumber: z.string().optional(),
        autonomousCommunity: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { generateCertificateHTMLByCCAA } = await import('./services/pdf-generation');
        const html = await generateCertificateHTMLByCCAA(input, input.autonomousCommunity);
        return { html, certificateId: input.certificateId };
      }),

    // Auto-assembles certificate from DB: cert + client + installation + profile → HTML
    generateFromCertificateId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const { generateCertificateHTMLByCCAA } = await import('./services/pdf-generation');

        const cert = await db.getCertificateById(input.id, ctx.user.id);
        if (!cert) throw new Error('Certificado no encontrado');

        const [client, installation, profile, circuits] = await Promise.all([
          db.getClientById(cert.clientId, ctx.user.id),
          db.getInstallationById(cert.installationId, ctx.user.id),
          db.getProfileByUserId(ctx.user.id),
          db.getCircuitsByCertificateId(cert.id),
        ]);

        const pdfInput = {
          certificateId: cert.id,
          certificateNumber: cert.certificateNumber ?? undefined,
          // Client
          clientName: client?.name ?? '-',
          clientDni: client?.dniNif ?? undefined,
          clientAddress: client?.address ?? undefined,
          clientPhone: client?.phone ?? undefined,
          // Installation
          installationType: cert.installationType ?? '-',
          locationCategory: cert.locationCategory ?? undefined,
          electrificationGrade: cert.electrificationGrade ?? undefined,
          maxAdmissiblePower: cert.maxAdmissiblePower ?? undefined,
          serviceCommissionDate: cert.serviceCommissionDate ? new Date(cert.serviceCommissionDate).toISOString() : undefined,
          lightingPointsCount: cert.lightingPointsCount ?? undefined,
          outletsCount: cert.outletsCount ?? undefined,
          groundingSystem: cert.groundingSystem ?? undefined,
          installationAddress: installation?.address ?? '-',
          installationCity: installation?.city ?? undefined,
          installationProvince: installation?.province ?? undefined,
          postalCode: installation?.postalCode ?? undefined,
          cadastralReference: installation?.cadastralReference ?? undefined,
          cups: installation?.cups ?? undefined,
          // Electrical
          supplyVoltage: cert.supplyVoltage ?? 230,
          supplyPhases: cert.phases ?? 1,
          installedPower: cert.installedPower ?? 0,
          mainSwitchRating: cert.igaRating ?? 0,
          mainRcdRating: cert.idSensitivity ?? 30,
          idSensitivity: cert.idSensitivity ?? undefined,
          overvoltageProtection: cert.overvoltageProtection ?? undefined,
          earthResistance: parseFloat(cert.earthResistance ?? '0'),
          // DI
          diLength: parseFloat(cert.diLength ?? '0'),
          diCableSection: parseFloat(cert.diCableSection ?? '0'),
          diCableMaterial: cert.diCableMaterial ?? 'Cu',
          diCableInsulation: cert.diCableInsulation ?? undefined,
          ambientTemp: cert.ambientTemp ?? undefined,
          installMethod: cert.installMethod ?? undefined,
          // Measurements
          insulationResistance: parseFloat(cert.insulationResistance ?? '0'),
          continuityContinuity: parseFloat(cert.continuityContinuity ?? '0'),
          rcdTestCurrent: cert.rcdTestCurrent ?? 30,
          rcdTestTime: cert.rcdTestTime ?? 300,
          observations: cert.observations ?? undefined,
          // Circuits
          circuits: circuits.map(c => ({
            circuitNumber: c.circuitNumber,
            circuitName: c.circuitName,
            circuitType: c.circuitType ?? undefined,
            installedPower: c.installedPower ?? 0,
            length: c.length != null ? parseFloat(c.length) : undefined,
            cableSection: parseFloat(c.cableSection ?? '0'),
            cableMaterial: c.cableMaterial ?? undefined,
            cableInsulation: c.cableInsulation ?? undefined,
            mcbRating: c.mcbRating ?? 0,
            mcbCurve: c.mcbCurve ?? undefined,
            rcdRequired: c.rcdRequired ?? false,
            rcdRating: c.rcdRating ?? undefined,
            loadDescription: c.loadDescription ?? undefined,
          })),
          // Installer (from profile)
          installerFullName: profile?.fullName ?? undefined,
          installerNumber: profile?.installerNumber ?? undefined,
          installerCategory: profile?.installerCategory ?? undefined,
          companyName: profile?.companyName ?? undefined,
          companyNif: profile?.cifNif ?? undefined,
          companyAuthNumber: profile?.companyAuthNumber ?? undefined,
          autonomousCommunity: profile?.autonomousCommunity ?? undefined,
          issueDate: cert.updatedAt,
        };

        const html = await generateCertificateHTMLByCCAA(pdfInput, pdfInput.autonomousCommunity);
        return {
          html,
          certificateId: cert.id,
          certificateNumber: cert.certificateNumber,
          fileName: `CIE-${cert.certificateNumber ?? cert.id}.html`,
        };
      }),


    // Genera muestra de plantilla vacía para una CCAA (para la página de Plantillas)
    templatePreview: protectedProcedure
      .input(z.object({ ccaa: z.string() }))
      .query(async ({ input }) => {
        const { generateCertificateHTMLByCCAA } = await import('./services/pdf-generation');
        const demoInput = {
          certificateId: 0,
          certificateNumber: 'CIE-XXXX-XXXX',
          clientName: 'Nombre del Cliente',
          clientDni: '12345678A',
          clientAddress: 'C/ Ejemplo 1, 1º A',
          clientPhone: '600 000 000',
          installationType: 'Vivienda unifamiliar',
          locationCategory: 'Seco',
          electrificationGrade: 'Básico',
          groundingSystem: 'TT',
          installationAddress: 'C/ Instalación 10',
          installationCity: 'Ciudad',
          installationProvince: 'Provincia',
          postalCode: '00000',
          supplyVoltage: 230,
          supplyPhases: 1,
          installedPower: 9200,
          mainSwitchRating: 40,
          mainRcdRating: 63,
          idSensitivity: 30,
          earthResistance: 18.5,
          diLength: 15,
          diCableSection: 10,
          diCableMaterial: 'Cu',
          insulationResistance: 500,
          continuityContinuity: 0.8,
          rcdTestCurrent: 30,
          rcdTestTime: 40,
          circuits: [
            { circuitNumber: 'C1', circuitName: 'Alumbrado general', circuitType: 'Iluminación', installedPower: 1500, cableSection: 1.5, cableMaterial: 'Cu', mcbRating: 10, mcbCurve: 'C', rcdRequired: false },
            { circuitNumber: 'C2', circuitName: 'Tomas uso general', circuitType: 'Tomas', installedPower: 3000, cableSection: 2.5, cableMaterial: 'Cu', mcbRating: 16, mcbCurve: 'C', rcdRequired: true, rcdRating: 30 },
          ],
          installerFullName: 'Nombre del Instalador',
          installerNumber: 'XX/XXXX/XXXX',
          installerCategory: 'Básica',
          companyName: 'Empresa Instaladora S.L.',
          companyNif: 'B12345678',
          autonomousCommunity: input.ccaa,
        };
        const html = await generateCertificateHTMLByCCAA(demoInput, input.ccaa);
        return { html };
      }),

    // Genera memoria técnica abreviada desde certificateId
    generateMemoryFromCertificateId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const { buildCertificatePdfInputFromId } = await import('./services/export/certificate-package');
        const { generateMemoryHTML } = await import('./services/memory-generation');
        const pdfInput = await buildCertificatePdfInputFromId(input.id, ctx.user.id);
        const html = generateMemoryHTML(pdfInput);
        return { html, certificateId: pdfInput.certificateId };
      }),

    // Genera hoja de ensayos desde certificateId
    generateTestsSheetFromCertificateId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const { buildCertificatePdfInputFromId } = await import('./services/export/certificate-package');
        const { generateTestsSheetHTML } = await import('./services/pdf-generation');
        const pdfInput = await buildCertificatePdfInputFromId(input.id, ctx.user.id);
        const html = generateTestsSheetHTML(pdfInput);
        return { html, certificateId: pdfInput.certificateId };
      }),

    // Genera informe de cálculo REBT desde certificateId
    generateCalculationReportFromCertificateId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const { buildCertificatePdfInputFromId } = await import('./services/export/certificate-package');
        const { generateCalculationReportHTML } = await import('./services/calculation-report');
        const pdfInput = await buildCertificatePdfInputFromId(input.id, ctx.user.id);
        const html = generateCalculationReportHTML(pdfInput);
        return { html, certificateId: pdfInput.certificateId, certificateNumber: pdfInput.certificateNumber };
      }),

    // Genera esquema unifilar en HTML desde certificateId
    generateUnifilarFromCertificateId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const cert = await db.getCertificateById(input.id, ctx.user.id);
        if (!cert) throw new Error('Certificado no encontrado');
        const circuits = await db.getCircuitsByCertificateId(cert.id);
        const { generateUnifilarHTML } = await import('./services/diagram-generation');
        const html = generateUnifilarHTML({
          installationType: cert.installationType ?? '-',
          supplyVoltage: cert.supplyVoltage ?? 230,
          supplyPhases: cert.phases ?? 1,
          groundingSystem: cert.groundingSystem ?? 'TT',
          mainSwitchRating: cert.igaRating ?? 0,
          mainRcdRating: cert.idSensitivity ?? 30,
          circuits: circuits.map(c => ({
            circuitNumber: c.circuitNumber,
            circuitName: c.circuitName,
            installedPower: c.installedPower ?? 0,
            cableSection: parseFloat(c.cableSection ?? '0'),
            mcbRating: c.mcbRating ?? 0,
            rcdRequired: c.rcdRequired ?? false,
          })),
        });
        return { html, certificateId: cert.id };
      }),
  }),

  // Export procedures (ZIP para tramitación electrónica)
  export: router({
    certificatePackage: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const { buildCertificatePackage } = await import('./services/export/certificate-package');
        const zipBuffer = await buildCertificatePackage(input.id, ctx.user.id);
        return { file: zipBuffer.toString('base64'), fileName: `certia-package-${input.id}.zip` };
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
        installMethod: z.string().optional(),
        voltageDrop: z.string().optional(),
        designCurrent: z.string().optional(),
        loadDescription: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Auto-calcular caída de tensión e intensidad de diseño (ITC-BT-19)
        let voltageDrop = input.voltageDrop;
        let designCurrent = input.designCurrent;

        if (!voltageDrop && input.cableSection && input.installedPower && input.length) {
          const cert = await db.getCertificateById(input.certificateId, ctx.user.id);
          if (cert) {
            try {
              const calc = calculateCableSection(
                input.installedPower,
                cert.supplyVoltage ?? 230,
                cert.phases ?? 1,
                parseFloat(input.length),
                (input.cableMaterial as 'Cu' | 'Al') ?? 'Cu',
                3,
                (input.cableInsulation as 'PVC' | 'XLPE') ?? 'PVC',
                cert.ambientTemp ?? 30,
                cert.groupedCables ?? 1,
                cert.installMethod ?? 'embedded_conduit',
              );
              voltageDrop = calc.voltageDrop.toString();
              designCurrent = calc.current.toString();
            } catch {
              // Cálculo no crítico — continuar sin él
            }
          }
        }

        return db.createCircuit({ ...input, voltageDrop, designCurrent });
      }),
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
        installMethod: z.string().optional(),
        voltageDrop: z.string().optional(),
        designCurrent: z.string().optional(),
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

  // Template procedures (FASE 5.1)
  templates: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getTemplatesByUserId(ctx.user.id)
    ),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) =>
        db.getTemplateById(input.id, ctx.user.id)
      ),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        formData: z.record(z.string(), z.unknown()),
      }))
      .mutation(({ ctx, input }) =>
        db.createTemplate({ userId: ctx.user.id, ...input })
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        formData: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateTemplate(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        db.deleteTemplate(input.id, ctx.user.id)
      ),
  }),

  // Inspections procedures (FASE 6.3)
  inspections: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getInspectionsByUserId(ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        certificateId: z.number(),
        scheduledDate: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createInspection({
          userId: ctx.user.id,
          certificateId: input.certificateId,
          scheduledDate: new Date(input.scheduledDate),
          result: 'pending',
          notes: input.notes,
        })
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        result: z.enum(['pending', 'passed', 'failed', 'deferred']).optional(),
        completedDate: z.string().optional(),
        notes: z.string().optional(),
        scheduledDate: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, completedDate, scheduledDate, ...rest } = input;
        return db.updateInspection(id, ctx.user.id, {
          ...rest,
          ...(completedDate ? { completedDate: new Date(completedDate) } : {}),
          ...(scheduledDate ? { scheduledDate: new Date(scheduledDate) } : {}),
        });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteInspection(input.id, ctx.user.id)),
  }),

  // Firma electrónica — Bloque B
  signatures: router({

    // Recibe el PDF firmado por AutoFirma, verifica el certificado,
    // solicita sello de tiempo a la TSA y registra el audit trail.
    submitSigned: protectedProcedure
      .input(z.object({
        certificateId: z.number(),
        signedPdfBase64: z.string(),      // PDF firmado en PAdES-B (Base64)
        certificateBase64: z.string(),    // Certificado X.509 del firmante (Base64)
        originalPdfBase64: z.string(),    // PDF original para calcular hash previo
        clientIp: z.string().optional(),
        userAgent: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { verifyCertificate, sha256Hex } = await import('./services/signature-verification');
        const { requestTimestampToken } = await import('./services/tsa-client');

        // 1. Verificar certificado (vigencia, extraer identidad)
        const verification = verifyCertificate(input.certificateBase64);

        // 2. Calcular hashes
        const originalBuffer = Buffer.from(input.originalPdfBase64, 'base64');
        const signedBuffer = Buffer.from(input.signedPdfBase64, 'base64');
        const documentHash = sha256Hex(originalBuffer);
        const signedDocumentHash = sha256Hex(signedBuffer);

        // 3. Solicitar sello de tiempo a la TSA (DigiCert por defecto)
        let timestampResult = null;
        try {
          timestampResult = await requestTimestampToken(signedBuffer);
        } catch (err) {
          console.warn('[TSA] Sello de tiempo no disponible, continuando sin él:', err);
        }

        // 4. Subir PDF firmado a R2 (si está configurado) y guardar URL en BD
        await db.updateCertificateStatus(input.certificateId, ctx.user.id, 'signed');

        const { uploadToR2, certificateR2Key } = await import('./services/r2-storage');
        const certRow = await db.getCertificateById(input.certificateId, ctx.user.id);
        const certNum = certRow?.certificateNumber ?? String(input.certificateId);
        const r2Key = certificateR2Key(certNum, 'signed');
        const r2Url = await uploadToR2(
          r2Key,
          Buffer.from(input.signedPdfBase64, 'base64'),
          'application/pdf'
        );
        // Fallback: guardar Base64 inline si R2 no está configurado
        const pdfUrl = r2Url ?? `data:application/pdf;base64,${input.signedPdfBase64}`;
        await db.updateCertificatePdfUrl(input.certificateId, ctx.user.id, pdfUrl);

        // 5. Registrar audit trail (INMUTABLE)
        await db.createSignatureAuditTrail({
          certificateId: input.certificateId,
          userId: ctx.user.id,
          signerName: verification.signerName,
          signerNif: verification.signerNif ?? undefined,
          signerCertSerial: verification.signerCertSerial,
          signerCertIssuer: verification.signerCertIssuer,
          signerCertNotAfter: verification.signerCertNotAfter,
          documentHash,
          signedDocumentHash,
          timestampToken: timestampResult?.token ?? null,
          timestampTime: timestampResult?.time ?? null,
          tsaUrl: timestampResult?.tsaUrl ?? null,
          clientIp: input.clientIp ?? 'unknown',
          userAgent: input.userAgent ?? null,
          rawCertificateB64: input.certificateBase64,
        });

        return {
          success: true,
          signerName: verification.signerName,
          signerNif: verification.signerNif,
          timestampTime: timestampResult?.time ?? null,
          tsaUsed: timestampResult?.tsaUrl ?? null,
          documentHash,
        };
      }),

    // Devuelve el historial de firma de un certificado
    getAuditTrail: protectedProcedure
      .input(z.object({ certificateId: z.number() }))
      .query(({ ctx, input }) =>
        db.getSignatureAuditTrailByCertificateId(input.certificateId, ctx.user.id)
      ),
  }),

  // Catastro: búsqueda automática de referencia catastral
  cadastre: router({
    search: protectedProcedure
      .input(z.object({
        address: z.string().min(5),
        city: z.string().min(2),
        province: z.string().min(2),
      }))
      .query(async ({ input }) => {
        const parsed = parseSpanishAddress(input.address);
        if (!parsed) return { reference: null, found: false, error: 'No se pudo interpretar la dirección' };

        const params = new URLSearchParams({
          Provincia: input.province.toUpperCase(),
          Municipio: input.city.toUpperCase(),
          SiglaVia: parsed.sigla,
          NombreVia: parsed.nombre,
          Numero: parsed.numero,
          Bloque: '', Escalera: '', Planta: '', Puerta: '',
        });

        try {
          const res = await fetch(
            `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?${params}`,
            { signal: AbortSignal.timeout(8000) }
          );
          const xml = await res.text();

          if (xml.includes('<lerr>') || xml.includes('<err>')) {
            return { reference: null, found: false, error: 'Dirección no encontrada en el Catastro' };
          }

          const pc1 = xml.match(/<pc1>([^<]+)<\/pc1>/)?.[1];
          const pc2 = xml.match(/<pc2>([^<]+)<\/pc2>/)?.[1];

          if (pc1 && pc2) {
            return { reference: (pc1 + pc2).trim(), found: true, error: null };
          }

          return { reference: null, found: false, error: 'Referencia no encontrada para esa dirección' };
        } catch {
          return { reference: null, found: false, error: 'Error al conectar con el Catastro' };
        }
      }),
  }),

  // Portal procedures (FASE 6.4)
  portal: router({
    generateToken: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        expiresInDays: z.number().optional().default(30),
      }))
      .mutation(async ({ ctx, input }) => {
        const crypto = await import('crypto');
        const token = crypto.randomBytes(48).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);
        await db.createClientToken({
          clientId: input.clientId,
          userId: ctx.user.id,
          token,
          expiresAt,
        });
        return { token };
      }),
    getClientData: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const tokenRecord = await db.getClientTokenByToken(input.token);
        if (!tokenRecord) throw new Error('Token inválido o expirado');
        const client = await db.getClientById(tokenRecord.clientId, tokenRecord.userId);
        if (!client) throw new Error('Cliente no encontrado');
        const certs = await db.getCertificatesByUserId(tokenRecord.userId);
        const clientCerts = certs.filter(c => c.clientId === tokenRecord.clientId);
        return { client, certificates: clientCerts };
      }),
  }),
});

export type AppRouter = typeof appRouter;

// Re-export types for client usage
export type { CableCalculationResult } from './services/electrical-calculations';
export type { DiagramGenerationInput } from './services/diagram-generation';
export type { CertificatePDFInput } from './services/pdf-generation';
