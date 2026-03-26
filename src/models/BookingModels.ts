import { Timestamp, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';

// TypeScript interface for BookingModel data structure (matches Dart BookingsModel exactly)
export interface BookingModel {
  docID: string;
  uId: string;
  createdAt: Date;
  createdBy: string;
  createdByDocId: string;
  teamMemberId?: string;
  stylerId?: string;
  sessionId?: string;
  messageId?: string;
  bookingDate: Date;
  bookingstartTime: Date;
  bookingendTime: Date;
  slotgap: number;
  teamsLink: string;
  event_id?: string;
  productIds: string[];
  teamMemberComment?: string;
  emailAtBooking?: string;
  fullnameAtBooking?: string;
  mobileAtBooking?: string;
  bookingComment: string;
  isCompleted: boolean;
  completedAt?: Date;
  cancelledAt?: Date;
  isCancelled: boolean;
  cancelledReason?: string;
  userRole?: string;
  isFreeConsultation?: boolean;
  packageOrderDocId?: string;
  packageName?: string;
  bookedTimezone?: string;
}

// TypeScript class implementation with methods (matches Dart BookingsModel exactly)
export class BookingModelClass implements BookingModel {
  docID: string;
  uId: string;
  createdAt: Date;
  createdBy: string;
  createdByDocId: string;
  teamMemberId?: string;
  stylerId?: string;
  sessionId?: string;
  messageId?: string;
  bookingDate: Date;
  bookingstartTime: Date;
  bookingendTime: Date;
  slotgap: number;
  teamsLink: string;
  event_id?: string;
  productIds: string[];
  teamMemberComment?: string;
  emailAtBooking?: string;
  fullnameAtBooking?: string;
  mobileAtBooking?: string;
  bookingComment: string;
  isCompleted: boolean;
  completedAt?: Date;
  cancelledAt?: Date;
  isCancelled: boolean;
  cancelledReason?: string;
  userRole?: string;
  isFreeConsultation?: boolean;
  packageOrderDocId?: string;
  packageName?: string;
  bookedTimezone?: string;

  constructor(data: Partial<BookingModel>) {
    this.docID = data.docID || '';
    this.uId = data.uId || '';
    this.createdAt = data.createdAt || new Date();
    this.createdBy = data.createdBy || '';
    this.createdByDocId = data.createdByDocId || '';
    this.teamMemberId = data.teamMemberId;
    this.stylerId = data.stylerId;
    this.sessionId = data.sessionId;
    this.messageId = data.messageId;
    this.bookingDate = data.bookingDate || new Date();
    this.bookingstartTime = data.bookingstartTime || new Date();
    this.bookingendTime = data.bookingendTime || new Date();
    this.slotgap = data.slotgap || 0;
    this.teamsLink = data.teamsLink || '';
    this.event_id = data.event_id;
    this.productIds = data.productIds || [];
    this.teamMemberComment = data.teamMemberComment;
    this.emailAtBooking = data.emailAtBooking;
    this.fullnameAtBooking = data.fullnameAtBooking;
    this.mobileAtBooking = data.mobileAtBooking;
    this.bookingComment = data.bookingComment || '';
    this.isCompleted = data.isCompleted || false;
    this.completedAt = data.completedAt;
    this.cancelledAt = data.cancelledAt;
    this.isCancelled = data.isCancelled || false;
    this.cancelledReason = data.cancelledReason;
    this.userRole = data.userRole;
    this.isFreeConsultation = data.isFreeConsultation;
    this.packageOrderDocId = data.packageOrderDocId;
    this.packageName = data.packageName;
    this.bookedTimezone = data.bookedTimezone;
  }

  /// Convert a BookingModel instance to JSON (matches Dart toJson method)
  toJson(): Record<string, any> {
    // Include ALL fields that the Dart model expects (even if null/empty)
    return {
      'docID': this.docID,
      'uId': this.uId,
      'createdAt': this.createdAt.getTime(), // Convert to epoch time
      'createdByDocId': this.createdByDocId,
      'createdBy': this.createdBy,
      'teamMemberId': this.teamMemberId || null,
      'stylerId': this.stylerId || null,
      'sessionId': this.sessionId || null,
      'messageId': this.messageId || null,
      'bookingDate': this.bookingDate.getTime(), // Convert to epoch time
      'bookingstartTime': this.bookingstartTime.getTime(), // Convert to epoch time
      'bookingendTime': this.bookingendTime.getTime(),     // Convert to epoch time
      'slotgap': this.slotgap,
      'teamsLink': this.teamsLink,
      'event_id': this.event_id || null,
      'productIds': this.productIds,
      'teamMemberComment': this.teamMemberComment || null,
      'emailAtBooking': this.emailAtBooking || null,
      'fullnameAtBooking': this.fullnameAtBooking || null,
      'mobileAtBooking': this.mobileAtBooking || null,
      'bookingComment': this.bookingComment,
      'isCompleted': this.isCompleted,
      'completedAt': this.completedAt ? this.completedAt.getTime() : null,
      'cancelledAt': this.cancelledAt ? this.cancelledAt.getTime() : null,
      'isCancelled': this.isCancelled,
      'cancelledReason': this.cancelledReason || null,
      'userRole': this.userRole || null,
      'isFreeConsultation': this.isFreeConsultation ?? false,
      'packageOrderDocId': this.packageOrderDocId || null,
      'packageName': this.packageName || null,
      'bookedTimezone': this.bookedTimezone || null,
    };
  }

  /// Create a BookingModel instance from JSON (matches Dart fromJson method)
  static fromJson(json: Record<string, any>): BookingModelClass {
    return new BookingModelClass({
      docID: json['docID'],
      uId: json['uId'],
      createdAt: new Date(json['createdAt']),
      createdBy: json['createdBy'],
      createdByDocId: json['createdByDocId'],
      teamMemberId: json['teamMemberId'],
      stylerId: json['stylerId'],
      sessionId: json['sessionId'],
      messageId: json['messageId'],
      bookingDate: new Date(json['bookingDate']),
      bookingstartTime: new Date(json['bookingstartTime']), // Convert from epoch time
      bookingendTime: new Date(json['bookingendTime']),     // Convert from epoch time
      slotgap: json['slotgap'],
      teamsLink: json['teamsLink'],
      event_id: json['event_id'],
      productIds: Array.isArray(json['productIds']) ? json['productIds'] : [],
      teamMemberComment: json['teamMemberComment'],
      bookingComment: json['bookingComment'],
      isCompleted: json['isCompleted'],
      completedAt: json['completedAt'] ? new Date(json['completedAt']) : undefined,
      cancelledAt: json['cancelledAt'] ? new Date(json['cancelledAt']) : undefined,
      isCancelled: json['isCancelled'],
      cancelledReason: json['cancelledReason'],
      emailAtBooking: json['emailAtBooking'],
      fullnameAtBooking: json['fullnameAtBooking'],
      mobileAtBooking: json['mobileAtBooking'],
      userRole: json['userRole'],
      isFreeConsultation: json['isFreeConsultation'] ?? false,
      packageOrderDocId: json['packageOrderDocId'] ?? undefined,
      packageName: json['packageName'] ?? undefined,
      bookedTimezone: json['bookedTimezone'] ?? undefined,
    });
  }

  /// Create a BookingModel instance from Firestore QueryDocumentSnapshot (matches Dart fromSnap method)
  static fromSnap(snapshot: QueryDocumentSnapshot): BookingModelClass {
    const data = snapshot.data();
    return new BookingModelClass({
      docID: snapshot.id,
      uId: data['uId'],
      createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : new Date(data['createdAt']),
      createdBy: data['createdBy'],
      createdByDocId: data['createdByDocId'],
      teamMemberId: data['teamMemberId'],
      stylerId: data['stylerId'],
      sessionId: data['sessionId'],
      messageId: data['messageId'],
      bookingDate: data['bookingDate']?.toDate ? data['bookingDate'].toDate() : new Date(data['bookingDate']),
      bookingstartTime: new Date(data['bookingstartTime']), // Convert from epoch time
      bookingendTime: new Date(data['bookingendTime']),     // Convert from epoch time
      slotgap: data['slotgap'],
      teamsLink: data['teamsLink'],
      event_id: data['event_id'],
      productIds: Array.isArray(data['productIds']) ? data['productIds'] : [],
      teamMemberComment: data['teamMemberComment'],
      bookingComment: data['bookingComment'],
      isCompleted: data['isCompleted'],
      completedAt: data['completedAt'] ? (data['completedAt']?.toDate ? data['completedAt'].toDate() : new Date(data['completedAt'])) : undefined,
      cancelledAt: data['cancelledAt'] ? (data['cancelledAt']?.toDate ? data['cancelledAt'].toDate() : new Date(data['cancelledAt'])) : undefined,
      isCancelled: data['isCancelled'],
      cancelledReason: data['cancelledReason'],
      emailAtBooking: data['emailAtBooking'],
      fullnameAtBooking: data['fullnameAtBooking'],
      mobileAtBooking: data['mobileAtBooking'],
      userRole: data['userRole'],
      isFreeConsultation: data['isFreeConsultation'] ?? false,
      packageOrderDocId: data['packageOrderDocId'] ?? undefined,
      packageName: data['packageName'] ?? undefined,
      bookedTimezone: data['bookedTimezone'] ?? undefined,
    });
  }

  /// Create a BookingModel instance from Firestore DocumentSnapshot (matches Dart fromDocSnap method)
  static fromDocSnap(snapshot: DocumentSnapshot): BookingModelClass {
    const data = snapshot.data();
    if (!data) {
      throw new Error('Document data is null');
    }

    return new BookingModelClass({
      docID: snapshot.id,
      uId: data['uId'],
      createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : new Date(data['createdAt']),
      createdBy: data['createdBy'],
      createdByDocId: data['createdByDocId'],
      teamMemberId: data['teamMemberId'],
      stylerId: data['stylerId'],
      sessionId: data['sessionId'],
      messageId: data['messageId'],
      bookingDate: data['bookingDate']?.toDate ? data['bookingDate'].toDate() : new Date(data['bookingDate']),
      bookingstartTime: new Date(data['bookingstartTime']), // Convert from epoch time
      bookingendTime: new Date(data['bookingendTime']),     // Convert from epoch time
      slotgap: data['slotgap'],
      teamsLink: data['teamsLink'],
      event_id: data['event_id'],
      productIds: Array.isArray(data['productIds']) ? data['productIds'] : [],
      teamMemberComment: data['teamMemberComment'],
      bookingComment: data['bookingComment'],
      isCompleted: data['isCompleted'],
      completedAt: data['completedAt'] ? (data['completedAt']?.toDate ? data['completedAt'].toDate() : new Date(data['completedAt'])) : undefined,
      cancelledAt: data['cancelledAt'] ? (data['cancelledAt']?.toDate ? data['cancelledAt'].toDate() : new Date(data['cancelledAt'])) : undefined,
      isCancelled: data['isCancelled'],
      cancelledReason: data['cancelledReason'],
      emailAtBooking: data['emailAtBooking'],
      fullnameAtBooking: data['fullnameAtBooking'],
      mobileAtBooking: data['mobileAtBooking'],
      userRole: data['userRole'],
      isFreeConsultation: data['isFreeConsultation'] ?? false,
      packageOrderDocId: data['packageOrderDocId'] ?? undefined,
      packageName: data['packageName'] ?? undefined,
      bookedTimezone: data['bookedTimezone'] ?? undefined,
    });
  }
}

// TypeScript interface for BlockedSlotModel (matches Dart BlockedSlotModel exactly)
export interface BlockedSlotModel {
  docId: string;
  dateBlock: boolean;
  blockedDateTime: Date;
  createdAt: Date;
  slotGap: number;
}

// TypeScript class implementation for BlockedSlotModel (matches Dart BlockedSlotModel exactly)
export class BlockedSlotModelClass implements BlockedSlotModel {
  docId: string;
  dateBlock: boolean;
  blockedDateTime: Date;
  createdAt: Date;
  slotGap: number;

  constructor(data: Partial<BlockedSlotModel>) {
    this.docId = data.docId || '';
    this.dateBlock = data.dateBlock || false;
    this.blockedDateTime = data.blockedDateTime || new Date();
    this.createdAt = data.createdAt || new Date();
    this.slotGap = data.slotGap || 0;
  }

  /// Create a BlockedSlotModel instance from Firestore QueryDocumentSnapshot (matches Dart fromSnap method)
  static fromSnap(snapshot: QueryDocumentSnapshot): BlockedSlotModelClass {
    const data = snapshot.data();
    return new BlockedSlotModelClass({
      docId: snapshot.id,
      blockedDateTime: data['blockedDateTime']?.toDate ? data['blockedDateTime'].toDate() : new Date(data['blockedDateTime']),
      createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : new Date(data['createdAt']),
      dateBlock: data['dateBlock'],
      slotGap: data['slotGap'],
    });
  }
}
