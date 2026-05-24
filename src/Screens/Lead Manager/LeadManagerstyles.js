import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8EE',
    zIndex: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F3F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A3353',
    paddingVertical: 8,
  },
  filterIcon: {
    marginLeft: 12,
  },
  listContent: {
    padding: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A3353',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardBody: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#667C94',
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F3F7',
    paddingTop: 12,
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  actionText: {
    fontSize: 12,
    color: '#5D6AD1',
    marginLeft: 4,
    fontWeight: '500',
  },
  communicationIcons: {
    flexDirection: 'row',
  },
  commIcon: {
    marginLeft: 15,
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: 6,
  },
  cardFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    flexShrink: 0,
    gap: 4,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Follow-up specific
  chipContainer: {
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F3F7',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E1E8EE',
  },
  activeChip: {
    backgroundColor: '#5D6AD1',
    borderColor: '#5D6AD1',
  },
  chipText: {
    fontSize: 12,
    color: '#667C94',
    fontWeight: '500',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  overdueText: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  // Modal & Bottom Sheet
  bottomSheetContent: {
    padding: 20,
    paddingTop: 20,
    flexGrow: 1,
  },
  bsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A3353',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#667C94',
    marginBottom: 8,
    marginTop: 12,
  },
  submitButton: {
    backgroundColor: '#5D6AD1',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  // Detailed Sheet Styles
  detailsModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  detailsModalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  detailsModalHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  detailsDragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  detailsCloseBtn: {
    padding: 6,
    borderRadius: 20,
  },
  detailsHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3353',
    marginVertical: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#5D6AD1',
    paddingLeft: 10,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 11,
    color: '#667C94',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    color: '#1A3353',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E1E8EE',
    marginVertical: 15,
  },
  historyItem: {
    marginBottom: 15,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#F0F3F7',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyUser: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5D6AD1',
  },
  historyDate: {
    fontSize: 10,
    color: '#A0AEC0',
  },
  historyComment: {
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 18,
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E1E8EE',
    marginBottom: 30,
  },
  navButtons: {
    flexDirection: 'row',
  },
  navButton: {
    padding: 10,
    marginRight: 10,
    backgroundColor: '#F0F3F7',
    borderRadius: 6,
  },
  navButtonText: {
    fontSize: 12,
    color: '#1A3353',
  },
  filterMenu: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
    width: 200,
  },
  filterMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  filterMenuText: {
    fontSize: 14,
    color: '#1A3353',
    marginLeft: 12,
  },
});

export default styles;
