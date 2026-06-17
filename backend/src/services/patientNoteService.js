const PatientNote = require('../models/PatientNote');

const getAll = () => PatientNote.findAll({ order: [['date', 'DESC']] });

const analyzeNote = (noteText) => {
  // Keyword-based fallback analysis (replace with Azure Cognitive Services / AI call)
  const text = noteText.toLowerCase();
  let riskLevel = 'Low';
  let sentiment = 'Neutral';

  const highRiskWords = ['skip', 'stop', 'refuse', 'won\'t take', 'not taking'];
  const medRiskWords = ['forgot', 'missed', 'late', 'dizzy', 'weak', 'nausea'];
  const negativeWords = ['bad', 'pain', 'sick', 'worse', 'terrible'];

  if (highRiskWords.some((w) => text.includes(w))) {
    riskLevel = 'High';
    sentiment = 'Non-Compliance Risk';
  } else if (medRiskWords.some((w) => text.includes(w))) {
    riskLevel = 'Medium';
    sentiment = 'Apprehensive / Delayed';
  } else if (negativeWords.some((w) => text.includes(w))) {
    sentiment = 'Negative';
  } else {
    sentiment = 'Positive / Neutral';
  }

  return {
    sentiment,
    riskLevel,
    riskAnalysis: `Based on the patient's feedback, adherence risk is assessed as ${riskLevel}. Monitor closely.`,
    sideEffects: medRiskWords.filter((w) => text.includes(w)).join(', ') || 'None reported',
    recommendations:
      riskLevel === 'High'
        ? 'Immediate caregiver intervention required. Schedule doctor consultation.'
        : riskLevel === 'Medium'
        ? 'Set double reminders. Prepare portable medication kit for travel.'
        : 'Continue current regimen. Maintain regular monitoring.',
  };
};

const create = async ({ noteText, date }) => {
  const analysis = analyzeNote(noteText);
  return PatientNote.create({
    id: `note-${Date.now()}`,
    date: date || new Date().toISOString().split('T')[0],
    noteText,
    ...analysis,
  });
};

module.exports = { getAll, create };
