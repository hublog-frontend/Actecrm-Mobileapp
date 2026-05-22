import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { capitalizeWords } from './CommonFormInput';
import { useTheme } from '../Context/ThemeContext';

export default function CommonTextArea({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  height = 100,
  ...props
}) {
  const { theme } = useTheme();

  const handleChangeText = text => {
    let rawValue = text.replace(/^\s+/, '');
    const cleanLabel = label ? label.replace(/\*/g, '').trim() : '';
    const noCapLabels = [
      'Email',
      'Profile Name',
      'Trainer Email',
      'User Id',
      'Role Name',
      'IFSC Code',
      'Address',
      'Brouchures Link',
      'Syllabus',
      'Attendance Sheet Link',
      'Comments',
    ];
    if (noCapLabels.includes(cleanLabel)) {
      onChangeText?.(rawValue);
    } else {
      onChangeText?.(capitalizeWords(rawValue));
    }
  };

  return (
    <View style={styles.inputGroup}>
      {label && (
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.textInput,
          { height, textAlignVertical: 'top', paddingTop: 10 },
          {
            borderColor: error ? theme.error : theme.border,
            backgroundColor: theme.inputBg,
            color: theme.textPrimary,
          },
        ]}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        multiline
        cursorColor={theme.primary}
        {...props}
      />
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
  textInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  errorText: { fontSize: 11, marginTop: 4, fontWeight: '500' },
});
