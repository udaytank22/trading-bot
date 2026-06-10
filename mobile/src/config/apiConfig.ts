import { Platform } from 'react-native';

export const API_BASE_URL = Platform.select({
  ios: 'http://localhost:5001/api',
  android: 'http://10.0.2.2:5001/api',
  default: 'http://localhost:5001/api',
});
