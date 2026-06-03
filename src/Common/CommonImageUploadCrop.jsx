import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
  PermissionsAndroid,
  Keyboard,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../Context/ThemeContext';
import { CommonMessage } from './CommonMessage';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export default function CommonImageUploadCrop({
  label = 'Upload Image',
  maxSizeMB = 1,
  value,
  onChange,
  onErrorChange,
  required = false,
}) {
  const { theme } = useTheme();
  const [previewUri, setPreviewUri] = useState('');
  const [fileName, setFileName] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    if (value) {
      setPreviewUri(`data:image/jpeg;base64,${value}`);
      setFileName('screenshot.jpg');
    } else {
      setPreviewUri('');
      setFileName('');
    }
  }, [value]);

  const reportError = err => {
    onErrorChange?.(err);
  };

  const requestGalleryPermission = async () => {
    if (Platform.OS !== 'android') return true;

    const permission =
      Platform.Version >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

    const granted = await PermissionsAndroid.request(permission);
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const handleChooseFile = async () => {
    Keyboard.dismiss();
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      CommonMessage('error', 'Gallery permission is required');
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
        selectionLimit: 1,
        quality: 0.85,
        maxWidth: 1600,
        maxHeight: 1600,
      },
      response => {
        if (response.didCancel) return;

        if (response.errorCode) {
          CommonMessage(
            'error',
            response.errorMessage || 'Failed to pick image',
          );
          return;
        }

        const asset = response.assets?.[0];
        if (!asset) return;

        const mime = asset.type?.toLowerCase() || '';
        const isValidType =
          ALLOWED_TYPES.includes(mime) ||
          mime.startsWith('image/') ||
          /\.(png|jpe?g)$/i.test(asset.fileName || '');

        if (!isValidType) {
          const err = 'must be .png or .jpeg or .jpg format';
          CommonMessage('error', err);
          reportError(err);
          return;
        }

        const maxBytes = maxSizeMB * 1024 * 1024;
        if (asset.fileSize && asset.fileSize > maxBytes) {
          const err = `File size must be ${maxSizeMB}MB or less`;
          CommonMessage('error', err);
          reportError(err);
          return;
        }

        const base64 = asset.base64;
        if (!base64) {
          CommonMessage('error', 'Could not read image data');
          return;
        }

        onChange?.(base64);
        reportError('');
        setPreviewUri(asset.uri || `data:image/jpeg;base64,${base64}`);
        setFileName(asset.fileName || 'screenshot.jpg');
        // CommonMessage('success', 'Screenshot uploaded');
      },
    );
  };

  const handleRemove = () => {
    onChange?.('');
    setPreviewUri('');
    setFileName('');
    reportError(required ? 'is required' : '');
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {label}
        {required ? <Text style={{ color: theme.error }}> *</Text> : null}
      </Text>

      <TouchableOpacity
        style={[
          styles.uploadButton,
          {
            borderColor: theme.border,
            backgroundColor: theme.inputBg,
          },
        ]}
        onPress={handleChooseFile}
        activeOpacity={0.8}
      >
        <Icon name="cloud-upload-outline" size={18} color={theme.primary} />
        <Text style={[styles.uploadButtonText, { color: theme.textPrimary }]}>
          Choose file <Text style={styles.uploadHint}>(PNG, JPEG & JPG)</Text>
        </Text>
      </TouchableOpacity>

      {previewUri ? (
        <View
          style={[
            styles.fileRow,
            {
              borderColor: theme.border,
              backgroundColor: theme.surface,
            },
          ]}
        >
          <Icon
            name="document-attach-outline"
            size={18}
            color={theme.textSecondary}
          />
          <Text
            style={[styles.fileName, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {fileName}
          </Text>
          <TouchableOpacity
            onPress={() => setPreviewVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="eye-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.deleteBtn}
          >
            <Icon name="trash-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      ) : null}

      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View
          style={[styles.previewOverlay, { backgroundColor: theme.overlay }]}
        >
          <View
            style={[styles.previewCard, { backgroundColor: theme.surface }]}
          >
            <View
              style={[
                styles.previewHeader,
                { borderBottomColor: theme.border },
              ]}
            >
              <Text style={[styles.previewTitle, { color: theme.textPrimary }]}>
                Preview Image
              </Text>
              <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                <Icon name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.previewScroll}
              maximumZoomScale={3}
              minimumZoomScale={1}
              contentContainerStyle={styles.previewScrollContent}
            >
              <Image
                source={{ uri: previewUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 4,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  uploadHint: {
    fontSize: 10,
    fontWeight: '400',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
  },
  deleteBtn: {
    marginLeft: 4,
  },
  previewOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  previewCard: {
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  previewScroll: {
    maxHeight: 400,
  },
  previewScrollContent: {
    padding: 12,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 360,
  },
});
