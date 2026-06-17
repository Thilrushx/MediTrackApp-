const AdherenceLog = require('../models/AdherenceLog');
const Medication = require('../models/Medication');
const EscalationAlert = require('../models/EscalationAlert');

const getAll = () => AdherenceLog.findAll({ order: [['date', 'ASC']] });

const takeDose = async ({ medicationId, scheduledTime, date, patientNotes }) => {
  const logId = `log-${medicationId}-${date}-${scheduledTime}`;
  const [log] = await AdherenceLog.upsert({
    id: logId,
    medicationId,
    scheduledTime,
    date,
    status: 'taken',
    timestamp: new Date().toISOString(),
    patientNotes: patientNotes || null,
    medicationName: (await Medication.findByPk(medicationId))?.name || 'Unknown',
    dosage: (await Medication.findByPk(medicationId))?.dosage || '',
  });

  await EscalationAlert.update(
    { status: 'resolved' },
    { where: { medicationId, date, scheduledTime, status: 'notified' } }
  );

  return AdherenceLog.findByPk(logId);
};

const missDose = async ({ medicationId, scheduledTime, date }) => {
  const logId = `log-${medicationId}-${date}-${scheduledTime}`;
  const med = await Medication.findByPk(medicationId);

  await AdherenceLog.upsert({
    id: logId,
    medicationId,
    scheduledTime,
    date,
    status: 'missed',
    medicationName: med?.name || 'Unknown',
    dosage: med?.dosage || '',
  });

  if (med) {
    const contactInfo = med.recipientPhone
      ? `Caregiver (${med.recipientPhone})`
      : 'Caregiver notified';
    await EscalationAlert.create({
      id: `alert-${Date.now()}`,
      medicationId,
      medicationName: med.name,
      scheduledTime,
      date,
      severity: 'high',
      status: 'notified',
      notifiedRole: 'Caregiver',
      message: `ESCALATION: Patient missed ${med.name} (${med.dosage}) scheduled for ${scheduledTime} on ${date}. ${contactInfo}.`,
      timestamp: new Date().toISOString(),
    });
  }

  return AdherenceLog.findByPk(logId);
};

module.exports = { getAll, takeDose, missDose };
