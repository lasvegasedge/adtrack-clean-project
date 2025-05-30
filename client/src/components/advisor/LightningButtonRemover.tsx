import { useEffect } from 'react';

export function LightningButtonRemover() {
  useEffect(() => {
    // Function to remove the lightning button
    const removeLightningButton = () => {
      // Find and remove any lightning bolt buttons
      const lightningButtons = document.querySelectorAll('a.fixed, button.fixed.bg-blue-500, button.fixed.bg-blue-600');
      lightningButtons.forEach(button => {
        if (button.parentNode) {
          button.parentNode.removeChild(button);
        }
      });
    };

    // Run once on component mount
    removeLightningButton();

    // Set up an interval to continuously check and remove the button
    // as it might be dynamically added by other scripts
    const intervalId = setInterval(removeLightningButton, 500);

    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // This component doesn't render anything visible
  return null;
}

export default LightningButtonRemover;