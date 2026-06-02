import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import moment from 'moment';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../Context/ThemeContext';

const CommonMuiCustomDatePicker = ({ onDateChange, value, isDashboard }) => {
  const { theme } = useTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [option, setOption] = useState('last7days');
  const [startDate, setStartDate] = useState(moment().subtract(6, 'day'));
  const [endDate, setEndDate] = useState(moment());

  const [showPicker, setShowPicker] = useState(null);

  useEffect(() => {
    if (value && value.length === 2) {
      const [start, end] = value;

      if (start) setStartDate(moment(start));
      if (end) setEndDate(moment(end));

      const today = moment();
      const startDay = start ? moment(start) : null;
      const endDay = end ? moment(end) : null;

      if (startDay && endDay) {
        let expectedStart, expectedEnd;
        const todayDate = today.date();

        if (todayDate <= 25) {
          expectedStart = moment().subtract(1, 'month').date(26);
          expectedEnd = moment().date(25);
        } else {
          expectedStart = moment().date(26);
          expectedEnd = moment().add(1, 'month').date(25);
        }

        if (startDay.isSame(today, 'day') && endDay.isSame(today, 'day')) {
          setOption('today');
        } else if (
          startDay.isSame(moment().subtract(1, 'day'), 'day') &&
          endDay.isSame(moment().subtract(1, 'day'), 'day')
        ) {
          setOption('yesterday');
        } else if (
          startDay.isSame(expectedStart, 'day') &&
          endDay.isSame(expectedEnd, 'day')
        ) {
          setOption('thisMonth');
        } else if (
          startDay.isSame(moment().subtract(6, 'day'), 'day') &&
          endDay.isSame(today, 'day')
        ) {
          setOption('last7days');
        } else if (
          startDay.isSame(moment().subtract(14, 'day'), 'day') &&
          endDay.isSame(today, 'day')
        ) {
          setOption('last15days');
        } else if (
          startDay.isSame(moment().subtract(29, 'day'), 'day') &&
          endDay.isSame(today, 'day')
        ) {
          setOption('last30days');
        } else if (
          startDay.isSame(moment().subtract(59, 'day'), 'day') &&
          endDay.isSame(today, 'day')
        ) {
          setOption('last60days');
        } else if (
          startDay.isSame(moment().subtract(89, 'day'), 'day') &&
          endDay.isSame(today, 'day')
        ) {
          setOption('last90days');
        } else {
          setOption('custom');
        }
      }
    }
  }, [value]);

  const handleOptionSelect = val => {
    setOption(val);

    const today = moment();
    let newStart = startDate;
    let newEnd = endDate;

    switch (val) {
      case 'today':
        newStart = today;
        newEnd = today;
        break;

      case 'yesterday':
        newStart = moment().subtract(1, 'day');
        newEnd = moment().subtract(1, 'day');
        break;

      case 'thisMonth': {
        const todayDate = today.date();

        if (todayDate <= 25) {
          newStart = moment().subtract(1, 'month').date(26);
          newEnd = moment().date(25);
        } else {
          newStart = moment().date(26);
          newEnd = moment().add(1, 'month').date(25);
        }

        break;
      }

      case 'last7days':
        newStart = moment().subtract(6, 'day');
        newEnd = today;
        break;

      case 'last15days':
        newStart = moment().subtract(14, 'day');
        newEnd = today;
        break;

      case 'last30days':
        newStart = moment().subtract(29, 'day');
        newEnd = today;
        break;

      case 'last60days':
        newStart = moment().subtract(59, 'day');
        newEnd = today;
        break;

      case 'last90days':
        newStart = moment().subtract(89, 'day');
        newEnd = today;
        break;

      case 'custom':
        return;

      default:
        break;
    }

    setStartDate(newStart);
    setEndDate(newEnd);

    onDateChange?.([
      newStart.format('YYYY-MM-DD'),
      newEnd.format('YYYY-MM-DD'),
    ]);

    setModalVisible(false);
  };

  const handleDateChange = (event, selectedDate) => {
    const currentPicker = showPicker;
    setShowPicker(null);

    if (event.type === 'set' && selectedDate) {
      if (currentPicker === 'start') {
        const newStart = moment(selectedDate);

        setStartDate(newStart);

        if (newStart.isAfter(endDate)) {
          setEndDate(newStart);
        }

        onDateChange?.([
          newStart.format('YYYY-MM-DD'),
          endDate.format('YYYY-MM-DD'),
        ]);
      } else {
        const newEnd = moment(selectedDate);

        setEndDate(newEnd);

        onDateChange?.([
          startDate.format('YYYY-MM-DD'),
          newEnd.format('YYYY-MM-DD'),
        ]);
      }
    }
  };

  const options = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last 7 Days', value: 'last7days' },
    { label: 'Last 15 Days', value: 'last15days' },
    { label: 'Last 30 Days', value: 'last30days' },
    { label: 'Last 60 Days', value: 'last60days' },
    { label: 'Last 90 Days', value: 'last90days' },
    { label: 'Custom Range', value: 'custom' },
  ];

  return (
    <View style={isDashboard ? styles.containerDashboard : undefined}>
      <TouchableOpacity
        style={[
          styles.triggerButton,
          isDashboard && styles.triggerButtonDashboard,
          {
            backgroundColor: theme.inputBg,
            borderColor: theme.border,
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="calendar-outline" size={20} color={theme.primary} />

        <Text
          style={[
            styles.triggerText,
            {
              color: theme.textPrimary,
            },
          ]}
        >
          {startDate.format('YYYY-MM-DD')} → {endDate.format('YYYY-MM-DD')}
        </Text>

        <Icon name="chevron-down" size={16} color={theme.textSecondary} />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View
            style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: theme.surface },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text
                    style={[styles.modalTitle, { color: theme.textPrimary }]}
                  >
                    Select Date Range
                  </Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="close" size={22} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.optionsList}>
                  {options.map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.optionItem,
                        option === opt.value && {
                          backgroundColor: theme.inputBg,
                        },
                      ]}
                      onPress={() => handleOptionSelect(opt.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: theme.textSecondary },
                          option === opt.value && {
                            color: theme.primary,
                            fontWeight: '600',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>

                      {option === opt.value && (
                        <Icon
                          name="checkmark"
                          size={20}
                          color={theme.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {option === 'custom' && (
                  <View
                    style={[
                      styles.customContainer,
                      {
                        borderTopColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.customPickerRow}>
                      <TouchableOpacity
                        style={[
                          styles.dateDisplay,
                          {
                            backgroundColor: theme.inputBg,
                          },
                        ]}
                        onPress={() => setShowPicker('start')}
                      >
                        <Text
                          style={[
                            styles.dateLabel,
                            {
                              color: theme.textSecondary,
                            },
                          ]}
                        >
                          From
                        </Text>

                        <Text
                          style={[
                            styles.dateValue,
                            {
                              color: theme.textPrimary,
                            },
                          ]}
                        >
                          {startDate.format('DD/MM/YYYY')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.dateDisplay,
                          {
                            backgroundColor: theme.inputBg,
                          },
                        ]}
                        onPress={() => setShowPicker('end')}
                      >
                        <Text
                          style={[
                            styles.dateLabel,
                            {
                              color: theme.textSecondary,
                            },
                          ]}
                        >
                          To
                        </Text>

                        <Text
                          style={[
                            styles.dateValue,
                            {
                              color: theme.textPrimary,
                            },
                          ]}
                        >
                          {endDate.format('DD/MM/YYYY')}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.applyButton,
                        {
                          backgroundColor: theme.primary,
                        },
                      ]}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.applyButtonText}>Apply Range</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {showPicker && (
        <DateTimePicker
          value={showPicker === 'start' ? startDate.toDate() : endDate.toDate()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={showPicker === 'end' ? startDate.toDate() : undefined}
          themeVariant={theme.dark ? 'dark' : 'light'}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  containerDashboard: {
    width: '100%',
    alignSelf: 'stretch',
  },
  triggerButtonDashboard: {
    marginHorizontal: 0,
    marginBottom: 0,
    width: '100%',
    alignSelf: 'stretch',
  },

  triggerText: {
    flex: 1,
    fontSize: 14,
    marginHorizontal: 10,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  modalContent: {
    width: '85%',
    borderRadius: 16,
    paddingVertical: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },

  optionsList: {
    paddingHorizontal: 10,
  },

  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },

  optionText: {
    fontSize: 15,
  },

  customContainer: {
    marginTop: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    paddingTop: 15,
  },

  customPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  dateDisplay: {
    flex: 0.48,
    borderRadius: 8,
    padding: 10,
  },

  dateLabel: {
    fontSize: 11,
    marginBottom: 4,
  },

  dateValue: {
    fontSize: 14,
    fontWeight: '500',
  },

  applyButton: {
    borderRadius: 8,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },

  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default CommonMuiCustomDatePicker;
