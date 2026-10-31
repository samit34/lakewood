import 'server-only';
import type { Types } from 'mongoose';
import { AuditLog } from './models';
import type { RequestMeta } from './request';

type Actor = { _id: Types.ObjectId; username: string } | null;

export async function audit(
  actor: Actor | 'system' | 'cron',
  action: string,
  opts: { target?: string; before?: unknown; after?: unknown; meta?: RequestMeta } = {},
) {
  try {
    await AuditLog.create({
      adminId: typeof actor === 'object' && actor ? actor._id : null,
      actor: typeof actor === 'object' && actor ? actor.username : actor || 'system',
      action,
      target: opts.target ?? '',
      before: opts.before ?? null,
      after: opts.after ?? null,
      ip: opts.meta?.ip,
      userAgent: opts.meta?.userAgent,
    });
  } catch (e) {
    // Never let audit logging break the action itself, but make the failure visible in logs.
    console.error('audit log write failed', action, e);
  }
}
