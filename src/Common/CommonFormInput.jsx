import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export const capitalizeWords = text => {
  return text
    .split(' ')
    .map(word =>
      word.length > 0
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : '',
    )
    .join(' ');
};

export default function CommonFormInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
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
      cleanLabel === 'Attendance Sheet Link'
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
        style={[styles.textInput, error && styles.errorInput]}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A0AEC0"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        cursorColor="#5D6AD1"
        {...props}
      />
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
  textInput: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    paddingHorizontal: 12,
    fontSize: 15,
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
