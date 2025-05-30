import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import CampaignVisualizer from '@/components/dashboard/CampaignVisualizer';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';

export default function CampaignVisualizerPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Redirect to login if not authenticated
  if (!user) {
    setLocation("/auth");
    return null;
  }
  
  return (
    <AppLayout title="Campaign Visualizer">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <CampaignVisualizer />
      </div>
    </AppLayout>
  );
}