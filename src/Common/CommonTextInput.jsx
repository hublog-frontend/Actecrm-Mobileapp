import React from 'react';
import { TextInput, View, Text } from 'react-native';
import { commonStyles, COLORS } from './CommonStyles';

export default function CommonTextInput({
  label,
  placeholder,
  onChangeText,
  value,
  placeholderTextColor = '#A0AEC0',
  secureTextEntry = false,
  rightComponent, // Support for icons/buttons on the right
  error, // New error prop
  errorFontSize,
  ...props
}) {
  return (
    <View style={commonStyles.common_textinput_inputGroup}>
      {label && (
        <View style={commonStyles.common_textinput_labelContainer}>
          <Text style={commonStyles.common_textinput_label}>{label}</Text>
        </View>
      )}
      <View
        style={[
          commonStyles.common_textinput_inputWrapper,
          error ? { borderColor: COLORS.error } : null,
        ]}
      >
        <TextInput
          style={commonStyles.common_textinput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          secureTextEntry={secureTextEntry}
          {...props}
        />
        {rightComponent}
      </View>

      {/* Absolute positioned error text to prevent layout shifting (shaking) */}
      {error ? (
        <View style={{ position: 'absolute', bottom: -18, left: 4 }}>
          <Text
            style={{
              color: COLORS.error,
              fontSize: errorFontSize ? errorFontSize : 11,
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
