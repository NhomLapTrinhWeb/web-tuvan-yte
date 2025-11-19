/**
 * SEED TIME SLOTS
 * Generate available time slots for doctors
 */

const { Doctor, TimeSlot, sequelize } = require('../models');

async function seedTimeSlots() {
  try {
    console.log('🕐 Seeding time slots...');

    // Get all approved doctors
    const doctors = await Doctor.findAll({
      where: { is_approved: true, is_active: true }
    });

    if (doctors.length === 0) {
      console.log('⚠️  No approved doctors found. Skipping time slot seeding.');
      return;
    }

    // Generate slots for next 14 days
    const today = new Date();
    const slots = [];

    for (let doctor of doctors) {
      // Generate slots for next 14 days
      for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const date = new Date(today);
        date.setDate(date.getDate() + dayOffset);
        
        // Skip Sundays (0)
        if (date.getDay() === 0) continue;

        const dateStr = date.toISOString().split('T')[0];

        // Morning slots: 8:00 - 11:30 (30min each)
        const morningSlots = [
          { start: '08:00', end: '08:30' },
          { start: '08:30', end: '09:00' },
          { start: '09:00', end: '09:30' },
          { start: '09:30', end: '10:00' },
          { start: '10:00', end: '10:30' },
          { start: '10:30', end: '11:00' },
          { start: '11:00', end: '11:30' }
        ];

        // Afternoon slots: 13:30 - 17:00 (30min each)
        const afternoonSlots = [
          { start: '13:30', end: '14:00' },
          { start: '14:00', end: '14:30' },
          { start: '14:30', end: '15:00' },
          { start: '15:00', end: '15:30' },
          { start: '15:30', end: '16:00' },
          { start: '16:00', end: '16:30' },
          { start: '16:30', end: '17:00' }
        ];

        const allSlots = [...morningSlots, ...afternoonSlots];

        for (let slot of allSlots) {
          slots.push({
            doctor_id: doctor.id,
            date: dateStr,
            start_time: slot.start,
            end_time: slot.end,
            max_bookings: 1,
            current_bookings: 0,
            is_available: true,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    }

    // Bulk insert
    await TimeSlot.bulkCreate(slots, {
      ignoreDuplicates: true // Skip if already exists
    });

    console.log(`✅ Created ${slots.length} time slots for ${doctors.length} doctors`);

  } catch (error) {
    console.error('❌ Error seeding time slots:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedTimeSlots()
    .then(() => {
      console.log('✅ Time slots seeded successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Failed to seed time slots:', error);
      process.exit(1);
    });
}

module.exports = seedTimeSlots;
