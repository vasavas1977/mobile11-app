/**
 * Utility for generating localized package descriptions based on package attributes
 * Supports Day Pass, Max Speed, and Limitless package types with dynamic speed normalization
 * 
 * Note: "Unlimited" terminology is reserved ONLY for Limitless packages.
 * Day Pass and Max Speed use "backup" terminology since 384 Kbps throttle is not practically usable.
 */

export interface PackageDescriptionParams {
  packageType: string;
  dataAmount: string;
  speedAfterLimit?: string;
  qosSpeed?: string;
}

export function getLocalizedDescription(
  params: PackageDescriptionParams,
  t: (key: string) => string
): string {
  const { packageType, dataAmount, speedAfterLimit, qosSpeed } = params;
  
  const normalizedType = packageType?.toLowerCase().replace(/[_\s-]/g, '') || '';
  
  if (normalizedType === 'daypass' || normalizedType === 'day_pass') {
    const backupSpeed = speedAfterLimit || '384Kbps';
    const normalizedSpeed = backupSpeed.toLowerCase().replace(/\s/g, '');
    const taglineKey = normalizedSpeed.includes('1mbps') || normalizedSpeed.includes('1 mbps')
      ? 'packageDescriptions.dayPass.tagline1mbps' 
      : 'packageDescriptions.dayPass.tagline384';
    
    const template = t('packageDescriptions.dayPass.template');
    const tagline = t(taglineKey);
    
    return template
      .replace('{dataAmount}', dataAmount || 'High-speed')
      .replace('{backupSpeed}', backupSpeed)
      .replace('{tagline}', tagline);
  }
  
  if (normalizedType === 'maxspeed' || normalizedType === 'max_speed') {
    const template = t('packageDescriptions.maxSpeed.template');
    const tagline = t('packageDescriptions.maxSpeed.tagline');
    
    return template
      .replace('{dataAmount}', dataAmount || 'High-speed')
      .replace('{tagline}', tagline);
  }
  
  if (normalizedType === 'limitless') {
    const template = t('packageDescriptions.limitless.template');
    const tagline = t('packageDescriptions.limitless.tagline');
    
    return template
      .replace('{tagline}', tagline);
  }
  
  // Fallback for unknown package types
  return t('packageDescriptions.fallback')
    .replace('{dataAmount}', dataAmount || 'Data');
}
