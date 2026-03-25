import { useAuthStore } from '../store/authStore';

export const useAccess = () => {
  const { role, profile } = useAuthStore();

  const isGuest = role === 'guest';
  const isStylist = role === 'stylist';
  // packageId is a Firestore document ID (e.g. 'pkg_premium_bridal'), not the string 'premium'
  const isPremium = role === 'client' && !!profile?.packageId;
  const isFree = role === 'client' && !profile?.packageId;

  return {
    isGuest,
    isFree,
    isPremium,
    isStylist,
    canChat: !isGuest,
    canEaseBot: isPremium || isStylist,
    canBook: !isGuest,
  };
};
