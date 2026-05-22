import React from 'react';
import { TextInput, View, Text } from 'react-native';
import { useTheme } from '../Context/ThemeContext';

export default function CommonTextInput({
  label,
  placeholder,
  onChangeText,
  value,
  placeholderTextColor,
  secureTextEntry = false,
  rightComponent,
  error,
  errorFontSize,
  ...props
}) {
  const { theme } = useTheme();

  return (
    <View style={{ marginBottom: 20 }}>
      {label && (
        <View
          style={{
            position: 'absolute',
            top: -10,
            left: 12,
            backgroundColor: theme.surface,
            paddingHorizontal: 4,
            zIndex: 1,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: theme.textSecondary,
              fontWeight: '500',
            }}
          >
            {label}
          </Text>
        </View>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: error ? theme.error : theme.border,
          borderRadius: 8,
          backgroundColor: theme.inputBg,
          height: 56,
          paddingHorizontal: 16,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            fontSize: 16,
            color: theme.textPrimary,
            height: '100%',
          }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor || theme.textMuted}
          secureTextEntry={secureTextEntry}
          cursorColor={theme.primary}
          {...props}
        />
        {rightComponent}
      </View>

      {error ? (
        <View style={{ position: 'absolute', bottom: -18, left: 4 }}>
          <Text
            style={{
              color: theme.error,
              fontSize: errorFontSize || 11,
              fontWeight: '500',
            }}
          >
            {label} {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
