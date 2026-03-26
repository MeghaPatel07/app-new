export interface CartItem {
    productDocId: string;
    variantDocId?: string;
    name: string;
    image: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    vendorDocId?: string;
    variantName?: string;
    variantDetailTypes?: Record<string, string>;
}

export interface Cart {
    docId?: string;
    uid?: string;
    guestId?: string;
    items: CartItem[];
    currency: string;
    createdAt: number;
    updatedAt: number;
}

export function cartItemKey(productDocId: string, variantDocId?: string): string {
    return variantDocId ? `${productDocId}__${variantDocId}` : productDocId;
}

export class CartModelClass implements Cart {
    docId?: string;
    uid?: string;
    guestId?: string;
    items: CartItem[];
    currency: string;
    createdAt: number;
    updatedAt: number;

    constructor(data: Cart) {
        this.docId = data.docId;
        this.uid = data.uid;
        this.guestId = data.guestId;
        this.items = data.items || [];
        this.currency = data.currency || 'INR';
        this.createdAt = data.createdAt || Date.now();
        this.updatedAt = data.updatedAt || Date.now();
    }

    toJson(): Record<string, unknown> {
        return {
            uid: this.uid ?? null,
            guestId: this.guestId ?? null,
            items: this.items,
            currency: this.currency,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    static fromJson(json: Record<string, unknown>, docId?: string): CartModelClass {
        return new CartModelClass({
            docId,
            uid: (json.uid as string) || undefined,
            guestId: (json.guestId as string) || undefined,
            items: (json.items as CartItem[]) || [],
            currency: (json.currency as string) || 'INR',
            createdAt: (json.createdAt as number) || Date.now(),
            updatedAt: (json.updatedAt as number) || Date.now(),
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static fromDocSnap(snap: any): CartModelClass | null {
        if (!snap.exists()) return null;
        return CartModelClass.fromJson(snap.data() as Record<string, unknown>, snap.id);
    }
}
