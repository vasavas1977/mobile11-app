export interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  iosVersion: number | null;
  supportsOneClick: boolean;
  deviceType: 'ios' | 'android' | 'unknown';
}

export const detectDevice = (): DeviceInfo => {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  
  // Parse iOS version
  const iosVersionMatch = ua.match(/OS (\d+)_/);
  const iosVersion = iosVersionMatch ? parseInt(iosVersionMatch[1]) : null;
  const supportsOneClick = iosVersion !== null && iosVersion >= 17;
  
  let deviceType: 'ios' | 'android' | 'unknown' = 'unknown';
  if (isIOS) deviceType = 'ios';
  else if (isAndroid) deviceType = 'android';
  
  return {
    isIOS,
    isAndroid,
    iosVersion,
    supportsOneClick,
    deviceType
  };
};

export const getRecommendedTab = (): string => {
  const device = detectDevice();
  
  if (device.supportsOneClick) {
    return 'quick-install';
  } else if (device.isIOS) {
    return 'manual-ios';
  } else if (device.isAndroid) {
    return 'android';
  }
  
  return 'quick-install'; // Default to quick install
};
