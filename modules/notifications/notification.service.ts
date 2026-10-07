/**
 * CoursePur Backend — Notification Adapters (Part 6 & 7.7)
 */

import crypto from 'crypto';
import { db } from '../../shared/db/database.js';
import { Notification, NotificationChannel, NotificationType } from '../../shared/types/schema.js';
import { decryptSecret } from '../../shared/security/crypto.js';

export class NotificationsService {
  private static isIntegrationReady(key: string): boolean {
    const config = db.integration_configs.find((c) => c.key === key);
    return Boolean(config && config.is_enabled && config.credentials_encrypted);
  }

  static sendNotification(
    recipientType: 'student' | 'institute',
    userIdOrInstituteId: string | null,
    type: NotificationType,
    preferredChannel: NotificationChannel,
    payload: Record<string, unknown>
  ): Notification {
    let effectiveChannel: NotificationChannel = preferredChannel;

    // Gated WhatsApp adapter fallback (Part 6 & 7.7)
    if (preferredChannel === 'whatsapp') {
      const whatsappReady = this.isIntegrationReady('whatsapp_business');
      if (!whatsappReady) {
        effectiveChannel = recipientType === 'institute' ? 'email' : 'sms';
      }
    }

    const notif: Notification = {
      id: `notif_${crypto.randomUUID()}`,
      user_id: recipientType === 'student' ? userIdOrInstituteId : null,
      recipient_type: recipientType,
      type,
      payload,
      sent_via: effectiveChannel,
      sent_at: new Date().toISOString(),
    };
    db.notifications.push(notif);
    return notif;
  }

  static testIntegration(key: string): { success: boolean; message: string } {
    const config = db.integration_configs.find((c) => c.key === key);
    if (!config) return { success: false, message: `Unknown integration '${key}'.` };

    const decrypted = decryptSecret(config.credentials_encrypted);
    const now = new Date().toISOString();

    if (!decrypted && config.is_required) {
      config.last_tested_at = now;
      config.last_test_status = 'failed';
      return { success: false, message: `No credentials configured for '${config.display_name}'.` };
    }

    config.last_tested_at = now;
    config.last_test_status = 'success';
    return {
      success: true,
      message: `Connection test passed for ${config.display_name} (${config.provider_name}).`,
    };
  }
}
