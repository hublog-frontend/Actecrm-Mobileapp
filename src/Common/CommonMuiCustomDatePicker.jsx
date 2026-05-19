import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import moment from 'moment';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

const CommonMuiCustomDatePicker = ({ onDateChange, value, isDashboard }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [option, setOption] = useState('last7days');
  const [startDate, setStartDate] = useState(moment().subtract(6, 'day'));
  const [endDate, setEndDate] = useState(moment());
  
  const [showPicker, setShowPicker] = useState(null); // 'start' | 'end' | null

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
        } else {
          setOption('custom');
        }
      }
    }
  }, [value]);

  const handleOptionSelect = (val) => {
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
      case 'custom':
        return; // Don't close modal, show custom pickers
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
    { label: 'Custom Range', value: 'custom' },
  ];

  return (
    <View>
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="calendar-outline" size={20} color="#5D6AD1" />
        <Text style={styles.triggerText}>
          {startDate.format('YYYY-MM-DD')}  →  {endDate.format('YYYY-MM-DD')}
        </Text>
        <Icon name="chevron-down" size={16} color="#667C94" />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date Range</Text>
            <ScrollView style={styles.optionsList}>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.optionItem,
                    option === opt.value && styles.selectedOption,
                  ]}
                  onPress={() => handleOptionSelect(opt.value)}
                >
                  <Text style={[
                    styles.optionText,
                    option === opt.value && styles.selectedOptionText
                  ]}>
                    {opt.label}
                  </Text>
                  {option === opt.value && (
                    <Icon name="checkmark" size={20} color="#5D6AD1" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {option === 'custom' && (
              <View style={styles.customContainer}>
                <View style={styles.customPickerRow}>
                  <TouchableOpacity 
                    style={styles.dateDisplay}
                    onPress={() => setShowPicker('start')}
                  >
                    <Text style={styles.dateLabel}>From</Text>
                    <Text style={styles.dateValue}>{startDate.format('DD/MM/YYYY')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.dateDisplay}
                    onPress={() => setShowPicker('end')}
                  >
                    <Text style={styles.dateLabel}>To</Text>
                    <Text style={styles.dateValue}>{endDate.format('DD/MM/YYYY')}</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.applyButtonText}>Apply Range</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {showPicker && (
        <DateTimePicker
          value={showPicker === 'start' ? startDate.toDate() : endDate.toDate()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={showPicker === 'end' ? startDate.toDate() : undefined}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E8EE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    color: '#1A3353',
    marginHorizontal: 10,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A3353',
    textAlign: 'center',
    marginBottom: 15,
  },
  optionsList: {
    paddingHorizontal: 10,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  selectedOption: {
    backgroundColor: '#F0F3F7',
  },
  optionText: {
    fontSize: 15,
    color: '#667C94',
  },
  selectedOptionText: {
    color: '#5D6AD1',
    fontWeight: '600',
  },
  customContainer: {
    marginTop: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F3F7',
    paddingTop: 15,
  },
  customPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateDisplay: {
    flex: 0.48,
    backgroundColor: '#F0F3F7',
    borderRadius: 8,
    padding: 10,
  },
  dateLabel: {
    fontSize: 11,
    color: '#667C94',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    color: '#1A3353',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#5D6AD1',
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
