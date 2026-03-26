/**
 * Vector search service: calls the findSimilarItems Cloud Function
 * to get semantically similar subcategories and products from embeddings.
 */

import { FIREBASE_PROJECT_ID } from '../firebase/config';

export interface VectorSearchResultItem {
  id: string;
  embeddingId: string;
  name: string;
  image: string | null;
  similarity: number;
  type: 'subcategory' | 'product';
}

export interface FindSimilarItemsResponse {
  query: string;
  totalResults: number;
  topResults: VectorSearchResultItem[];
  byType: {
    subcategories: VectorSearchResultItem[];
    products: VectorSearchResultItem[];
  };
}

/**
 * Call the findSimilarItems Cloud Function with the search query.
 * Returns top matching subcategories and products by cosine similarity.
 */
export async function findSimilarItems(searchQuery: string): Promise<FindSimilarItemsResponse> {
  const trimmedQuery = searchQuery.trim();

  try {
    // findSimilarItems is a Firebase Callable (onCall) function. Callables expect
    // the request body to be { data: <payload> }. The function reads request.data.searchQuery.
    const region = 'us-central1';
    const projectId = FIREBASE_PROJECT_ID || 'wedding-ease-dc99a';
    const url = `https://${region}-${projectId}.cloudfunctions.net/findSimilarItems`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: { searchQuery: trimmedQuery }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.error?.message || errorData?.error || `Search request failed with status ${response.status}`;
      throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
    }

    const json = await response.json();
    // Callable response shape is { result: <return value> }
    return json.result != null ? json.result : json;
  } catch (error) {
    console.error('Vector search error:', error);
    throw error;
  }
}
