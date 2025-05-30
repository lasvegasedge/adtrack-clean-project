import { useLocalStorage } from './use-local-storage';

export function useOnboardingTour() {
  const [hasSeenTour, setHasSeenTour] = useLocalStorage('adtrack-onboarding-completed', false);
  
  const resetTour = () => {
    setHasSeenTour(false);
  };
  
  return {
    hasSeenTour,
    resetTour
  };
}