import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';

// Define a simple default animation to use instead of importing JSON
const defaultAnimation = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { 
          a: 1, 
          k: [
            { t: 0, s: [100, 100, 100], e: [110, 110, 100] },
            { t: 30, s: [110, 110, 100], e: [100, 100, 100] },
            { t: 60, s: [100, 100, 100] }
          ] 
        }
      },
      shapes: [
        {
          ty: "el",
          d: 1,
          s: { a: 0, k: [100, 100] },
          p: { a: 0, k: [0, 0] },
          nm: "Ellipse",
          c: { a: 0, k: [0.4, 0.6, 1, 1] },
        }
      ]
    }
  ]
};

interface MarketingMascotProps {
  message?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  autoHide?: boolean;
  hideDelay?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MarketingMascot({
  message,
  position = 'bottom-right',
  autoHide = false,
  hideDelay = 5000,
  className,
  size = 'md'
}: MarketingMascotProps) {
  const [visible, setVisible] = useState(true);
  const [animation] = useState(defaultAnimation);

  useEffect(() => {
    if (autoHide && visible) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, hideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, visible, hideDelay]);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const sizeClasses = {
    'sm': 'w-20 h-20',
    'md': 'w-32 h-32',
    'lg': 'w-48 h-48'
  };

  const toggleVisibility = () => {
    setVisible(!visible);
  };

  if (!visible) {
    // Show only a small icon when hidden
    return (
      <button 
        onClick={toggleVisibility}
        className={cn(
          'fixed z-50 bg-primary text-white rounded-full p-2 shadow-lg cursor-pointer transition-all duration-300 hover:scale-110',
          positionClasses[position]
        )}
        aria-label="Show marketing assistant"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>
    );
  }

  return (
    <div 
      className={cn(
        'fixed z-50 flex items-end gap-2',
        positionClasses[position],
        className
      )}
    >
      {message && (
        <div className="bg-white border rounded-lg p-3 shadow-lg max-w-xs mb-4 relative">
          <p className="text-sm">{message}</p>
          <div className="absolute w-4 h-4 bg-white border-r border-b transform rotate-45 bottom-[-8px] right-10"></div>
        </div>
      )}
      
      <div className="relative">
        <Lottie
          animationData={animation}
          className={cn(
            'cursor-pointer',
            sizeClasses[size]
          )}
          onClick={toggleVisibility}
        />
        <button 
          onClick={toggleVisibility}
          className="absolute -top-2 -right-2 bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-300"
          aria-label="Hide marketing assistant"
        >
          <span className="sr-only">Close</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}