const { MedicalRecord, Appointment, Patient, Doctor, User } = require('../models');
const PdfService = require('../services/PdfService');
const EmailService = require('../services/EmailService');

const medicalRecordController = {
  /**
   * Create medical record (Doctor only)
   */
  async createMedicalRecord(req, res) {
    try {
      const doctorUserId = req.user.id;
      const {
        appointment_id,
        diagnosis,
        prescription,
        vital_signs,
        lab_results,
        notes,
        next_appointment_advice
      } = req.body;

      // Verify appointment exists and belongs to this doctor
      const appointment = await Appointment.findByPk(appointment_id, {
        include: [
          { model: Patient, as: 'patient', include: [{ model: User, as: 'user' }] },
          { model: Doctor, as: 'doctor', include: [{ model: User, as: 'user' }] }
        ]
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      if (appointment.doctor.user_id !== doctorUserId) {
        return res.status(403).json({
          success: false,
          message: 'You can only create medical records for your own appointments'
        });
      }

      if (appointment.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Appointment must be completed before creating medical record'
        });
      }

      // Check if medical record already exists
      const existingRecord = await MedicalRecord.findOne({
        where: { appointment_id }
      });

      if (existingRecord) {
        return res.status(409).json({
          success: false,
          message: 'Medical record already exists for this appointment'
        });
      }

      // Create medical record
      const medicalRecord = await MedicalRecord.create({
        appointment_id,
        diagnosis,
        prescription: prescription ? JSON.stringify(prescription) : null,
        vital_signs: vital_signs ? JSON.stringify(vital_signs) : null,
        lab_results,
        notes,
        next_appointment_advice
      });

      // Send email to patient
      await EmailService.sendMedicalRecord(appointment, medicalRecord);

      return res.status(201).json({
        success: true,
        message: 'Medical record created successfully',
        data: medicalRecord
      });
    } catch (error) {
      console.error('Create medical record error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Update medical record (Doctor only)
   */
  async updateMedicalRecord(req, res) {
    try {
      const doctorUserId = req.user.id;
      const { id } = req.params;
      const {
        diagnosis,
        prescription,
        vital_signs,
        lab_results,
        notes,
        next_appointment_advice
      } = req.body;

      // Get medical record with appointment
      const medicalRecord = await MedicalRecord.findByPk(id, {
        include: [
          {
            model: Appointment,
            as: 'appointment',
            include: ['doctor']
          }
        ]
      });

      if (!medicalRecord) {
        return res.status(404).json({
          success: false,
          message: 'Medical record not found'
        });
      }

      // Verify doctor owns this record
      if (medicalRecord.appointment.doctor.user_id !== doctorUserId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own medical records'
        });
      }

      // Update record
      await medicalRecord.update({
        diagnosis,
        prescription: prescription ? JSON.stringify(prescription) : medicalRecord.prescription,
        vital_signs: vital_signs ? JSON.stringify(vital_signs) : medicalRecord.vital_signs,
        lab_results,
        notes,
        next_appointment_advice
      });

      return res.json({
        success: true,
        message: 'Medical record updated successfully',
        data: medicalRecord
      });
    } catch (error) {
      console.error('Update medical record error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Get my medical records (Patient only)
   */
  async getMyMedicalRecords(req, res) {
    try {
      const patientUserId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      // Get patient ID
      const patient = await Patient.findOne({
        where: { user_id: patientUserId }
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }

      // Get medical records
      const { count, rows } = await MedicalRecord.findAndCountAll({
        include: [
          {
            model: Appointment,
            as: 'appointment',
            where: { patient_id: patient.id },
            include: [
              { model: Doctor, as: 'doctor', include: ['specialty', { model: User, as: 'user' }] }
            ]
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return res.json({
        success: true,
        data: rows,
        metadata: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Get my medical records error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Get medical record detail
   */
  async getMedicalRecordDetail(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { id } = req.params;

      const medicalRecord = await MedicalRecord.findByPk(id, {
        include: [
          {
            model: Appointment,
            as: 'appointment',
            include: [
              { model: Patient, as: 'patient', include: [{ model: User, as: 'user' }] },
              { model: Doctor, as: 'doctor', include: ['specialty', { model: User, as: 'user' }] }
            ]
          }
        ]
      });

      if (!medicalRecord) {
        return res.status(404).json({
          success: false,
          message: 'Medical record not found'
        });
      }

      // Authorization check
      const isPatient = userRole === 'patient' && medicalRecord.appointment.patient.user_id === userId;
      const isDoctor = userRole === 'doctor' && medicalRecord.appointment.doctor.user_id === userId;
      const isAdmin = userRole === 'admin';

      if (!isPatient && !isDoctor && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this medical record'
        });
      }

      // Parse JSON fields
      const recordData = medicalRecord.toJSON();
      if (recordData.prescription) {
        recordData.prescription = JSON.parse(recordData.prescription);
      }
      if (recordData.vital_signs) {
        recordData.vital_signs = JSON.parse(recordData.vital_signs);
      }
      if (recordData.attachments) {
        recordData.attachments = JSON.parse(recordData.attachments);
      }

      return res.json({
        success: true,
        data: recordData
      });
    } catch (error) {
      console.error('Get medical record detail error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Download medical record as PDF
   */
  async downloadMedicalRecord(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { id } = req.params;

      const medicalRecord = await MedicalRecord.findByPk(id, {
        include: [
          {
            model: Appointment,
            as: 'appointment',
            include: [
              { model: Patient, as: 'patient', include: [{ model: User, as: 'user' }] },
              { model: Doctor, as: 'doctor', include: ['specialty', { model: User, as: 'user' }] }
            ]
          }
        ]
      });

      if (!medicalRecord) {
        return res.status(404).json({
          success: false,
          message: 'Medical record not found'
        });
      }

      // Authorization check
      const isPatient = userRole === 'patient' && medicalRecord.appointment.patient.user_id === userId;
      const isDoctor = userRole === 'doctor' && medicalRecord.appointment.doctor.user_id === userId;
      const isAdmin = userRole === 'admin';

      if (!isPatient && !isDoctor && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to download this medical record'
        });
      }

      // Generate PDF
      const pdfPath = await PdfService.generateMedicalRecordPdf(medicalRecord, medicalRecord.appointment);

      return res.json({
        success: true,
        data: {
          download_url: `${process.env.APP_URL}${pdfPath}`
        }
      });
    } catch (error) {
      console.error('Download medical record error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Upload attachments (Doctor only)
   */
  async uploadAttachments(req, res) {
    try {
      const { id } = req.params;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const medicalRecord = await MedicalRecord.findByPk(id);
      if (!medicalRecord) {
        return res.status(404).json({
          success: false,
          message: 'Medical record not found'
        });
      }

      // Get existing attachments
      const existingAttachments = medicalRecord.attachments 
        ? JSON.parse(medicalRecord.attachments) 
        : [];

      // Add new attachments
      const newAttachments = req.files.map(file => ({
        filename: file.filename,
        original_name: file.originalname,
        path: `/uploads/medical-records/${file.filename}`,
        size: file.size,
        uploaded_at: new Date()
      }));

      const allAttachments = [...existingAttachments, ...newAttachments];

      // Update medical record
      await medicalRecord.update({
        attachments: JSON.stringify(allAttachments)
      });

      return res.json({
        success: true,
        message: 'Attachments uploaded successfully',
        data: { attachments: allAttachments }
      });
    } catch (error) {
      console.error('Upload attachments error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = medicalRecordController;
