import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.js";
import { Prisma } from "@prisma/client";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { NotFoundError } from "../../utils/errors.js";
import { param } from "../../utils/params.js";

function tid(req: Request): string {
  return (req as AuthenticatedRequest).user.tenantId;
}

// ═══════════════════════════════════════════════════════════
// FORM DEFINITIONS
// ═══════════════════════════════════════════════════════════

export async function listForms(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.formDefinition.findMany({
      where: { tenantId: tid(req) },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { fields: true, submissions: true } } },
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}

export async function getForm(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, "id");
    const item = await prisma.formDefinition.findFirst({
      where: { id, tenantId: tid(req) },
      include: { fields: { orderBy: [{ stepNumber: "asc" }, { sortOrder: "asc" }] } },
    });
    if (!item) throw new NotFoundError("Form not found");
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function createForm(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.formDefinition.create({ data: { ...req.body, tenantId: tid(req) } });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function updateForm(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, "id");
    const tenantId = tid(req);
    const existing = await prisma.formDefinition.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Form not found");
    const item = await prisma.formDefinition.update({ where: { id }, data: req.body });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function deleteForm(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, "id");
    const tenantId = tid(req);
    const existing = await prisma.formDefinition.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Form not found");
    await prisma.formDefinition.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
}

export async function duplicateForm(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, "id");
    const tenantId = tid(req);
    const source = await prisma.formDefinition.findFirst({
      where: { id, tenantId },
      include: { fields: true },
    });
    if (!source) throw new NotFoundError("Form not found");

    const newForm = await prisma.formDefinition.create({
      data: {
        tenantId,
        name: `${source.name} (copy)`,
        slug: `${source.slug}-copy-${Date.now()}`,
        description: source.description,
        type: source.type,
        isMultiStep: source.isMultiStep,
        submitButtonText: source.submitButtonText,
        successMessage: source.successMessage,
        redirectUrl: source.redirectUrl,
        requiresPayment: source.requiresPayment,
        paymentAmount: source.paymentAmount,
        notificationEmails: source.notificationEmails,
        status: "inactive",
      },
    });

    if (source.fields.length > 0) {
      await prisma.formField.createMany({
        data: source.fields.map((f) => ({
          formDefinitionId: newForm.id,
          tenantId,
          fieldKey: f.fieldKey,
          fieldType: f.fieldType,
          label: f.label,
          placeholder: f.placeholder,
          helpText: f.helpText,
          stepNumber: f.stepNumber,
          stepTitle: f.stepTitle,
          sortOrder: f.sortOrder,
          isRequired: f.isRequired,
          validationRules: f.validationRules ?? {},
          options: f.options ?? [],
          conditionalOn: f.conditionalOn === null ? Prisma.JsonNull : (f.conditionalOn ?? undefined),
          defaultValue: f.defaultValue,
        })),
      });
    }

    const result = await prisma.formDefinition.findUnique({
      where: { id: newForm.id },
      include: { fields: { orderBy: { sortOrder: "asc" } } },
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════════════════════════
// FORM FIELDS
// ═══════════════════════════════════════════════════════════

export async function createField(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.formField.create({ data: { ...req.body, tenantId: tid(req) } });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function updateField(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, "id");
    const tenantId = tid(req);
    const existing = await prisma.formField.findFirst({ where: { id, formDefinition: { tenantId } } });
    if (!existing) throw new NotFoundError("Field not found");
    const item = await prisma.formField.update({ where: { id }, data: req.body });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function deleteField(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, "id");
    const tenantId = tid(req);
    const existing = await prisma.formField.findFirst({ where: { id, formDefinition: { tenantId } } });
    if (!existing) throw new NotFoundError("Field not found");
    await prisma.formField.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
}

export async function reorderFields(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const { ids } = req.body as { ids: string[] };
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.formField.updateMany({
          where: { id, tenant: { id: tenantId } },
          data: { sortOrder: index },
        }),
      ),
    );
    res.json({ success: true, message: "Reordered" });
  } catch (err) { next(err); }
}
