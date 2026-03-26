import { db, firebaseStorage as storage } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc, 
  limit,
  runTransaction
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ProductReview, ProductReviewClass } from '../models/ReviewModels';

export class ReviewService {
  private static reviewsCollection = 'reviews';

  // Submit a new review
  static async submitReview(review: Partial<ProductReview>, orderDocId?: string): Promise<string> {
    try {
      const reviewObj = new ProductReviewClass({
        ...review,
        status: 'approved', // Auto-approving for now, or use 'pending' for moderation
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const docRef = await addDoc(collection(db, this.reviewsCollection), reviewObj.toJson());

      // Link review to order if orderDocId is provided
      if (orderDocId && review.productId) {
        try {
          const orderRef = doc(db, 'orders', orderDocId);
          await updateDoc(orderRef, {
            [`reviewedProducts.${review.productId}`]: docRef.id
          });
        } catch (orderUpdateError) {
          console.error('Error updating order with review link:', orderUpdateError);
          // Don't fail the whole submission if order update fails
        }
      }

      // Update Product rating and count denormalized fields
      if (review.productId && review.rating) {
        try {
          const productRef = doc(db, 'products', review.productId);
          await runTransaction(db, async (transaction) => {
            const productDoc = await transaction.get(productRef);
            if (productDoc.exists()) {
              const data = productDoc.data();
              const oldCount = typeof data.numberOfRating === 'number' ? data.numberOfRating : 0;
              const oldAverage = typeof data.rating === 'number' ? data.rating : 0;
              const newCount = oldCount + 1;
              const newAverage = ((oldAverage * oldCount) + (review.rating || 0)) / newCount;

              transaction.update(productRef, {
                numberOfRating: newCount,
                rating: newAverage
              });
            }
          });
        } catch (productUpdateError) {
          console.error('Error updating product ratings:', productUpdateError);
        }
      }

      return docRef.id;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }

  // Upload review image
  static async uploadReviewMedia(file: File, userId: string, productId: string): Promise<string> {
    try {
      const storageRef = ref(storage, `reviews/${userId}/${productId}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading review media:', error);
      throw error;
    }
  }

  // Check if user has already reviewed this product from this order
  // Get all reviews for a user in a specific order
  static async getReviewsByOrder(userId: string, orderId: string): Promise<Record<string, ProductReview>> {
    try {
      const q = query(
        collection(db, this.reviewsCollection),
        where('userId', '==', userId),
        where('orderId', '==', orderId)
      );
      
      const snapshot = await getDocs(q);
      const reviewsMap: Record<string, ProductReview> = {};
      
      snapshot.forEach((doc) => {
        const review = ProductReviewClass.fromJson(doc.id, doc.data());
        reviewsMap[review.productId] = review;
      });
      
      return reviewsMap;
    } catch (error) {
      console.error('Error fetching reviews by order:', error);
      return {};
    }
  }

  // Get all approved reviews for a product
  static async getProductReviews(productId: string): Promise<ProductReview[]> {
    try {
      const q = query(
        collection(db, this.reviewsCollection),
        where('productId', '==', productId),
        where('status', '==', 'approved')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ProductReviewClass.fromJson(doc.id, doc.data()));
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      return [];
    }
  }

  // Get all reviews for a product
  static async getProductRatings(productId: string): Promise<{ average: number; count: number }> {
    try {
      const q = query(
        collection(db, this.reviewsCollection),
        where('productId', '==', productId),
        where('status', '==', 'approved')
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return { average: 0, count: 0 };
      
      const reviews = snapshot.docs.map(doc => doc.data());
      const totalRating = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
      
      return {
        average: totalRating / reviews.length,
        count: reviews.length
      };
    } catch (error) {
      console.error('Error getting product ratings:', error);
      return { average: 0, count: 0 };
    }
  }
}
