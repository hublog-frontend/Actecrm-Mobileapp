import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  toolbar: {
    width: '100%',
    marginBottom: 16,
  },
  datePickerWrap: {
    width: '100%',
    alignSelf: 'stretch',
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#1A3353',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardDateRange: {
    fontSize: 11,
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  tableCol: {
    minWidth: 0,
    paddingRight: 6,
    justifyContent: 'center',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    lineHeight: 13,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  tableCellCenter: {
    textAlign: 'center',
  },
  skeleton: {
    height: 120,
    borderRadius: 12,
    marginVertical: 8,
  },
  emptyChart: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 13,
  },
  noAccess: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  noAccessText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
});
