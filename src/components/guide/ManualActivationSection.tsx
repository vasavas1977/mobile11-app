import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { detectDevice } from '@/lib/deviceDetection';
import { getGuideImages } from '@/lib/guideImages';
import { GuideInfoCards } from './GuideInfoCards';
import { DeviceToggle } from './DeviceToggle';
import { VerticalStepNav } from './VerticalStepNav';
import { GuideStep } from './GuideStep';

interface StepData {
  id: number;
  title: string;
  description: string;
  imagePlaceholder?: string;
  label: string;
}

export function ManualActivationSection() {
  const { t } = useLanguage();
  const device = detectDevice();
  const [activeDevice, setActiveDevice] = useState<'android' | 'ios'>(
    device.isIOS ? 'ios' : 'android'
  );
  const [currentStep, setCurrentStep] = useState(1);
  
  const images = getGuideImages(activeDevice);

  const androidSteps: StepData[] = [
    { id: 1, label: t('guide.android.step1.label'), title: t('guide.android.step1.title'), description: t('guide.android.step1.description'), imagePlaceholder: 'Settings > Connections' },
    { id: 2, label: t('guide.android.step2.label'), title: t('guide.android.step2.title'), description: t('guide.android.step2.description'), imagePlaceholder: 'Add eSIM' },
    { id: 3, label: t('guide.android.step3.label'), title: t('guide.android.step3.title'), description: t('guide.android.step3.description'), imagePlaceholder: 'Select QR Code' },
    { id: 4, label: t('guide.android.step4.label'), title: t('guide.android.step4.title'), description: t('guide.android.step4.description'), imagePlaceholder: 'Scan QR Code' },
    { id: 5, label: t('guide.android.step5.label'), title: t('guide.android.step5.title'), description: t('guide.android.step5.description'), imagePlaceholder: 'Check Info' },
    { id: 6, label: t('guide.android.step6.label'), title: t('guide.android.step6.title'), description: t('guide.android.step6.description'), imagePlaceholder: 'Complete Setup' },
  ];

  const iosSteps: StepData[] = [
    { id: 1, label: t('guide.ios.step1.label'), title: t('guide.ios.step1.title'), description: t('guide.ios.step1.description'), imagePlaceholder: 'Settings > Cellular' },
    { id: 2, label: t('guide.ios.step2.label'), title: t('guide.ios.step2.title'), description: t('guide.ios.step2.description'), imagePlaceholder: 'Add eSIM' },
    { id: 3, label: t('guide.ios.step3.label'), title: t('guide.ios.step3.title'), description: t('guide.ios.step3.description'), imagePlaceholder: 'Select QR Code' },
    { id: 4, label: t('guide.ios.step4.label'), title: t('guide.ios.step4.title'), description: t('guide.ios.step4.description'), imagePlaceholder: 'Scan QR Code' },
    { id: 5, label: t('guide.ios.step5.label'), title: t('guide.ios.step5.title'), description: t('guide.ios.step5.description'), imagePlaceholder: 'Complete Setup' },
  ];

  const steps = activeDevice === 'android' ? androidSteps : iosSteps;
  const currentStepData = steps.find(s => s.id === currentStep) || steps[0];

  return (
    <div className="space-y-6">
      <GuideInfoCards />
      
      <DeviceToggle 
        activeDevice={activeDevice} 
        onDeviceChange={(device) => {
          setActiveDevice(device);
          setCurrentStep(1);
        }} 
      />
      
      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left: Vertical navigation */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <VerticalStepNav 
            steps={steps.map(s => ({ id: s.id, label: s.label }))}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
            title={t('guide.manual.title')}
          />
        </div>
        
        {/* Right: Current step content */}
        <GuideStep
          stepNumber={currentStepData.id}
          title={currentStepData.title}
          description={currentStepData.description}
          imageUrl={images[currentStepData.id]}
          imagePlaceholder={currentStepData.imagePlaceholder}
          totalSteps={steps.length}
        />
      </div>
    </div>
  );
}
