const dateUtils = {
  /**
   * Format date to YYYY-MM-DD
   */
  formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Format datetime to DD/MM/YYYY HH:MM
   */
  formatDateTime(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  },

  /**
   * Get day of week (0 = Sunday, 6 = Saturday)
   */
  getDayOfWeek(date) {
    return new Date(date).getDay();
  },

  /**
   * Check if date is today
   */
  isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);
    return (
      today.getFullYear() === checkDate.getFullYear() &&
      today.getMonth() === checkDate.getMonth() &&
      today.getDate() === checkDate.getDate()
    );
  },

  /**
   * Check if date is in the past
   */
  isPast(date) {
    return new Date(date) < new Date();
  },

  /**
   * Check if date is in the future
   */
  isFuture(date) {
    return new Date(date) > new Date();
  },

  /**
   * Add days to date
   */
  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  /**
   * Add hours to date
   */
  addHours(date, hours) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  },

  /**
   * Get difference in hours between two dates
   */
  getHoursDifference(date1, date2) {
    const diff = new Date(date2) - new Date(date1);
    return Math.floor(diff / (1000 * 60 * 60));
  },

  /**
   * Get difference in days between two dates
   */
  getDaysDifference(date1, date2) {
    const diff = new Date(date2) - new Date(date1);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  },

  /**
   * Check if date is within 24 hours from now
   */
  isWithin24Hours(date) {
    const hoursDiff = this.getHoursDifference(new Date(), date);
    return hoursDiff >= 0 && hoursDiff <= 24;
  },

  /**
   * Generate time slots
   */
  generateTimeSlots(startTime, endTime, duration = 30) {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMin < endMin)
    ) {
      const slotStart = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      
      // Calculate end time
      currentMin += duration;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }

      const slotEnd = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      
      slots.push(`${slotStart}-${slotEnd}`);
    }

    return slots;
  },

  /**
   * Convert time string to minutes
   */
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  },

  /**
   * Convert minutes to time string
   */
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  },

  /**
   * Get Vietnamese day name
   */
  getVietnameseDayName(dayOfWeek) {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[dayOfWeek];
  },

  /**
   * Format date to Vietnamese format
   */
  formatVietnameseDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `Ngày ${day} tháng ${month} năm ${year}`;
  }
};

module.exports = dateUtils;
