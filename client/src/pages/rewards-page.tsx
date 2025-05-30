import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Gift, Lock, Trophy, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/components/layout/AppLayout';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Reward = {
  id: number;
  name: string;
  description: string;
  pointsCost: number;
  category: string;
  icon: string;
  featureKey: string;
  durationDays: number | null;
  isActive: boolean;
};

type UserReward = {
  id: number;
  userId: number;
  rewardId: number;
  purchasedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  reward: Reward;
};

export default function RewardsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Query for getting all available rewards
  const { data: rewards = [], isLoading: isLoadingRewards } = useQuery<Reward[]>({
    queryKey: ['/api/rewards'],
    enabled: !!user,
  });

  // Query for getting user's purchased rewards
  const { data: userRewards = [], isLoading: isLoadingUserRewards } = useQuery<UserReward[]>({
    queryKey: ['/api/user', user?.id, 'rewards'],
    enabled: !!user,
  });

  // Query for getting user's points
  const { data: pointsData, isLoading: isLoadingPoints } = useQuery<{points: number}>({
    queryKey: ['/api/user', user?.id, 'points'],
    enabled: !!user,
  });

  // Mutation for purchasing a reward
  const purchaseMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const response = await apiRequest(
        'POST',
        `/api/user/${user?.id}/rewards/purchase/${rewardId}`
      );
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to get fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user', user?.id, 'rewards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user', user?.id, 'points'] });
      
      toast({
        title: 'Reward Purchased!',
        description: `You've successfully purchased ${selectedReward?.name}`,
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Failed to purchase reward. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handlePurchase = (reward: Reward) => {
    setSelectedReward(reward);
    setConfirmDialogOpen(true);
  };

  const confirmPurchase = () => {
    if (selectedReward) {
      purchaseMutation.mutate(selectedReward.id);
    }
    setConfirmDialogOpen(false);
  };

  const userPoints = pointsData?.points || 0;
  
  // Function to check if user already owns a reward
  const isOwned = (rewardId: number) => {
    if (!userRewards || !Array.isArray(userRewards)) return false;
    return userRewards.some((ur: UserReward) => ur.rewardId === rewardId && ur.isActive);
  };
  
  // Filter rewards by category
  const filterRewardsByCategory = (category: string) => {
    if (!rewards || !Array.isArray(rewards)) return [];
    return rewards.filter((reward: Reward) => reward.category === category);
  };

  // Get all categories
  const getCategories = () => {
    if (!rewards || !Array.isArray(rewards)) return [];
    // Create a unique array of categories
    const uniqueCategories: string[] = [];
    rewards.forEach((reward: Reward) => {
      if (!uniqueCategories.includes(reward.category)) {
        uniqueCategories.push(reward.category);
      }
    });
    return uniqueCategories;
  };

  if (isLoadingRewards || isLoadingUserRewards || isLoadingPoints) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-6">Rewards Store</h1>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Rewards Store</h1>
            <p className="text-muted-foreground">
              Use your achievement points to unlock special features and badges
            </p>
          </div>
          <div className="mt-4 md:mt-0 bg-secondary p-4 rounded-lg flex items-center">
            <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
            <div>
              <p className="text-sm font-medium">Your Points</p>
              <p className="text-2xl font-bold">{userPoints}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Rewards</TabsTrigger>
            {getCategories().map((category) => (
              <TabsTrigger key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </TabsTrigger>
            ))}
            <TabsTrigger value="owned">My Rewards</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards?.map((reward: Reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  userPoints={userPoints}
                  isOwned={isOwned(reward.id)}
                  onPurchase={handlePurchase}
                  isPurchasing={purchaseMutation.isPending && selectedReward?.id === reward.id}
                />
              ))}
            </div>
          </TabsContent>

          {getCategories().map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterRewardsByCategory(category).map((reward: Reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    userPoints={userPoints}
                    isOwned={isOwned(reward.id)}
                    onPurchase={handlePurchase}
                    isPurchasing={purchaseMutation.isPending && selectedReward?.id === reward.id}
                  />
                ))}
              </div>
            </TabsContent>
          ))}

          <TabsContent value="owned">
            {userRewards?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userRewards.map((userReward: UserReward) => (
                  <OwnedRewardCard key={userReward.id} userReward={userReward} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Gift className="w-12 h-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No rewards yet</h3>
                <p className="mt-2 text-muted-foreground">
                  You haven't purchased any rewards yet. Use your achievement points to unlock special features!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to spend {selectedReward?.pointsCost} points to purchase{' '}
              <span className="font-medium">{selectedReward?.name}</span>?
              {selectedReward?.durationDays && (
                <div className="mt-2">
                  This reward will expire after {selectedReward.durationDays} days.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPurchase}>
              Confirm Purchase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

interface RewardCardProps {
  reward: Reward;
  userPoints: number;
  isOwned: boolean;
  onPurchase: (reward: Reward) => void;
  isPurchasing: boolean;
}

function RewardCard({ reward, userPoints, isOwned, onPurchase, isPurchasing }: RewardCardProps) {
  const canAfford = userPoints >= reward.pointsCost;
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{reward.name}</CardTitle>
          <Badge variant={reward.category === 'badge' ? 'secondary' : 'outline'}>
            {reward.category}
          </Badge>
        </div>
        <CardDescription>{reward.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {!isOwned && !canAfford && (
          <div className="mt-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{userPoints}/{reward.pointsCost}</span>
            </div>
            <Progress value={(userPoints / reward.pointsCost) * 100} className="h-2" />
          </div>
        )}
        
        {reward.durationDays && (
          <p className="text-sm text-muted-foreground mt-2">
            Duration: {reward.durationDays} days
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center">
            <Trophy className="h-4 w-4 mr-1 text-yellow-500" />
            <span className="font-bold">{reward.pointsCost} points</span>
          </div>
          
          {isOwned ? (
            <Button variant="secondary" disabled className="ml-auto">
              <Check className="h-4 w-4 mr-2" />
              Owned
            </Button>
          ) : canAfford ? (
            <Button 
              onClick={() => onPurchase(reward)} 
              disabled={isPurchasing} 
              className="ml-auto"
            >
              {isPurchasing ? "Purchasing..." : "Purchase"}
            </Button>
          ) : (
            <Button variant="outline" disabled className="ml-auto">
              <Lock className="h-4 w-4 mr-2" />
              Locked
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

interface OwnedRewardCardProps {
  userReward: UserReward;
}

function OwnedRewardCard({ userReward }: OwnedRewardCardProps) {
  const purchaseDate = new Date(userReward.purchasedAt).toLocaleDateString();
  const expirationDate = userReward.expiresAt 
    ? new Date(userReward.expiresAt).toLocaleDateString() 
    : null;
  
  // Check if reward is expired
  const isExpired = userReward.expiresAt 
    ? new Date(userReward.expiresAt) < new Date() 
    : false;
  
  return (
    <Card className={`overflow-hidden transition-all ${isExpired ? 'opacity-70' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{userReward.reward.name}</CardTitle>
          <Badge variant={isExpired ? 'destructive' : 'secondary'}>
            {isExpired ? 'Expired' : 'Active'}
          </Badge>
        </div>
        <CardDescription>{userReward.reward.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-sm text-muted-foreground">
          <p>Purchased on: {purchaseDate}</p>
          {expirationDate && (
            <p className="mt-1">
              {isExpired ? 'Expired on: ' : 'Expires on: '}
              {expirationDate}
            </p>
          )}
        </div>
        
        {isExpired && (
          <div className="mt-4 flex items-center text-destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">This reward has expired</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground">
              Feature Key: {userReward.reward.featureKey}
            </span>
          </div>
          
          {!isExpired && (
            <Badge variant="outline" className="ml-auto">
              <Check className="h-4 w-4 mr-2" />
              Active
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}