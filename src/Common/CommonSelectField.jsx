import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../Context/ThemeContext';

export default function CommonSelectField({
  label,
  selectedValue,
  onPress,
  onClear,
  placeholder = 'Select Option',
  error,
  rightIcon = 'chevron-down',
  containerStyle,
  style,
  disabled = false,
  ...props
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.inputGroup, containerStyle]}>
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
            backgroundColor: disabled ? theme.surfaceSecondary : 'transparent',
            opacity: disabled ? 0.8 : 1,
          },
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
            { color: selectedValue ? theme.textPrimary : theme.textMuted },
            disabled && { color: theme.textMuted },
          ]}
          numberOfLines={1}
        >
          {selectedValue || placeholder}
        </Text>

        <View style={styles.iconContainer}>
          {selectedValue && onClear && !disabled && (
            <TouchableOpacity
              onPress={onClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.clearButton}
            >
              <Icon name="close-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}

          <Icon
            name={rightIcon}
            size={18}
            color={disabled ? theme.textMuted : theme.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {error ? (
        <Text style={[styles.errorText, { color: theme.error }]}>
          {`${label ?? ''} ${error}`}
        </Text>
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
    marginBottom: 8,
  },
  pickerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  pickerValue: {
    fontSize: 14,
    flex: 1,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    marginRight: 8,
  },
  errorText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
});
