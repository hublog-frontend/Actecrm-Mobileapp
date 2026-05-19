import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

export default function CommonDatePicker({
  label,
  value,
  onDateChange,
  placeholder = 'Select Date',
  error,
  minimumDate,
  maximumDate,
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={styles.inputGroup}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TouchableOpacity
        style={[styles.pickerSelector, error && styles.errorInput]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.pickerValue,
            !value && styles.placeholderText,
          ]}
        >
          {value ? moment(value).format('DD MMM YYYY') : placeholder}
        </Text>
        <Icon name="calendar-outline" size={18} color="#7D8DA1" />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (event.type === 'set' && selectedDate) {
              onDateChange(selectedDate);
            }
            if (event.type === 'dismissed') {
              onDateChange(null);
            }
          }}
        />
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
  },
  pickerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  pickerValue: {
    fontSize: 14,
    color: '#1A3353',
  },
  placeholderText: {
    color: '#A0AEC0',
  },
  errorInput: {
    borderColor: '#E53E3E',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
});
