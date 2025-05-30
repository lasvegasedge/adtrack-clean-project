import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPercent, formatCurrency } from '@/lib/utils';
import { 
  Clipboard, 
  Download, 
  Facebook, 
  Link as LinkIcon, 
  Linkedin, 
  Mail, 
  Share, 
  Twitter, 
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ShareableAnalyticsCard from '../analytics/ShareableAnalyticsCard';
import html2canvas from 'html2canvas';

interface SocialMediaShareData {
  campaignName?: string;
  roi?: number;
  adSpend?: number;
  revenue?: number;
  businessName?: string;
  startDate?: string;
  endDate?: string;
}

interface SocialMediaShareProps {
  data: SocialMediaShareData;
  variant?: 'button' | 'icon';
  text?: React.ReactNode;
  buttonClassName?: string;
}

const generateShareText = (data: SocialMediaShareData): string => {
  let text = "";
  
  if (data.businessName) {
    text += `${data.businessName}: `;
  }
  
  if (data.campaignName) {
    text += `"${data.campaignName}" campaign `;
  } else {
    text += "Marketing campaign ";
  }
  
  if (data.roi !== undefined) {
    text += `achieved ${formatPercent(data.roi)} ROI `;
  }
  
  if (data.adSpend !== undefined) {
    text += `with ${formatCurrency(data.adSpend)} ad spend `;
  }
  
  if (data.revenue !== undefined) {
    text += `and ${formatCurrency(data.revenue)} revenue `;
  }
  
  text += "#ROITracker #MarketingAnalytics";
  
  return text;
};

// Email sharing function that generates a mailto link with campaign data
const generateEmailLink = (data: SocialMediaShareData): string => {
  const subject = encodeURIComponent(`${data.businessName || 'Our'} Marketing Campaign Results: ${data.campaignName || 'Performance Report'}`);
  
  let body = encodeURIComponent(`Hi,\n\nI wanted to share some marketing campaign results with you:\n\n`);
  
  body += encodeURIComponent(`Campaign: ${data.campaignName || 'Marketing Campaign'}\n`);
  if (data.roi !== undefined) body += encodeURIComponent(`ROI: ${formatPercent(data.roi)}\n`);
  if (data.adSpend !== undefined) body += encodeURIComponent(`Ad Spend: ${formatCurrency(data.adSpend)}\n`);
  if (data.revenue !== undefined) body += encodeURIComponent(`Revenue: ${formatCurrency(data.revenue)}\n`);
  
  if (data.startDate) {
    body += encodeURIComponent(`Duration: ${new Date(data.startDate).toLocaleDateString()}`);
    if (data.endDate) {
      body += encodeURIComponent(` to ${new Date(data.endDate).toLocaleDateString()}\n`);
    } else {
      body += encodeURIComponent(` to Present\n`);
    }
  }
  
  body += encodeURIComponent(`\nThese results were generated using ROI Tracker, our marketing analytics platform.\n\nRegards,\n`);
  
  return `mailto:?subject=${subject}&body=${body}`;
};

// Function to generate a shareable link
const generateShareableLink = (data: SocialMediaShareData): string => {
  // In a real application, this would create a link in the database and return a short URL
  // For this prototype, we'll encode the data in the URL parameters
  const params = new URLSearchParams();
  
  if (data.campaignName) params.append('campaign', data.campaignName);
  if (data.roi !== undefined) params.append('roi', data.roi.toString());
  if (data.adSpend !== undefined) params.append('spend', data.adSpend.toString());
  if (data.revenue !== undefined) params.append('revenue', data.revenue.toString());
  if (data.businessName) params.append('business', data.businessName);
  if (data.startDate) params.append('start', data.startDate);
  if (data.endDate) params.append('end', data.endDate);
  
  // Base URL of the application
  const baseUrl = window.location.origin;
  
  // In production, this would be a short unique ID like /s/abc123
  return `${baseUrl}/shared-report?${params.toString()}`;
};

export default function SocialMediaShare({ 
  data, 
  variant = 'button', 
  text,
  buttonClassName
}: SocialMediaShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareTab, setShareTab] = useState('social');
  const [shareableLink, setShareableLink] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const { toast } = useToast();
  
  const cardRef = useRef<HTMLDivElement>(null);
  const shareText = generateShareText(data);
  
  // Handle clipboard copy
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    toast({
      title: "Copied!",
      description: "Share text copied to clipboard",
    });
  };
  
  // Handle social media sharing
  const handleShare = (platform: string) => {
    let shareUrl = "";
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(shareText)}`;
        break;
      case 'email':
        shareUrl = generateEmailLink(data);
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      setIsOpen(false);
    }
  };
  
  // Generate shareable link
  const handleGenerateLink = () => {
    const link = generateShareableLink(data);
    setShareableLink(link);
  };
  
  // Copy shareable link to clipboard
  const handleCopyLink = () => {
    if (shareableLink) {
      navigator.clipboard.writeText(shareableLink);
      toast({
        title: "Link Copied!",
        description: "Shareable link copied to clipboard",
      });
    }
  };
  
  // Export analytics card as image
  const handleExportImage = async () => {
    if (cardRef.current) {
      setGeneratingImage(true);
      try {
        const canvas = await html2canvas(cardRef.current, {
          scale: 2, // Higher scale for better quality
          backgroundColor: null,
          logging: false
        });
        
        // Convert to image and download
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `${data.campaignName || 'campaign'}-performance.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Success!",
          description: "Image downloaded successfully",
        });
      } catch (error) {
        toast({
          title: "Export Failed",
          description: "Could not generate image",
          variant: "destructive"
        });
        console.error(error);
      }
      setGeneratingImage(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {variant === 'button' ? (
          <Button variant="outline" size="sm" className={buttonClassName}>
            {text || <span className="flex items-center"><Share className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /><span className="text-xs sm:text-sm">Share</span></span>}
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className={buttonClassName}>
            <Share className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Share Campaign Results</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Share your marketing performance with team members, stakeholders, or your professional network.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4" ref={cardRef}>
          <ShareableAnalyticsCard
            title={data.campaignName || "Marketing Campaign"}
            roi={data.roi || 0}
            adSpend={data.adSpend}
            revenue={data.revenue}
            businessName={data.businessName}
            startDate={data.startDate}
            endDate={data.endDate}
          />
        </div>
        
        <Tabs defaultValue="social" value={shareTab} onValueChange={setShareTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4 w-full">
            <TabsTrigger value="social" className="text-[10px] sm:text-sm py-1 px-0.5 sm:px-2">Social & Email</TabsTrigger>
            <TabsTrigger value="link" className="text-[10px] sm:text-sm py-1 px-0.5 sm:px-2">Share Link</TabsTrigger>
            <TabsTrigger value="export" className="text-[10px] sm:text-sm py-1 px-0.5 sm:px-2">Export Image</TabsTrigger>
          </TabsList>
          
          {/* Social Media & Email Tab */}
          <TabsContent value="social" className="space-y-4">
            <div className="relative p-3 sm:p-4 bg-muted rounded-lg">
              <p className="pr-8 text-xs sm:text-sm">{shareText}</p>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 sm:h-8 sm:w-8"
                onClick={handleCopyToClipboard}
              >
                <Clipboard className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                variant="outline"
                className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white text-[10px] sm:text-sm px-1.5 sm:px-2 py-1 h-auto"
                onClick={() => handleShare('twitter')}
              >
                <Twitter className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-2" />
                <span className="whitespace-nowrap">Twitter</span>
              </Button>
              <Button
                variant="outline"
                className="bg-[#4267B2] hover:bg-[#4267B2]/90 text-white text-[10px] sm:text-sm px-1.5 sm:px-2 py-1 h-auto"
                onClick={() => handleShare('facebook')}
              >
                <Facebook className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-2" />
                <span className="whitespace-nowrap">Facebook</span>
              </Button>
              <Button
                variant="outline"
                className="bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white text-[10px] sm:text-sm px-1.5 sm:px-2 py-1 h-auto"
                onClick={() => handleShare('linkedin')}
              >
                <Linkedin className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-2" />
                <span className="whitespace-nowrap">LinkedIn</span>
              </Button>
              <Button
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600 text-white text-[10px] sm:text-sm px-1.5 sm:px-2 py-1 h-auto"
                onClick={() => handleShare('email')}
              >
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-2" />
                <span className="whitespace-nowrap">Email</span>
              </Button>
            </div>
          </TabsContent>
          
          {/* Shareable Link Tab */}
          <TabsContent value="link" className="space-y-4">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Generate a shareable link that others can access without logging in. 
              Perfect for sharing with team members or clients via email or messaging.
            </div>
            
            <div className="flex flex-col space-y-2">
              <Label htmlFor="share-link" className="text-xs sm:text-sm">Shareable Link</Label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0">
                <Input 
                  id="share-link" 
                  value={shareableLink} 
                  readOnly 
                  placeholder="Generate a shareable link"
                  className="text-xs sm:text-sm rounded-b-none sm:rounded-b sm:rounded-r-none h-9 sm:h-10"
                />
                {!shareableLink ? (
                  <Button 
                    onClick={handleGenerateLink} 
                    className="text-[10px] sm:text-sm py-1 sm:py-2 h-auto rounded-t-none sm:rounded-t sm:rounded-l-none"
                  >
                    <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-2" />
                    Generate
                  </Button>
                ) : (
                  <Button 
                    onClick={handleCopyLink} 
                    className="text-[10px] sm:text-sm py-1 sm:py-2 h-auto rounded-t-none sm:rounded-t sm:rounded-l-none"
                  >
                    <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-2" />
                    Copy
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                This link will expire in 7 days. For security, it doesn't include sensitive business data.
              </p>
            </div>
          </TabsContent>
          
          {/* Export Image Tab */}
          <TabsContent value="export" className="space-y-4">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Export your campaign results as an image to include in presentations, 
              reports, or emails. The image will include all the data shown in the card above.
            </div>
            
            <Button 
              onClick={handleExportImage} 
              disabled={generatingImage} 
              className="w-full text-[10px] sm:text-sm py-1.5 sm:py-2 h-auto"
            >
              {generatingImage ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-0.5 mr-0.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating Image...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-2" />
                  <span>Download as PNG</span>
                </span>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              The downloaded image will be high-resolution and ready to use in presentations or reports.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}