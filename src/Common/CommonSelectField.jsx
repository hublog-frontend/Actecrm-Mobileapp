import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function CommonSelectField({
  label,
  selectedValue,
  onPress,
  placeholder = 'Select Option',
  error,
  rightIcon = 'chevron-down',
  containerStyle,
  style,
  disabled = false,
  ...props
}) {
  return (
    <View style={[styles.inputGroup, containerStyle]}>
      {label && (
        <Text style={[styles.inputLabel, disabled && styles.disabledLabel]}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.pickerSelector,
          error && styles.errorInput,
          disabled && styles.disabledInput,
          style,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={disabled}
        {...props}
      >
        <Text
          style={[
            styles.pickerValue,
            !selectedValue && styles.placeholderText,
            disabled && styles.disabledText,
          ]}
        >
          {selectedValue ? selectedValue : placeholder}
        </Text>

        <Icon
          name={rightIcon}
          size={18}
          color={disabled ? '#B0B0B0' : '#7D8DA1'}
        />
      </TouchableOpacity>

      {error ? (
        <Text style={styles.errorText}>{`${label ? label : ''} ${error}`}</Text>
      ) : null}
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

  disabledLabel: {
    color: '#A0AEC0',
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

  disabledInput: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },

  pickerValue: {
    fontSize: 14,
    color: '#1A3353',
  },

  disabledText: {
    color: '#94A3B8',
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
