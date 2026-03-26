export interface PointsModel {
  serviceId?: string;
  serviceName: string;
  serviceQty: number;
  serviceUnit?: string;
}

export interface PackageModel {
  docId: string;
  packageName: string;
  price: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  points: PointsModel[];
  isActive: boolean;
  isPrimary?: boolean;
  validity: number;
  packageColor: string;
  imageUrl?: string;
  thumbnailUrl?: string;
}

export interface PackageServiceModel {
  id?: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
}

export interface AddnData {
  serviceId: string;
  serviceName: string;
  qty: number;
  additionalPrice: number;
}

export interface PackageOrderModel {
  docId: string;
  packageModel: PackageModel;
  extraServices: AddnData[];
  packageAmount: number;
  extraServicesAmount: number;
  uid: string;
  selectedAddressId: string;
  username: string;
  createdAt: Date;
  isPaid: boolean;
  paidon?: Date;
  totalAmount: number;
  paidAmount: number;
}
