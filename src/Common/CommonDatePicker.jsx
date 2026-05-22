import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useTheme } from '../Context/ThemeContext';

export default function CommonDatePicker({
  label,
  value,
  onDateChange,
  placeholder = 'Select Date',
  error,
  minimumDate,
  maximumDate,
  disabled = false,
  allowPastDates = false,
}) {
  const { theme } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const calculatedMinimumDate = allowPastDates
    ? minimumDate
    : minimumDate || new Date();

  return (
    <View style={styles.inputGroup}>
      {label && (
        <Text
          style={[
            styles.inputLabel,
            { color: disabled ? theme.textMuted : theme.textSecondary },
          ]}
        >
          {label}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.pickerSelector,
          {
            borderColor: error ? theme.error : theme.border,
            backgroundColor: disabled ? theme.surfaceSecondary : theme.surface,
          },
        ]}
        onPress={() => {
          if (!disabled) setShowPicker(true);
        }}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <Text
          style={[
            styles.pickerValue,
            { color: value ? theme.textPrimary : theme.textMuted },
            disabled && { color: theme.textMuted },
          ]}
        >
          {value ? moment(value).format('DD MMM YYYY') : placeholder}
        </Text>
        <Icon
          name="calendar-outline"
          size={18}
          color={disabled ? theme.textMuted : theme.textSecondary}
        />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          minimumDate={calculatedMinimumDate}
          maximumDate={maximumDate}
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (event.type === 'set' && selectedDate)
              onDateChange(selectedDate);
            if (event.type === 'dismissed') onDateChange(null);
          }}
        />
      )}

      {error ? (
        <Text style={[styles.errorText, { color: theme.error }]}>
          {label + error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  pickerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  pickerValue: { fontSize: 14 },
  errorText: { fontSize: 11, marginTop: 4, fontWeight: '500' },
});
