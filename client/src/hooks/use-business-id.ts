import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

interface Business {
  id: number;
  userId: number;
  name: string;
  type: string;
  location: string;
  radius: number;
  createdAt: string;
}

/**
 * Custom hook to get the business ID for the current user
 * @returns The business ID of the current user's business
 */
export function useBusinessId(): number | undefined {
  const { user } = useAuth();
  
  const { data: business } = useQuery<Business>({
    queryKey: ["/api/user", user?.id, "business"],
    enabled: !!user?.id,
  });
  
  return business?.id;
}