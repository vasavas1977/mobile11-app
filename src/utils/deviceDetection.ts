// Device detection utility for trusted devices tracking

interface DeviceInfo {
  browser: string;
  os: string;
  deviceName: string;
}

export function detectDevice(): DeviceInfo {
  const userAgent = navigator.userAgent;
  
  // Detect browser
  let browser = 'Unknown Browser';
  if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Edg/')) {
    browser = 'Edge';
  } else if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browser = 'Opera';
  }
  
  // Detect OS
  let os = 'Unknown OS';
  if (userAgent.includes('Windows NT 10')) {
    os = 'Windows 10/11';
  } else if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS X')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }
  
  // Create device name
  const deviceName = `${browser} on ${os}`;
  
  return { browser, os, deviceName };
}
