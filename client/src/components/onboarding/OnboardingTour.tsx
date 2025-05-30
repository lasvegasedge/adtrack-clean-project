import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, Step, STATUS, TooltipRenderProps } from 'react-joyride';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';

interface OnboardingTourProps {
  isNewUser?: boolean;
  steps: Step[];
  onComplete?: () => void;
  onSkip?: () => void;
}

export function OnboardingTour({ 
  isNewUser = false, 
  steps, 
  onComplete, 
  onSkip 
}: OnboardingTourProps) {
  const [run, setRun] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useLocalStorage('adtrack-onboarding-completed', false);
  const { toast } = useToast();

  useEffect(() => {
    // Start the tour if it's a new user or if the tour hasn't been seen yet
    if ((isNewUser || !hasSeenTour) && steps.length > 0) {
      // Small delay to ensure the UI is fully rendered
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isNewUser, hasSeenTour, steps]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    
    // Check if the tour is finished or skipped
    const isFinished = status === STATUS.FINISHED;
    const isSkipped = status === STATUS.SKIPPED;
    
    if (isFinished || isSkipped) {
      // Need to set our running state to false, so we can restart if we need to
      setRun(false);
      setHasSeenTour(true);
      
      if (isFinished && onComplete) {
        onComplete();
        toast({
          title: 'Onboarding Complete!',
          description: 'You\'ve completed the onboarding tour. You can restart it anytime from the help menu.',
        });
      }
      
      if (isSkipped && onSkip) {
        onSkip();
      }
    }
  };

  const handleStartTour = () => {
    setRun(true);
  };

  // Custom tooltip component
  const CustomTooltip = ({
    continuous,
    index,
    isLastStep,
    step,
    backProps,
    closeProps,
    primaryProps,
    skipProps,
    tooltipProps,
  }: TooltipRenderProps) => {
    return (
      <div
        {...tooltipProps}
        className="bg-white rounded-md shadow-lg p-4 max-w-xs"
        style={{ maxWidth: '350px' }}
      >
        <div className="text-sm mb-4">{step.content}</div>
        
        <div className="flex justify-between items-center">
          <div>
            {index > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mr-2"
                onClick={backProps.onClick}
              >
                Back
              </Button>
            )}
            
            {!isLastStep && (
              <Button
                variant="outline"
                size="sm"
                onClick={skipProps.onClick}
              >
                Skip
              </Button>
            )}
          </div>
          
          <Button
            variant="default"
            size="sm"
            onClick={primaryProps.onClick}
          >
            {isLastStep ? 'Finish Tour' : index === 0 ? 'Start Tour' : 'Next'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        hideCloseButton
        run={run}
        scrollToFirstStep
        showProgress
        showSkipButton
        steps={steps}
        tooltipComponent={CustomTooltip}
        styles={{
          options: {
            zIndex: 10000,
            arrowColor: '#fff',
            backgroundColor: '#fff',
            beaconSize: 36,
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
            width: 350,
          }
        }}
      />
    </>
  );
}

// We'll use the hook in use-onboarding-tour.ts instead of exporting from this file