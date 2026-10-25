/* eslint-disable react-refresh/only-export-components */
import { Dimensions, Platform } from 'react-native';
import { showMessage } from 'react-native-flash-message';

export const IS_IOS = Platform.OS === 'ios';
const { width, height } = Dimensions.get('screen');

export const WIDTH = width;
export const HEIGHT = height;

export function showError(error: unknown) {
  showMessage({
    message: 'Error',
    description: extractError(error).trimEnd(),
    type: 'danger',
    duration: 4000,
    icon: 'danger',
  });
}

export function showErrorMessage(message: string = 'Something went wrong ') {
  showMessage({
    message,
    type: 'danger',
    duration: 4000,
  });
}

export function extractError(data: unknown): string {
  if (typeof data === 'string') {
    return data;
  }
  if (Array.isArray(data)) {
    const messages = data.map((item) => {
      return `  ${extractError(item)}`;
    });

    return `${messages.join('')}`;
  }

  if (typeof data === 'object' && data !== null) {
    const messages = Object.entries(data).map((item) => {
      const [key, value] = item;
      const separator = Array.isArray(value) ? ':\n ' : ': ';

      return `- ${key}${separator}${extractError(value)} \n `;
    });
    return `${messages.join('')} `;
  }
  return 'Something went wrong ';
}
