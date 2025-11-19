/**
 * CRON JOB SCHEDULER
 * Schedule background tasks like appointment reminders
 */

const cron = require('node-cron');
const AppointmentService = require('../services/AppointmentService');
const { Appointment } = require('../models');
const { Op } = require('sequelize');

class Scheduler {
  /**
   * Initialize all scheduled tasks
   */
  static init() {
    console.log('Initializing cron jobs...');

    // Send appointment reminders every 15 minutes
    this.scheduleAppointmentReminders();

    // Check for no-show appointments every hour
    this.scheduleNoShowCheck();

    // Cleanup old notifications daily at 3 AM
    this.scheduleNotificationCleanup();

    console.log('Cron jobs initialized successfully');
  }

  /**
   * Send appointment reminders (1 hour before)
   * Runs every 15 minutes
   */
  static scheduleAppointmentReminders() {
    cron.schedule('*/15 * * * *', async () => {
      try {
        console.log('[CRON] Checking for appointment reminders...');
        await AppointmentService.sendAppointmentReminder();
      } catch (error) {
        console.error('[CRON] Appointment reminder error:', error);
      }
    });
  }

  /**
   * Check for no-show appointments
   * Runs every hour
   */
  static scheduleNoShowCheck() {
    cron.schedule('0 * * * *', async () => {
      try {
        console.log('[CRON] Checking for no-show appointments...');
        
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // Find confirmed appointments that are past their time
        const appointments = await Appointment.findAll({
          where: {
            status: 'confirmed',
            appointment_date: {
              [Op.lt]: now.toISOString().split('T')[0]
            }
          }
        });

        // Check if appointment time has passed
        for (const appointment of appointments) {
          const [endTime] = appointment.time_slot.split('-')[1].split(':');
          const appointmentDateTime = new Date(appointment.appointment_date);
          appointmentDateTime.setHours(parseInt(endTime), 0, 0, 0);

          if (appointmentDateTime < oneHourAgo) {
            await appointment.update({ status: 'no_show' });
            console.log(`[CRON] Marked appointment ${appointment.id} as no-show`);
          }
        }
      } catch (error) {
        console.error('[CRON] No-show check error:', error);
      }
    });
  }

  /**
   * Cleanup old notifications (older than 30 days)
   * Runs daily at 3 AM
   */
  static scheduleNotificationCleanup() {
    cron.schedule('0 3 * * *', async () => {
      try {
        console.log('[CRON] Cleaning up old notifications...');
        
        const { Notification } = require('../models');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const deleted = await Notification.destroy({
          where: {
            created_at: {
              [Op.lt]: thirtyDaysAgo
            },
            is_read: true
          }
        });

        console.log(`[CRON] Deleted ${deleted} old notifications`);
      } catch (error) {
        console.error('[CRON] Notification cleanup error:', error);
      }
    });
  }

  /**
   * Stop all scheduled tasks (for testing)
   */
  static stopAll() {
    cron.getTasks().forEach(task => task.stop());
    console.log('All cron jobs stopped');
  }
}

module.exports = Scheduler;
