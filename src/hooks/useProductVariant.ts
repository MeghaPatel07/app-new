import { useQuery } from '@tanstack/react-query';
import { VariantService } from '../services/variantService';
import type { VariantModelClass } from '../services/variantService';

/**
 * Hook to fetch the default variant for a product
 * Returns the variant with variantPrice and variantImages
 */
export function useProductVariant(productId: string | null | undefined) {
  return useQuery({
    queryKey: ['product-variant', productId],
    queryFn: async () => {
      if (!productId) return null;

      try {
        const variants = await VariantService.getVariantsByProductId(productId);
        if (variants.length === 0) return null;

        // Find the default variant, or return the first one
        const defaultVariant = variants.find(v => v.defaultt) || variants[0];
        return defaultVariant;
      } catch (error) {
        console.error('Error fetching variant for product:', productId, error);
        return null;
      }
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Extract variant data for display
 * Falls back to product data if variant is not available
 */
export function useVariantDisplayData(
  productId: string | null | undefined,
  fallbackPrice?: number,
  fallbackImages?: string[]
) {
  const { data: variant, isLoading } = useProductVariant(productId);

  const price = variant?.variantPrice ?? fallbackPrice ?? 0;
  const images = variant?.variantImages ?? fallbackImages ?? [];
  const imageUrl = images[0] ?? '';

  return {
    price,
    images,
    imageUrl,
    isLoading,
    variant,
  };
}
