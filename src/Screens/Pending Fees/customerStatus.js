export const STATUS_COLORS = {
  formPending: { bg: '#ff6b6b15', text: '#ff6b6b' },
  awaitFinance: { bg: '#ffbf0018', text: '#ffbf00' },
  awaitVerify: { bg: '#ffa60218', text: '#ffa502' },
  awaitTrainer: { bg: '#2ed57417', text: '#2ed573' },
  awaitTrainerVerify: { bg: '#1e8fff15', text: '#1e90ff' },
  awaitingClass: { bg: '#607d8b17', text: '#607d8b' },
  classScheduled: { bg: '#a29bfe1f', text: '#a29bfe' },
  awaitFeedback: { bg: '#fd79a715', text: '#fd79a8' },
  awaitGReview: { bg: '#ffc10717', text: '#ffc107' },
  awaitLinkedInReview: { bg: '#286cb517', text: '#286cb5' },
  classGoing: { bg: '#00cecb15', text: '#00cec9' },
  completed: { bg: '#3c911115', text: '#3c9111' },
  rejected: { bg: '#ff475715', text: '#ff4757' },
};

const REJECTED_STATUSES = new Set([
  'Rejected',
  'REJECTED',
  'Trainer Rejected',
  'Payment Rejected',
  'Escalated',
  'Hold',
  'Partially Closed',
  'Discontinued',
  'Videos Given',
  'Refund',
]);

export const getCustomerStatusPresentation = (record, theme) => {
  const text = (record?.status || '').trim();
  const fallback = theme.dark
    ? { bg: 'rgba(124, 143, 232, 0.15)', text: theme.primary }
    : { bg: theme.primaryLight, text: theme.primary };

  if (Number(record?.is_second_due) === 1) {
    return { label: 'Payment Verify', ...STATUS_COLORS.awaitFinance };
  }
  if (text === 'Form Pending') {
    return { label: text, ...STATUS_COLORS.formPending };
  }
  if (Number(record?.is_last_pay_rejected) === 1) {
    return { label: 'Payment Rejected', ...STATUS_COLORS.rejected };
  }
  if (text === 'Awaiting Finance') {
    return { label: 'Payment Verify', ...STATUS_COLORS.awaitFinance };
  }
  if (text === 'Awaiting Verify') {
    return { label: text, ...STATUS_COLORS.awaitVerify };
  }
  if (text === 'Awaiting Trainer') {
    return { label: text, ...STATUS_COLORS.awaitTrainer };
  }
  if (text === 'Awaiting Trainer Verify') {
    return { label: text, ...STATUS_COLORS.awaitTrainerVerify };
  }
  if (text === 'Awaiting Class') {
    return { label: text, ...STATUS_COLORS.awaitingClass };
  }
  if (text === 'Class Scheduled') {
    return { label: text, ...STATUS_COLORS.classScheduled };
  }
  if (text === 'Passedout process') {
    return { label: text, ...STATUS_COLORS.awaitFeedback };
  }
  if (text === 'Completed') {
    return { label: text, ...STATUS_COLORS.completed };
  }
  if (REJECTED_STATUSES.has(text)) {
    return { label: text, ...STATUS_COLORS.rejected };
  }
  if (text === 'Class Going') {
    return { label: text, ...STATUS_COLORS.classGoing };
  }
  if (text === 'Await Google review' || text === 'Await Google Review') {
    return { label: text, ...STATUS_COLORS.awaitGReview };
  }
  if (text === 'Await LinkedIn review' || text === 'Await LinkedIn Review') {
    return { label: text, ...STATUS_COLORS.awaitLinkedInReview };
  }
  if (!text) {
    return { label: '—', bg: fallback.bg, text: theme.textMuted };
  }
  return { label: text, bg: fallback.bg, text: fallback.text };
};
