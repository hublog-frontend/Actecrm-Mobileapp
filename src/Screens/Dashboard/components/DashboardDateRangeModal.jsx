import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import moment from 'moment';
import Icon from 'react-native-vector-icons/Ionicons';
import CommonDatePicker from '../../../Common/CommonDatePicker';
import { getDatesFromRangeLabel } from '../../../Common/Validation';

const PRESETS = [
  { id: 'Today', label: 'Today' },
  { id: 'Yesterday', label: 'Yesterday' },
  { id: '7 Days', label: 'Last 7 Days' },
  { id: '15 Days', label: 'Last 15 Days' },
  { id: '30 Days', label: 'Last 30 Days' },
  { id: '60 Days', label: 'Last 60 Days' },
  { id: '90 Days', label: 'Last 90 Days' },
];

const DashboardDateRangeModal = ({
  visible,
  onClose,
  startDate,
  endDate,
  onApply,
  theme,
}) => {
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);

  React.useEffect(() => {
    if (visible) {
      setLocalStart(startDate);
      setLocalEnd(endDate);
    }
  }, [visible, startDate, endDate]);

  const applyPreset = presetId => {
    const range = getDatesFromRangeLabel(presetId);
    const start = range.card_settings.start_date;
    const end = range.card_settings.end_date;
    setLocalStart(start);
    setLocalEnd(end);
  };

  const handleApply = () => {
    if (!localStart || !localEnd) return;
    onApply([localStart, localEnd]);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Date Range</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Quick select
            </Text>
            <View style={styles.presetGrid}>
              {PRESETS.map(preset => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => applyPreset(preset.id)}
                >
                  <Text style={[styles.presetText, { color: theme.textPrimary }]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Custom range
            </Text>
            <CommonDatePicker
              label="Start Date"
              value={localStart ? new Date(localStart) : null}
              onDateChange={date => {
                if (date) setLocalStart(moment(date).format('YYYY-MM-DD'));
              }}
              allowPastDates
            />
            <CommonDatePicker
              label="End Date"
              value={localEnd ? new Date(localEnd) : null}
              onDateChange={date => {
                if (date) setLocalEnd(moment(date).format('YYYY-MM-DD'));
              }}
              allowPastDates
            />
          </ScrollView>

          <TouchableOpacity
            style={[styles.applyBtn, { backgroundColor: theme.primary }]}
            onPress={handleApply}
          >
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
    marginTop: 8,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  applyBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default DashboardDateRangeModal;
