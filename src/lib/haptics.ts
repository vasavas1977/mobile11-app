// Re-export enums as plain objects to avoid Capacitor import errors in web
export const ImpactStyle = {
  Heavy: 'HEAVY' as const,
  Medium: 'MEDIUM' as const,
  Light: 'LIGHT' as const,
};

export const NotificationType = {
  Success: 'SUCCESS' as const,
  Warning: 'WARNING' as const,
  Error: 'ERROR' as const,
};

type ImpactStyleType = (typeof ImpactStyle)[keyof typeof ImpactStyle];
type NotificationTypeType = (typeof NotificationType)[keyof typeof NotificationType];

const getCapacitorHaptics = async () => {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { Haptics } = await import('@capacitor/haptics');
      return Haptics;
    }
  } catch {
    // Not in native context
  }
  return null;
};

export const hapticImpact = async (style: ImpactStyleType = ImpactStyle.Light) => {
  const haptics = await getCapacitorHaptics();
  if (haptics) {
    await haptics.impact({ style: style as any });
  } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(style === ImpactStyle.Heavy ? 30 : style === ImpactStyle.Medium ? 20 : 10);
  }
};

export const hapticNotification = async (type: NotificationTypeType = NotificationType.Success) => {
  const haptics = await getCapacitorHaptics();
  if (haptics) {
    await haptics.notification({ type: type as any });
  } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([10, 50, 10]);
  }
};

export const hapticKeypress = async () => {
  const haptics = await getCapacitorHaptics();
  if (haptics) {
    await haptics.impact({ style: 'LIGHT' as any });
  } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(3);
  }
};

export const hapticSelection = async () => {
  const haptics = await getCapacitorHaptics();
  if (haptics) {
    await haptics.selectionStart();
    await haptics.selectionChanged();
    await haptics.selectionEnd();
  } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(5);
  }
};
