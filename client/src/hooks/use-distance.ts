// Haversine formula to calculate distance between two coordinates in miles
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Hook to filter businesses by distance
export function useDistanceFilter(businesses: any[], userLat: number, userLon: number, radiusMiles: number = 3) {
  if (!businesses || !userLat || !userLon) return [];
  
  return businesses.filter(business => {
    if (!business.latitude || !business.longitude) return false;
    
    const distance = calculateDistance(
      userLat, 
      userLon, 
      business.latitude, 
      business.longitude
    );
    
    return distance <= radiusMiles;
  });
}
