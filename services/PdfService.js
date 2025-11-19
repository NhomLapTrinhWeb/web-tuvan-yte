const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PdfService {
  /**
   * Generate medical record PDF
   */
  async generateMedicalRecordPdf(medicalRecord, appointment) {
    try {
      const fileName = `medical_record_${appointment.id}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../public/uploads/medical-records', fileName);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Add content
      doc.fontSize(20).text('HỒ SƠ BỆNH ÁN ĐIỆN TỬ', { align: 'center' });
      doc.moveDown();

      // Patient information
      doc.fontSize(14).text('THÔNG TIN BỆNH NHÂN', { underline: true });
      doc.fontSize(11)
        .text(`Họ tên: ${appointment.patient.full_name}`)
        .text(`Ngày sinh: ${appointment.patient.date_of_birth}`)
        .text(`Giới tính: ${appointment.patient.gender}`)
        .text(`Điện thoại: ${appointment.patient.phone}`)
        .text(`Địa chỉ: ${appointment.patient.address || 'N/A'}`);
      doc.moveDown();

      // Doctor information
      doc.fontSize(14).text('THÔNG TIN BÁC SĨ', { underline: true });
      doc.fontSize(11)
        .text(`Bác sĩ: ${appointment.doctor.full_name}`)
        .text(`Chuyên khoa: ${appointment.doctor.specialty?.name || 'N/A'}`)
        .text(`Số giấy phép hành nghề: ${appointment.doctor.license_number}`);
      doc.moveDown();

      // Appointment information
      doc.fontSize(14).text('THÔNG TIN KHÁM BỆNH', { underline: true });
      doc.fontSize(11)
        .text(`Ngày khám: ${appointment.appointment_date}`)
        .text(`Giờ khám: ${appointment.time_slot}`)
        .text(`Hình thức: ${appointment.appointment_type === 'online' ? 'Trực tuyến' : 'Tại phòng khám'}`);
      doc.moveDown();

      // Vital signs
      if (medicalRecord.vital_signs) {
        const vitalSigns = JSON.parse(medicalRecord.vital_signs);
        doc.fontSize(14).text('SINH HIỆU', { underline: true });
        doc.fontSize(11);
        if (vitalSigns.blood_pressure) doc.text(`Huyết áp: ${vitalSigns.blood_pressure} mmHg`);
        if (vitalSigns.heart_rate) doc.text(`Nhịp tim: ${vitalSigns.heart_rate} bpm`);
        if (vitalSigns.temperature) doc.text(`Nhiệt độ: ${vitalSigns.temperature}°C`);
        if (vitalSigns.weight) doc.text(`Cân nặng: ${vitalSigns.weight} kg`);
        if (vitalSigns.height) doc.text(`Chiều cao: ${vitalSigns.height} cm`);
        doc.moveDown();
      }

      // Diagnosis
      doc.fontSize(14).text('CHẨN ĐOÁN', { underline: true });
      doc.fontSize(11).text(medicalRecord.diagnosis || 'N/A');
      doc.moveDown();

      // Prescription
      if (medicalRecord.prescription) {
        const prescription = JSON.parse(medicalRecord.prescription);
        doc.fontSize(14).text('ĐỜN THUỐC', { underline: true });
        doc.fontSize(11);
        prescription.forEach((drug, index) => {
          doc.text(`${index + 1}. ${drug.drug_name}`);
          doc.text(`   Liều lượng: ${drug.dosage}`);
          doc.text(`   Tần suất: ${drug.frequency}`);
          doc.text(`   Thời gian: ${drug.duration}`);
          if (drug.notes) doc.text(`   Ghi chú: ${drug.notes}`);
          doc.moveDown(0.5);
        });
      }

      // Lab results
      if (medicalRecord.lab_results) {
        doc.addPage();
        doc.fontSize(14).text('KẾT QUẢ XÉT NGHIỆM', { underline: true });
        doc.fontSize(11).text(medicalRecord.lab_results);
        doc.moveDown();
      }

      // Notes
      if (medicalRecord.notes) {
        doc.fontSize(14).text('GHI CHÚ', { underline: true });
        doc.fontSize(11).text(medicalRecord.notes);
        doc.moveDown();
      }

      // Next appointment advice
      if (medicalRecord.next_appointment_advice) {
        doc.fontSize(14).text('TƯ VẤN TÁI KHÁM', { underline: true });
        doc.fontSize(11).text(medicalRecord.next_appointment_advice);
        doc.moveDown();
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(10)
        .text(`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`, { align: 'right' })
        .text('Chữ ký bác sĩ', { align: 'right' });

      // Finalize PDF
      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve(`/uploads/medical-records/${fileName}`);
        });
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('Generate medical record PDF error:', error);
      throw error;
    }
  }

  /**
   * Generate appointment receipt PDF
   */
  async generateReceiptPdf(transaction, appointment) {
    try {
      const fileName = `receipt_${transaction.transaction_code}.pdf`;
      const filePath = path.join(__dirname, '../public/uploads/receipts', fileName);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('HÓA ĐƠN THANH TOÁN', { align: 'center' });
      doc.moveDown();

      // Transaction info
      doc.fontSize(11)
        .text(`Mã giao dịch: ${transaction.transaction_code}`)
        .text(`Ngày thanh toán: ${new Date(transaction.paid_at).toLocaleDateString('vi-VN')}`)
        .text(`Phương thức: ${transaction.payment_method.toUpperCase()}`);
      doc.moveDown();

      // Appointment info
      doc.fontSize(14).text('THÔNG TIN LỊCH HẸN', { underline: true });
      doc.fontSize(11)
        .text(`Bệnh nhân: ${appointment.patient.full_name}`)
        .text(`Bác sĩ: ${appointment.doctor.full_name}`)
        .text(`Ngày khám: ${appointment.appointment_date}`)
        .text(`Giờ khám: ${appointment.time_slot}`)
        .text(`Loại khám: ${appointment.appointment_type === 'online' ? 'Trực tuyến' : 'Tại phòng khám'}`);
      doc.moveDown();

      // Payment details
      doc.fontSize(14).text('CHI TIẾT THANH TOÁN', { underline: true });
      doc.fontSize(11)
        .text(`Phí tư vấn: ${transaction.amount.toLocaleString('vi-VN')} VNĐ`)
        .text(`Trạng thái: Đã thanh toán`, { color: 'green' });
      doc.moveDown();

      // Total
      doc.fontSize(14)
        .text(`TỔNG CỘNG: ${transaction.amount.toLocaleString('vi-VN')} VNĐ`, { bold: true });

      // Footer
      doc.moveDown(3);
      doc.fontSize(10)
        .text('Cảm ơn bạn đã sử dụng dịch vụ!', { align: 'center' })
        .text('Mọi thắc mắc vui lòng liên hệ: support@healthcare.com', { align: 'center' });

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve(`/uploads/receipts/${fileName}`);
        });
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('Generate receipt PDF error:', error);
      throw error;
    }
  }

  /**
   * Generate appointment summary PDF
   */
  async generateAppointmentSummaryPdf(appointments, doctor, startDate, endDate) {
    try {
      const fileName = `summary_${doctor.id}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../public/uploads/summaries', fileName);

      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(18).text('BÁO CÁO TỔNG HỢP LỊCH HẸN', { align: 'center' });
      doc.moveDown();

      // Doctor info
      doc.fontSize(12)
        .text(`Bác sĩ: ${doctor.full_name}`)
        .text(`Chuyên khoa: ${doctor.specialty?.name || 'N/A'}`)
        .text(`Thời gian: ${startDate} - ${endDate}`)
        .text(`Tổng số lịch hẹn: ${appointments.length}`);
      doc.moveDown();

      // Appointments table
      doc.fontSize(11);
      appointments.forEach((apt, index) => {
        doc.text(`${index + 1}. ${apt.patient.full_name} - ${apt.appointment_date} ${apt.time_slot}`);
        doc.text(`   Trạng thái: ${apt.status}`);
        doc.moveDown(0.5);
      });

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve(`/uploads/summaries/${fileName}`);
        });
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('Generate appointment summary PDF error:', error);
      throw error;
    }
  }
}

module.exports = new PdfService();
