import 'server-only';
import mongoose, { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

const { ObjectId, Mixed } = Schema.Types;

function getModel<T>(name: string, schema: Schema<T>): Model<T> {
  return (models[name] as Model<T>) || model<T>(name, schema);
}

// ---------------------------------------------------------------- Admins & security

const adminSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['owner', 'staff'], required: true, default: 'staff' },
    mustChangePassword: { type: Boolean, default: false },
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    // Two-factor (TOTP). Secret is AES-GCM encrypted with ADMIN_ENCRYPTION_KEY.
    totpEnabled: { type: Boolean, default: false },
    totpSecret: { type: String, default: null },
    totpPendingSecret: { type: String, default: null },
    totpLastStep: { type: Number, default: 0 }, // prevents re-use of the same code
    backupCodeHashes: { type: [String], default: [] },
    disabled: { type: Boolean, default: false },
  },
  { timestamps: true },
);
export type AdminDoc = InferSchemaType<typeof adminSchema> & { _id: mongoose.Types.ObjectId };
export const Admin = getModel('Admin', adminSchema);

const adminSessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    adminId: { type: ObjectId, ref: 'Admin', required: true, index: true },
    stage: { type: String, enum: ['mfa', 'full'], required: true },
    csrfToken: { type: String, required: true },
    expiresAt: { type: Date, required: true }, // sliding
    absoluteExpiresAt: { type: Date, required: true },
    lastSeenAt: { type: Date, default: Date.now },
    ip: String,
    userAgent: String,
  },
  { timestamps: true },
);
adminSessionSchema.index({ absoluteExpiresAt: 1 }, { expireAfterSeconds: 0 });
export const AdminSession = getModel('AdminSession', adminSessionSchema);

const auditLogSchema = new Schema(
  {
    adminId: { type: ObjectId, ref: 'Admin', default: null },
    actor: { type: String, default: 'system' }, // username, 'system' or 'cron'
    action: { type: String, required: true, index: true },
    target: { type: String, default: '' },
    before: { type: Mixed, default: null },
    after: { type: Mixed, default: null },
    ip: String,
    userAgent: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
auditLogSchema.index({ createdAt: -1 });
export const AuditLog = getModel('AuditLog', auditLogSchema);

const rateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const RateLimit = getModel('RateLimit', rateLimitSchema);

// ---------------------------------------------------------------- Batches

const batchSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    startDate: { type: String, required: true }, // 'YYYY-MM-DD' (IST)
    endDate: { type: String, required: true },
    classTime: { type: String, required: true }, // 'HH:mm' (IST)
    durationMinutes: { type: Number, required: true },
    daysOfWeek: { type: [Number], required: true }, // 0 = Sunday
    priceInr: { type: Number, required: true },
    maxSeats: { type: Number, required: true },
    seatsTaken: { type: Number, default: 0 }, // atomic counter, used from step 4
    status: { type: String, enum: ['draft', 'open', 'closed'], default: 'draft', index: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    zoom: {
      meetingId: { type: String, default: null },
      hostEmail: { type: String, default: null },
      createdAutomatically: { type: Boolean, default: false },
      settingsSnapshot: { type: Mixed, default: null },
      deletedAt: { type: Date, default: null },
    },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
batchSchema.index({ 'zoom.meetingId': 1 }, { unique: true, partialFilterExpression: { 'zoom.meetingId': { $type: 'string' } } });
export type BatchDoc = InferSchemaType<typeof batchSchema> & { _id: mongoose.Types.ObjectId };
export const Batch = getModel('Batch', batchSchema);

// ---------------------------------------------------------------- Students & leads

// cancelled = checkout abandoned and the seat hold expired (no payment received)
export const REGISTRATION_STATUSES = ['pending', 'paid', 'scheduled', 'active', 'expired', 'removed', 'zoom_failed', 'refunded', 'cancelled'] as const;
/** Statuses that mean the student has paid for the batch. */
export const PAID_STATUSES = ['paid', 'scheduled', 'active', 'zoom_failed'] as const;

const registrationSchema = new Schema(
  {
    batchId: { type: ObjectId, ref: 'Batch', required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, index: true },
    status: { type: String, enum: REGISTRATION_STATUSES, default: 'pending', index: true },
    amountPaise: { type: Number, required: true },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    paymentError: { type: String, default: null }, // last failure reason reported by Razorpay
    holdExpiresAt: { type: Date, default: null }, // seat hold while checkout is open
    paidAt: { type: Date, default: null },
    accessStart: { type: Date, default: null },
    accessEnd: { type: Date, default: null },
    zoomRegistrantId: { type: String, default: null },
    zoomJoinUrl: { type: String, default: null },
    registeredOnZoomAt: { type: Date, default: null },
    removedFromZoomAt: { type: Date, default: null },
    zoomLastError: { type: String, default: null },
    linkEmailSentAt: { type: Date, default: null },
    reminderSentAt: { type: Date, default: null },
    lastEmailSentAt: { type: Date, default: null },
    renewalOf: { type: ObjectId, ref: 'Registration', default: null },
  },
  { timestamps: true },
);
registrationSchema.index({ razorpayOrderId: 1 }, { unique: true, partialFilterExpression: { razorpayOrderId: { $type: 'string' } } });
registrationSchema.index({ status: 1, holdExpiresAt: 1 });
export type RegistrationDoc = InferSchemaType<typeof registrationSchema> & { _id: mongoose.Types.ObjectId; createdAt: Date };
export const Registration = getModel('Registration', registrationSchema);

const enquirySchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: null },
    goal: { type: String, enum: ['ielts', 'pte'], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
export const Enquiry = getModel('Enquiry', enquirySchema);

const waitlistSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: null },
    batchId: { type: ObjectId, ref: 'Batch', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
export const Waitlist = getModel('Waitlist', waitlistSchema);

// ---------------------------------------------------------------- Background jobs

const webhookEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true },
    type: String,
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);
export const WebhookEvent = getModel('WebhookEvent', webhookEventSchema);

const cronRunSchema = new Schema(
  {
    job: { type: String, required: true },
    trigger: { type: String, enum: ['schedule', 'admin'], default: 'schedule' },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, default: null },
    counts: { type: Mixed, default: {} },
    failures: { type: [String], default: [] },
  },
);
cronRunSchema.index({ startedAt: -1 });
export const CronRun = getModel('CronRun', cronRunSchema);
