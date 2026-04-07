const nodemailer = require('nodemailer');
const { publishLiveAlert } = require('./liveAlertsHub');

class NotificationService {
    constructor() {
        this.subscribers = {}; // {walletAddress: {email, phone, preferences}}
        this.notifications = {}; // notification history
        this.notificationCounter = 0;
        this.deliveryQueue = [];
        this.processingQueue = false;
        this.maxAttempts = Number(process.env.NOTIFICATION_RETRY_ATTEMPTS || 3);

        // Configure email transporter (mock for development)
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'localhost',
            port: process.env.SMTP_PORT || 1025,
            secure: false
        });
    }

    publishNotification(recipient, type, title, message, details = {}, priority = 'NORMAL') {
        const notifId = this.notificationCounter++;
        const notification = {
            id: notifId,
            type,
            recipient,
            title,
            message,
            details,
            sentAt: Date.now(),
            read: false,
            priority,
        };

        this.notifications[notifId] = notification;
        publishLiveAlert({
            type: 'notification',
            priority,
            notification,
        });
        return notification;
    }

    /**
     * Subscribe user to notifications
     */
    subscribe(walletAddress, preferences) {
        this.subscribers[walletAddress] = {
            walletAddress,
            email: preferences.email,
            phone: preferences.phone,
            subscriptionDate: Date.now(),
            bloodDonationAlerts: preferences.bloodDonationAlerts !== false,
            organDonationAlerts: preferences.organDonationAlerts !== false,
            emergencyAlerts: preferences.emergencyAlerts !== false,
            certificateAlerts: preferences.certificateAlerts !== false
        };

        return {
            message: 'Subscribed successfully',
            subscriber: this.subscribers[walletAddress]
        };
    }

    /**
     * Notify matching blood donors
     */
    async notifyBloodDonors(bloodGroup, location, requestDetails) {
        const matchingDonors = Object.values(this.subscribers).filter(sub =>
            sub.bloodDonationAlerts === true
        );

        const notifications = [];

        for (const donor of matchingDonors) {
            const notifId = this.notificationCounter++;

            const notification = {
                id: notifId,
                type: 'BLOOD_DONATION_REQUEST',
                recipient: donor.walletAddress,
                title: `🩸 Blood Needed: ${bloodGroup}`,
                message: `Blood group ${bloodGroup} is urgently needed in ${location}`,
                details: requestDetails,
                sentAt: Date.now(),
                read: false,
                priority: requestDetails.urgencyLevel >= 4 ? 'HIGH' : 'NORMAL'
            };

            this.notifications[notifId] = notification;
            notifications.push(notification);

            this.publishNotification(
                donor.email || donor.walletAddress,
                'BLOOD_DONATION_REQUEST',
                notification.title,
                notification.message,
                requestDetails,
                notification.priority
            );

            // Send email
            if (donor.email) {
                await this.sendEmail(
                    donor.email,
                    notification.title,
                    notification.message,
                    requestDetails
                );
            }

            // Send SMS (placeholder)
            if (donor.phone) {
                await this.sendSMS(
                    donor.phone,
                    `${notification.title} - ${notification.message}`
                );
            }
        }

        return notifications;
    }

    /**
     * Notify matching organ donors
     */
    async notifyOrganDonors(organ, bloodGroup, location, urgency) {
        const matchingDonors = Object.values(this.subscribers).filter(sub =>
            sub.organDonationAlerts === true
        );

        const notifications = [];

        for (const donor of matchingDonors) {
            const notifId = this.notificationCounter++;

            const notification = {
                id: notifId,
                type: 'ORGAN_DONATION_REQUEST',
                recipient: donor.walletAddress,
                title: `🫀 URGENT: ${organ} Needed`,
                message: `${organ} (${bloodGroup}) urgently needed in ${location}. Urgency Level: ${urgency}/10`,
                sentAt: Date.now(),
                read: false,
                priority: urgency >= 8 ? 'CRITICAL' : 'HIGH'
            };

            this.notifications[notifId] = notification;
            notifications.push(notification);

            this.publishNotification(
                donor.email || donor.walletAddress,
                'ORGAN_DONATION_REQUEST',
                notification.title,
                notification.message,
                { organ, bloodGroup, location, urgency },
                notification.priority
            );

            // Send email
            if (donor.email) {
                await this.sendEmail(
                    donor.email,
                    notification.title,
                    notification.message,
                    { organ, bloodGroup, location, urgency }
                );
            }

            // Send SMS
            if (donor.phone && urgency >= 8) {
                await this.sendSMS(
                    donor.phone,
                    `CRITICAL: ${notification.title}`
                );
            }
        }

        return notifications;
    }

    /**
     * Notify certificate issue/revocation
     */
    async notifyCertificateEvent(address, eventType, certificateData) {
        const notifId = this.notificationCounter++;

        let title, message;

        if (eventType === 'ISSUED') {
            title = `✅ Certificate Issued`;
            message = `Your ${certificateData.certificateType} certificate has been issued`;
        } else if (eventType === 'REVOKED') {
            title = `⚠️ Certificate Revoked`;
            message = `Your ${certificateData.certificateType} certificate has been revoked`;
        } else if (eventType === 'EXPIRING') {
            title = `⏰ Certificate Expiring Soon`;
            message = `Your ${certificateData.certificateType} certificate will expire on ${new Date(certificateData.expiryDate).toDateString()}`;
        }

        const notification = {
            id: notifId,
            type: 'CERTIFICATE_EVENT',
            recipient: address,
            title,
            message,
            certificateData,
            sentAt: Date.now(),
            read: false,
            priority: eventType === 'REVOKED' ? 'HIGH' : 'NORMAL'
        };

        this.notifications[notifId] = notification;

        this.publishNotification(
            address,
            'CERTIFICATE_EVENT',
            title,
            message,
            certificateData,
            notification.priority
        );

        // Send email
        const subscriber = this.subscribers[address];
        if (subscriber && subscriber.email && subscriber.certificateAlerts) {
            await this.sendEmail(
                subscriber.email,
                title,
                message,
                certificateData
            );
        }

        return notification;
    }

    /**
     * Send emergency alert
     */
    async sendEmergencyAlert(address, emergencyData) {
        const notifId = this.notificationCounter++;

        const notification = {
            id: notifId,
            type: 'EMERGENCY_ALERT',
            recipient: address,
            title: `🚨 Emergency Alert`,
            message: emergencyData.message,
            emergencyData,
            sentAt: Date.now(),
            read: false,
            priority: 'CRITICAL'
        };

        this.notifications[notifId] = notification;

        this.publishNotification(
            address,
            'EMERGENCY_ALERT',
            notification.title,
            notification.message,
            emergencyData,
            'CRITICAL'
        );

        const subscriber = this.subscribers[address];
        if (subscriber && subscriber.emergencyAlerts) {
            // Send all channels for emergency
            if (subscriber.email) {
                this.enqueueDelivery('email', {
                    to: subscriber.email,
                    subject: notification.title,
                    text: notification.message,
                    data: emergencyData,
                });
            }

            if (subscriber.phone) {
                this.enqueueDelivery('sms', {
                    phone: subscriber.phone,
                    message: `EMERGENCY: ${notification.message}`,
                });
            }
        }

        return notification;
    }

    /**
     * Get user's notifications
     */
    getUserNotifications(address, unreadOnly = false) {
        const userNotifs = Object.values(this.notifications).filter(
            notif => notif.recipient === address
        );

        if (unreadOnly) {
            return userNotifs.filter(notif => !notif.read);
        }

        return userNotifs;
    }

    /**
     * Mark notification as read
     */
    markAsRead(notificationId) {
        if (this.notifications[notificationId]) {
            this.notifications[notificationId].read = true;
            return true;
        }
        return false;
    }

    enqueueDelivery(channel, payload, attempt = 1) {
        this.deliveryQueue.push({ channel, payload, attempt, queuedAt: Date.now() });
        void this.processQueue();
    }

    async processQueue() {
        if (this.processingQueue) return;
        this.processingQueue = true;

        while (this.deliveryQueue.length > 0) {
            const job = this.deliveryQueue.shift();

            try {
                if (job.channel === 'email') {
                    await this.sendEmail(job.payload.to, job.payload.subject, job.payload.text, job.payload.data);
                } else if (job.channel === 'sms') {
                    await this.sendSMS(job.payload.phone, job.payload.message);
                }
            } catch (error) {
                if (job.attempt < this.maxAttempts) {
                    const nextAttempt = job.attempt + 1;
                    const delayMs = 400 * (2 ** (nextAttempt - 1));
                    setTimeout(() => {
                        this.enqueueDelivery(job.channel, job.payload, nextAttempt);
                    }, delayMs);
                } else {
                    console.error('Notification delivery failed after retries:', {
                        channel: job.channel,
                        target: job.payload.to || job.payload.phone,
                        error: error.message,
                    });
                }
            }
        }

        this.processingQueue = false;
    }

    // Private methods
    async sendEmail(to, subject, text, data) {
        await this.transporter.sendMail({
            from: process.env.EMAIL_FROM || 'noreply@healthblockchain.com',
            to,
            subject,
            html: this.formatEmailHTML(subject, text, data)
        });
    }

    async sendSMS(phone, message) {
        // Integrate with SMS provider (Twilio, AWS SNS, etc.)
        console.log(`[SMS] To: ${phone} - ${message}`);
    }

    formatEmailHTML(subject, text, data) {
        return `
            <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2>${subject}</h2>
                    <p>${text}</p>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                    <p>---</p>
                    <small>Health Blockchain System</small>
                </body>
            </html>
        `;
    }
}

module.exports = new NotificationService();
