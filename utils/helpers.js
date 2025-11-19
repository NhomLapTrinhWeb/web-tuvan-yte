const helpers = {
  /**
   * Generate random string
   */
  generateRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Generate OTP code
   */
  generateOtp(length = 6) {
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10);
    }
    return otp;
  },

  /**
   * Mask email for privacy
   */
  maskEmail(email) {
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + '***' + username.slice(-1);
    return `${maskedUsername}@${domain}`;
  },

  /**
   * Mask phone number
   */
  maskPhone(phone) {
    return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
  },

  /**
   * Mask name for anonymous reviews
   */
  maskName(fullName) {
    const parts = fullName.split(' ');
    if (parts.length === 1) {
      return fullName.charAt(0) + '***';
    }
    return parts[0] + ' ' + parts.slice(1).map(p => p.charAt(0) + '***').join(' ');
  },

  /**
   * Generate slug from string
   */
  generateSlug(text) {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[đĐ]/g, 'd') // Replace Vietnamese đ
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/-+/g, '-'); // Replace multiple - with single -
  },

  /**
   * Paginate array
   */
  paginate(array, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    return {
      data: array.slice(offset, offset + limit),
      total: array.length,
      page,
      limit,
      total_pages: Math.ceil(array.length / limit)
    };
  },

  /**
   * Calculate age from date of birth
   */
  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },

  /**
   * Format currency (VND)
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  },

  /**
   * Format number with thousand separators
   */
  formatNumber(number) {
    return new Intl.NumberFormat('vi-VN').format(number);
  },

  /**
   * Sanitize HTML
   */
  sanitizeHtml(html) {
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * Truncate text
   */
  truncate(text, length = 100, suffix = '...') {
    if (text.length <= length) {
      return text;
    }
    return text.substring(0, length).trim() + suffix;
  },

  /**
   * Check if object is empty
   */
  isEmpty(obj) {
    return Object.keys(obj).length === 0;
  },

  /**
   * Deep clone object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Remove null/undefined values from object
   */
  removeEmpty(obj) {
    return Object.entries(obj)
      .filter(([_, value]) => value != null)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  },

  /**
   * Sleep/delay function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Retry function with exponential backoff
   */
  async retry(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.sleep(delay * Math.pow(2, i));
      }
    }
  },

  /**
   * Generate meeting room ID
   */
  generateMeetingRoomId() {
    return `room-${Date.now()}-${this.generateRandomString(8)}`;
  },

  /**
   * Validate Vietnamese phone number
   */
  isValidVietnamesePhone(phone) {
    return /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(phone);
  },

  /**
   * Validate email
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /**
   * Get file extension
   */
  getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  },

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },

  /**
   * Generate transaction code
   */
  generateTransactionCode() {
    const timestamp = Date.now();
    const random = this.generateRandomString(6).toUpperCase();
    return `TXN${timestamp}${random}`;
  },

  /**
   * Extract error message from error object
   */
  getErrorMessage(error) {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.errors && Array.isArray(error.errors)) {
      return error.errors.map(e => e.message).join(', ');
    }
    return 'Unknown error';
  }
};

module.exports = helpers;
