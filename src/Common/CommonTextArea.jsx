import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

import { capitalizeWords } from './CommonFormInput';

export default function CommonTextArea({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  height = 100,
  ...props
}) {
  const handleChangeText = text => {
    let rawValue = text.replace(/^\s+/, ''); // Removes leading spaces

    const cleanLabel = label ? label.replace(/\*/g, '').trim() : '';

    if (
      cleanLabel === 'Email' ||
      cleanLabel === 'Profile Name' ||
      cleanLabel === 'Trainer Email' ||
      cleanLabel === 'User Id' ||
      cleanLabel === 'Role Name' ||
      cleanLabel === 'IFSC Code' ||
      cleanLabel === 'Address' ||
      cleanLabel === 'Brouchures Link' ||
      cleanLabel === 'Syllabus' ||
      cleanLabel === 'Attendance Sheet Link' ||
      cleanLabel === 'Comments' // Additional exclusion if they don't want strict capitalization on textarea
    ) {
      if (onChangeText) {
        onChangeText(rawValue);
      }
    } else {
      const newValue = capitalizeWords(rawValue);
      if (onChangeText) {
        onChangeText(newValue);
      }
    }
  };

  return (
    <View style={styles.inputGroup}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        style={[
          styles.textInput,
          { height, textAlignVertical: 'top', paddingTop: 10 },
          error && styles.errorInput,
        ]}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A0AEC0"
        multiline
        cursorColor="#5D6AD1"
        {...props}
      />
      {error ? <Text style={styles.errorText}>{label + error}</Text> : null}
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
  textInput: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1A3353',
    backgroundColor: '#FFFFFF',
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
