import { Alert } from 'react-native';

export const CommonMessage = (type, message) => {
  Alert.alert(
    type === 'error' ? 'Error' : 'Success',
    message,
    [{ text: 'OK' }]
  );
};
