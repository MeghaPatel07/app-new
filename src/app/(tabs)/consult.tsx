import React, { useState, useEffect, useRef } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ISD_CODES, type ISDCode, validatePhoneLength, phoneLengthHint } from '../../constants/isdCodes';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, firebaseFunctions } from '../../firebase/config';
import { useAccess } from '../../hooks/useAccess';
import { useAuthStore } from '../../store/authStore';
import { getActivePackages } from '../../services/packageService';
import { Icon } from '../../components/primitives/Icon';
import { ConsultCard, type ConsultSession } from '../../components/shared/ConsultCard';
import type { Package } from '../../types';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';
import { api } from '../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  role:             string;
  firstName:        string;
  lastName:         string;
  email:            string;
  phone:            string;
  timezone:         string;
  consultationDate: Date | null;
  timeSlot:         string;   // stored as IST
  message:          string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLES = ['Bride', 'Groom', 'Friend', 'Family member', 'Other'];

const TIMEZONES = [
  { label: 'India (IST, UTC+5:30)',               tz: 'Asia/Kolkata'          },
  { label: 'UAE / Dubai (GST, UTC+4)',             tz: 'Asia/Dubai'            },
  { label: 'Saudi Arabia (AST, UTC+3)',            tz: 'Asia/Riyadh'           },
  { label: 'Pakistan (PKT, UTC+5)',                tz: 'Asia/Karachi'          },
  { label: 'Bangladesh (BST, UTC+6)',              tz: 'Asia/Dhaka'            },
  { label: 'Sri Lanka (SLST, UTC+5:30)',           tz: 'Asia/Colombo'          },
  { label: 'Nepal (NPT, UTC+5:45)',                tz: 'Asia/Kathmandu'        },
  { label: 'Singapore (SGT, UTC+8)',               tz: 'Asia/Singapore'        },
  { label: 'Malaysia (MYT, UTC+8)',                tz: 'Asia/Kuala_Lumpur'     },
  { label: 'Hong Kong (HKT, UTC+8)',               tz: 'Asia/Hong_Kong'        },
  { label: 'Japan / Korea (JST, UTC+9)',           tz: 'Asia/Tokyo'            },
  { label: 'UK (GMT/BST)',                         tz: 'Europe/London'         },
  { label: 'Germany / France / Italy (CET/CEST)', tz: 'Europe/Paris'          },
  { label: 'South Africa (SAST, UTC+2)',           tz: 'Africa/Johannesburg'   },
  { label: 'USA — Eastern (EST/EDT)',              tz: 'America/New_York'      },
  { label: 'USA — Central (CST/CDT)',              tz: 'America/Chicago'       },
  { label: 'USA — Mountain (MST/MDT)',             tz: 'America/Denver'        },
  { label: 'USA — Pacific (PST/PDT)',              tz: 'America/Los_Angeles'   },
  { label: 'Canada — Toronto (EST/EDT)',           tz: 'America/Toronto'       },
  { label: 'Canada — Vancouver (PST/PDT)',         tz: 'America/Vancouver'     },
  { label: 'Australia — Sydney (AEDT/AEST)',       tz: 'Australia/Sydney'      },
  { label: 'Australia — Melbourne (AEDT/AEST)',    tz: 'Australia/Melbourne'   },
  { label: 'Australia — Perth (AWST, UTC+8)',      tz: 'Australia/Perth'       },
  { label: 'New Zealand (NZST/NZDT)',              tz: 'Pacific/Auckland'      },
];

const DEFAULT_TIME_SLOTS = [
  '7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM',
  '1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM',
];

const WHAT_HAPPENS = [
  '1 on 1 session with professional stylist',
  '10 free chat session with our eaase bot',
  'Understand your wedding plans and preferences',
  'Get guidance for your wedding shopping journey',
  'Explore curated options from trusted vendors',
  'Ask questions and receive expert advice',
];

// ── Validation ────────────────────────────────────────────────────────────────

interface FormErrors {
  role?:             string;
  firstName?:        string;
  lastName?:         string;
  email?:            string;
  phone?:            string;
  consultationDate?: string;
  timeSlot?:         string;
}

const NAME_REGEX = /^[a-zA-Z\s\-'.]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(formData: FormData, isd: ISDCode): FormErrors {
  const e: FormErrors = {};

  if (!formData.role.trim()) {
    e.role = 'Please select your role';
  }

  if (!formData.firstName.trim()) {
    e.firstName = 'First name is required';
  } else if (formData.firstName.trim().length < 2) {
    e.firstName = 'First name must be at least 2 characters';
  } else if (!NAME_REGEX.test(formData.firstName.trim())) {
    e.firstName = 'Only letters, spaces and hyphens allowed';
  }

  if (!formData.lastName.trim()) {
    e.lastName = 'Last name is required';
  } else if (formData.lastName.trim().length < 2) {
    e.lastName = 'Last name must be at least 2 characters';
  } else if (!NAME_REGEX.test(formData.lastName.trim())) {
    e.lastName = 'Only letters, spaces and hyphens allowed';
  }

  if (!formData.email.trim()) {
    e.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(formData.email.trim())) {
    e.email = 'Enter a valid email address (e.g. name@example.com)';
  }

  // Phone is optional — only validate length if a value is entered
  const digits = formData.phone.trim().replace(/\D/g, '');
  const phoneErr = validatePhoneLength(digits, isd);
  if (phoneErr) e.phone = phoneErr;

  if (!formData.consultationDate) {
    e.consultationDate = 'Please select a consultation date';
  }

  if (!formData.timeSlot) {
    e.timeSlot = 'Please select a time slot';
  }

  return e;
}

// ── Helper: convert IST slot string to target timezone ────────────────────────

function convertISTSlot(istSlot: string, targetTz: string): string {
  const [timePart, period] = istSlot.split(' ');
  const [hoursStr, minutesStr] = (timePart || '').split(':');
  let hour = parseInt(hoursStr || '0', 10);
  const minutes = parseInt(minutesStr || '0', 10);
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  const istOffsetMinutes = 5 * 60 + 30;
  const totalUTCMinutes = hour * 60 + minutes - istOffsetMinutes;

  const now = new Date();
  const utcDate = new Date(Date.UTC(
    now.getFullYear(), now.getMonth(), now.getDate(),
    Math.floor(((totalUTCMinutes % (24 * 60)) + 24 * 60) % (24 * 60) / 60),
    ((totalUTCMinutes % 60) + 60) % 60,
  ));

  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: targetTz,
    }).format(utcDate);
  } catch {
    return istSlot;
  }
}

// ── Helper: compute booking start/end times ───────────────────────────────────

function getBookingTimes(formData: FormData) {
  if (!formData.consultationDate || !formData.timeSlot) return null;
  const selectedDate = new Date(formData.consultationDate);
  const [timePart, period] = formData.timeSlot.split(' ');
  const [hoursStr, minutesStr] = (timePart || '').split(':');
  let hour = parseInt(hoursStr || '0', 10);
  const minutes = parseInt(minutesStr || '0', 10);
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  const start = new Date(selectedDate);
  start.setHours(hour, minutes, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { selectedDate, bookingStartTime: start, bookingEndTime: end };
}

// ── Firebase service functions (matching web's BookingService / UserService) ──

/**
 * Check duplicate via the backend API — same endpoint the old flow used.
 * The backend queries bookings (emailAtBooking + isFreeConsultation) AND
 * users (isfree_cons_used flag) so a single call covers both paths.
 * Returns { alreadyBooked, matchType } or null on network error.
 */
async function checkDuplicateViaApi(
  email: string,
  fullPhone?: string,
): Promise<{ alreadyBooked: boolean; matchType?: 'email' | 'phone' } | null> {
  try {
    const res = await api.get('/consultations/check-free', {
      params: { email, ...(fullPhone ? { phone: fullPhone } : {}) },
    });
    return res.data ?? null;
  } catch {
    // Network/server error — fall back to a direct Firestore single-field query
    // (single where clause requires no composite index)
    try {
      const q = query(
        collection(db, 'bookings'),
        where('emailAtBooking', '==', email),
      );
      const snap = await getDocs(q);
      const hasFree = snap.docs.some(d => d.data().isFreeConsultation === true);
      if (hasFree) return { alreadyBooked: true, matchType: 'email' };
    } catch { /* ignore */ }
    return null;
  }
}

/** Resolve an existing user record by email or full phone (with ISD prefix). */
async function findUserByEmailOrPhone(
  email: string,
  fullPhone: string,
): Promise<{ userId: string; userData: any; matchType: 'email' | 'phone' } | null> {
  try {
    if (email) {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { userId: d.id, userData: d.data(), matchType: 'email' };
      }
    }
    if (fullPhone) {
      // Try full number (+919876543210) and digits-only (9876543210)
      for (const phoneVariant of [fullPhone, fullPhone.replace(/^\+\d{1,4}/, '')]) {
        const q = query(collection(db, 'users'), where('phone', '==', phoneVariant));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          return { userId: d.id, userData: d.data(), matchType: 'phone' };
        }
      }
    }
    return null;
  } catch { return null; }
}

async function getRandomConsultant(): Promise<{ docId: string } | null> {
  try {
    const snap = await getDocs(collection(db, 'team'));
    if (snap.empty) return null;
    const docs = snap.docs;
    const random = docs[Math.floor(Math.random() * docs.length)];
    return { docId: random.id };
  } catch { return null; }
}

async function createBookingDoc(payload: any): Promise<string> {
  const ref = await addDoc(collection(db, 'bookings'), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

async function buildBookingPayload(formData: FormData, userId: string | null) {
  const times = getBookingTimes(formData);
  if (!times) return null;
  const { selectedDate, bookingStartTime, bookingEndTime } = times;

  let consultantDocId = '';
  try {
    const consultant = await getRandomConsultant();
    if (consultant) consultantDocId = consultant.docId;
  } catch { /* optional */ }

  const fullName = `${formData.firstName} ${formData.lastName}`.trim();
  return {
    uId:               userId || '',
    createdBy:         userId || '',
    createdByDocId:    userId || '',
    teamMemberId:      consultantDocId,
    bookingDate:       selectedDate.getTime(),
    bookingstartTime:  bookingStartTime.getTime(),
    bookingendTime:    bookingEndTime.getTime(),
    slotgap:           60,
    teamsLink:         '',
    productIds:        [],
    teamMemberComment: 'Free consultation booked via free consultation page',
    emailAtBooking:    formData.email || '',
    fullnameAtBooking: fullName || '',
    mobileAtBooking:   formData.phone || '',
    bookingComment:    `Free consultation.${formData.message ? ` Message: ${formData.message}` : ''}`,
    isFreeConsultation: true,
    userRole:          formData.role,
    isCompleted:       false,
    isCancelled:       false,
    bookedTimezone:    formData.timezone,
  };
}

// ── Google Meet Cloud Function (non-blocking) ─────────────────────────────────

async function createGoogleMeetAndUpdate(params: {
  customerName:  string;
  customerEmail: string;
  startTime:     Date;
  endTime:       Date;
  bookingDocId:  string;
}) {
  try {
    const createMeet = httpsCallable(firebaseFunctions, 'createGoogleMeet');
    const freeBookingId = `FREE-${Math.floor(100000 + Math.random() * 900000)}`;
    const result: any = await createMeet({
      summary:              `Free Consultation — ${params.customerName}`,
      description:          'WeddingEase complimentary 1-hour styling consultation',
      startTime:            params.startTime.toISOString(),
      endTime:              params.endTime.toISOString(),
      userEmail:            params.customerEmail,
      attendees:            ['sameerali9340@gmail.com', 'teammetadc@gmail.com'],
      forFreeconsultation:  true,
      customerName:         params.customerName,
      bookingId:            freeBookingId,
      savebookingdocid:     params.bookingDocId,
    });

    const meetLink = result.data?.meetLink || '';
    const eventId  = result.data?.eventId  || '';

    if (params.bookingDocId && meetLink) {
      await updateDoc(doc(db, 'bookings', params.bookingDocId), {
        teamsLink: meetLink,
        event_id:  eventId,
        bookingId: freeBookingId,
      });
    }
  } catch (e) {
    // Non-blocking — failure does not prevent success screen
    console.warn('[FreeConsultation] Google Meet creation failed (non-blocking):', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Root tab component
// ─────────────────────────────────────────────────────────────────────────────

export default function ConsultTab() {
  const { isPremium } = useAccess();
  if (isPremium) return <PremiumConsultView />;
  return <GuestFreeView />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Premium view
// ─────────────────────────────────────────────────────────────────────────────

function PremiumConsultView() {
  const router = useRouter();
  const { accent } = useAccess();

  const isLoading = false;
  const sessions: ConsultSession[] = [
    { id: '1', stylistName: 'Aisha Patel', date: '30 Mar 2026', time: '10:00 AM', type: 'paid', status: 'upcoming' },
    { id: '2', stylistName: 'Aisha Patel', date: '20 Mar 2026', time: '2:00 PM',  type: 'paid', status: 'past'     },
  ];
  const upcoming = sessions.filter(s => s.status === 'upcoming');
  const past     = sessions.filter(s => s.status === 'past');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
      <ScrollView contentContainerStyle={styles.premiumContent} showsVerticalScrollIndicator={false}>
        <View style={styles.premiumHeader}>
          <Text style={styles.premiumHeaderTitle}>My Consultations</Text>
          <TouchableOpacity
            style={[styles.bookBtn, { backgroundColor: accent }]}
            onPress={() => router.push('/screens/consult/book-session' as any)}
            accessibilityRole="button"
            testID="book-session-btn"
          >
            <Icon name="plus" size={16} color={T.white} />
            <Text style={styles.bookBtnText}>Book Session</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Upcoming</Text>
        {isLoading ? (
          <ActivityIndicator color={accent} style={{ marginVertical: 20 }} />
        ) : upcoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="calendar" size={32} color={T.muted} />
            <Text style={styles.emptyText}>No upcoming sessions</Text>
          </View>
        ) : upcoming.map(s => (
          <ConsultCard key={s.id} session={s}
            onPress={() => router.push(`/screens/consult/detail?sessionId=${s.id}` as any)}
            style={{ marginBottom: 10 }} testID={`consult-card-${s.id}`} />
        ))}

        {past.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Recent</Text>
            {past.map(s => (
              <ConsultCard key={s.id} session={s}
                onPress={() => router.push(`/screens/session/complete?sessionId=${s.id}` as any)}
                style={{ marginBottom: 10 }} testID={`consult-past-${s.id}`} />
            ))}
          </>
        )}

        <TouchableOpacity style={styles.historyLink}
          onPress={() => router.push('/screens/session/history' as any)}
          accessibilityRole="button">
          <Text style={[styles.historyLinkText, { color: accent }]}>View Full History</Text>
          <Icon name="chevronRight" size={16} color={accent} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Guest/Free landing — two-card layout
// ─────────────────────────────────────────────────────────────────────────────

function GuestFreeView() {
  const router = useRouter();
  const [showForm, setShowForm]       = useState(false);
  const [packages, setPackages]       = useState<Package[]>([]);
  const [pkgsLoading, setPkgsLoading] = useState(true);

  useEffect(() => {
    getActivePackages().then(setPackages).catch(() => setPackages([])).finally(() => setPkgsLoading(false));
  }, []);

  if (showForm) return <FreeConsultForm onBack={() => setShowForm(false)} />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
      <ScrollView contentContainerStyle={styles.landingScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.landingHeading}>Consultations</Text>
        <Text style={styles.landingSubheading}>Style your perfect wedding look with expert guidance.</Text>

        {/* Free consultation card */}
        <View style={styles.freeCard}>
          <View style={styles.freeCardHeader}>
            <View style={styles.freeCardIconWrap}><Text style={styles.freeCardIcon}>🗓️</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.freeCardTitle}>Book a Free Consultation</Text>
              <Text style={styles.freeCardSub}>30-min video call with a dedicated wedding stylist</Text>
            </View>
          </View>
          <View style={styles.freeFeatureList}>
            {['Expert styling advice', 'Personalised look inspiration', 'No commitment required'].map(f => (
              <View key={f} style={styles.freeFeatureRow}>
                <View style={styles.freeFeatureCheck}><Icon name="check" size={11} color={T.white} /></View>
                <Text style={styles.freeFeatureText}>{f}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.freeCardBtn} onPress={() => setShowForm(true)}
            activeOpacity={0.85} accessibilityRole="button" testID="book-free-session-button">
            <Text style={styles.freeCardBtnText}>Book My Free Session</Text>
          </TouchableOpacity>
        </View>

        {/* Packages */}
        <Text style={styles.packagesLabel}>PREMIUM PACKAGES</Text>
        <Text style={styles.packagesSubLabel}>Unlock unlimited sessions and a dedicated stylist.</Text>
        {pkgsLoading ? (
          <ActivityIndicator color={T.gold} style={{ marginVertical: 24 }} />
        ) : packages.length === 0 ? (
          <View style={[styles.emptyCard, { marginTop: 8 }]}><Text style={styles.emptyText}>No packages available</Text></View>
        ) : packages.map(pkg => (
          <PackageRow key={pkg.id} pkg={pkg}
            onPress={() => router.push({ pathname: '/screens/packages/detail', params: { packageId: pkg.id } } as any)} />
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PackageRow({ pkg, onPress }: { pkg: Package; onPress: () => void }) {
  const subtitle = pkg.points.slice(0, 2)
    .map(p => p.serviceQty > 0 ? `${p.serviceQty} ${p.serviceUnit ?? ''} ${p.serviceName}`.trim() : p.serviceName)
    .join(' · ');
  return (
    <TouchableOpacity style={styles.pkgRow} onPress={onPress} activeOpacity={0.8}
      accessibilityRole="button" testID={`pkg-row-${pkg.id}`}>
      <View style={{ flex: 1 }}>
        <View style={styles.pkgRowTop}>
          <Text style={styles.pkgRowName}>{pkg.packageName}</Text>
          {pkg.isPrimary && <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>POPULAR</Text></View>}
        </View>
        {subtitle ? <Text style={styles.pkgRowSub} numberOfLines={1}>{subtitle}</Text> : null}
        <Text style={styles.pkgRowPrice}>{'\u20B9'}{pkg.price.toLocaleString('en-IN')}</Text>
      </View>
      <Icon name="chevron-right" size={18} color={T.dim} />
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Free Consultation Form — mirrors FreeConsultation.tsx exactly
// ─────────────────────────────────────────────────────────────────────────────

function FreeConsultForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const { isGuest, accent } = useAccess();
  const { user, profile } = useAuthStore();

  // Detect default timezone
  const browserTz   = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const defaultTz   = TIMEZONES.find(t => t.tz === browserTz)?.tz || 'Asia/Kolkata';

  const [formData, setFormData] = useState<FormData>({
    role:             '',
    firstName:        '',
    lastName:         '',
    email:            '',
    phone:            '',
    timezone:         defaultTz,
    consultationDate: null,
    timeSlot:         '',
    message:          '',
  });

  // Pre-fill from logged-in user (mirrors web's useEffect)
  useEffect(() => {
    if (!user) return;
    setFormData(prev => ({
      ...prev,
      email:     profile?.email ?? user.email ?? '',
      firstName: (profile?.name || user.displayName || '').split(' ')[0] || '',
      lastName:  (profile?.name || user.displayName || '').split(' ').slice(1).join(' ') || '',
      phone:     profile?.phone ?? '',
    }));
  }, [user, profile]);

  const [isSubmitting, setIsSubmitting]           = useState(false);
  const submittingRef                             = useRef(false);
  const [timeSlots, setTimeSlots]                 = useState<string[]>(DEFAULT_TIME_SLOTS);
  const [slotsLoading, setSlotsLoading]           = useState(true);
  const [formErrors, setFormErrors]               = useState<FormErrors>({});

  // ISD code for phone (default: India +91)
  const [selectedISD, setSelectedISD]     = useState<ISDCode>(ISD_CODES[0]);
  const [isdModalOpen, setIsdModalOpen]   = useState(false);
  const [isdSearch, setIsdSearch]         = useState('');

  // Modals
  const [timezoneModalOpen, setTimezoneModalOpen] = useState(false);
  const [timezoneSearch, setTimezoneSearch]       = useState('');
  const [slotModalOpen, setSlotModalOpen]         = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Result states
  const [showAlreadyUsedModal, setShowAlreadyUsedModal] = useState(false);
  const [alreadyUsedMessage,   setAlreadyUsedMessage]   = useState('');
  const [showSuccess,          setShowSuccess]           = useState(false);
  const [bookedDate,           setBookedDate]            = useState<Date | null>(null);
  const [bookedSlot,           setBookedSlot]            = useState('');

  // Load time slots from backend
  useEffect(() => {
    api.get('/consultations/free-slots')
      .then(res => {
        const data: string[] = (res.data.slots ?? []).map((s: any) => s.label ?? s.time ?? s);
        setTimeSlots(data.length > 0 ? data : DEFAULT_TIME_SLOTS);
      })
      .catch(() => setTimeSlots(DEFAULT_TIME_SLOTS))
      .finally(() => setSlotsLoading(false));
  }, []);

  const setField = <K extends keyof FormData>(key: K, val: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: val }));
    // Clear the error for this field as soon as the user edits it
    setFormErrors(prev => ({ ...prev, [key]: undefined }));
  };

  // ── Submit (exact mirror of web handleSubmit) ─────────────────────────────

  const handleSubmit = async () => {
    if (submittingRef.current) return;

    // Run full validation
    const errors = validateForm(formData, selectedISD);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    submittingRef.current = true;
    setIsSubmitting(true);

    // Full phone includes ISD prefix (e.g. "+919876543210")
    const fullPhone = formData.phone.trim()
      ? `${selectedISD.code}${formData.phone.trim()}`
      : '';

    try {
      if (!user) {
        // ── Guest flow ──────────────────────────────────────────────────────
        const dupCheck = await checkDuplicateViaApi(formData.email, fullPhone || undefined);
        if (dupCheck?.alreadyBooked) {
          const label = dupCheck.matchType === 'phone' ? 'contact number' : 'email address';
          setAlreadyUsedMessage(
            `A free consultation has already been booked with this ${label}.`,
          );
          setShowAlreadyUsedModal(true);
          return;
        }

        let userId: string | null = null;
        const matched = await findUserByEmailOrPhone(formData.email, fullPhone);
        if (matched) {
          if (matched.userData?.isfree_cons_used === true) {
            setAlreadyUsedMessage(
              `A free consultation has already been booked with this ${matched.matchType === 'email' ? 'email address' : 'contact number'}.`,
            );
            setShowAlreadyUsedModal(true);
            return;
          }
          userId = matched.userId;
        }

        const payload = await buildBookingPayload(
          { ...formData, phone: fullPhone },
          userId,
        );
        if (!payload) {
          Alert.alert('Booking failed', 'Could not build booking payload.');
          return;
        }

        const bookingId = await createBookingDoc(payload);
        const times = getBookingTimes(formData)!;
        const fullName = `${formData.firstName} ${formData.lastName}`.trim();

        // Non-blocking: create Google Meet link
        createGoogleMeetAndUpdate({
          customerName:  fullName || formData.firstName,
          customerEmail: formData.email,
          startTime:     times.bookingStartTime,
          endTime:       times.bookingEndTime,
          bookingDocId:  bookingId,
        });

        setBookedDate(formData.consultationDate);
        setBookedSlot(formData.timeSlot);
        setShowSuccess(true);

      } else {
        // ── Logged-in flow ──────────────────────────────────────────────────
        const emailToCheck = formData.email || user.email || '';
        const dupCheck = await checkDuplicateViaApi(emailToCheck, fullPhone || undefined);
        if (dupCheck?.alreadyBooked) {
          setAlreadyUsedMessage('You have already booked your free consultation with this account.');
          setShowAlreadyUsedModal(true);
          return;
        }

        const payload = await buildBookingPayload(
          { ...formData, phone: fullPhone },
          user.uid,
        );
        if (!payload) {
          Alert.alert('Booking failed', 'Could not build booking payload.');
          return;
        }

        const bookingId = await createBookingDoc(payload);
        const times = getBookingTimes(formData)!;
        const customerName = profile?.name || user.displayName || formData.firstName || '';
        const toEmail      = formData.email || user.email || '';

        // Non-blocking: create Google Meet link
        createGoogleMeetAndUpdate({
          customerName,
          customerEmail: toEmail,
          startTime:     times.bookingStartTime,
          endTime:       times.bookingEndTime,
          bookingDocId:  bookingId,
        });

        setBookedDate(formData.consultationDate);
        setBookedSlot(formData.timeSlot);
        setShowSuccess(true);
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to submit. Please try again.';
      Alert.alert('Booking failed', msg);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────

  if (showSuccess) {
    const email = formData.email;
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
        <ScrollView contentContainerStyle={styles.successScroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.successCircle, { backgroundColor: T.accentBg }]}>
            <Icon name="check" size={36} color={T.accent} />
          </View>

          <Text style={styles.successTitle}>Your Free Consultation is Confirmed!</Text>
          {bookedDate && bookedSlot && (
            <Text style={styles.successDateText}>
              {bookedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at {bookedSlot}
            </Text>
          )}

          {/* What's included card */}
          <View style={styles.successCard}>
            <Text style={styles.successCardLabel}>WHAT'S INCLUDED</Text>

            <View style={styles.successItem}>
              <View style={styles.successItemIcon}><Icon name="calendar" size={16} color={T.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.successItemTitle}>1 on 1 session with professional stylist</Text>
                <Text style={styles.successItemSub}>
                  {bookedDate && bookedSlot
                    ? `Scheduled for ${bookedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${bookedSlot}`
                    : 'Your video call session has been scheduled'}
                </Text>
              </View>
            </View>

            <View style={styles.successItemDivider} />

            <View style={styles.successItem}>
              <View style={styles.successItemIcon}><Icon name="chat" size={16} color={T.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.successItemTitle}>AI Eaase Bot Chat</Text>
                <Text style={styles.successItemSub}>10 free chat sessions to explore products & prepare for your call</Text>
              </View>
            </View>
          </View>

          {/* CTAs */}
          {!isGuest ? (
            <View style={styles.successCtaGroup}>
              <TouchableOpacity style={[styles.successCtaBtn, { backgroundColor: T.accent }]}
                onPress={() => router.push('/screens/consult/booking-confirmed' as any)}
                activeOpacity={0.85} accessibilityRole="button" testID="view-booking-btn">
                <Text style={styles.successCtaBtnText}>View My Booking</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.successCtaGroup}>
              <Text style={styles.successGuestNote}>
                Create an account to unlock your 10 free AI chat messages.
              </Text>
              <View style={styles.successCtaRow}>
                <TouchableOpacity
                  style={[styles.successCtaBtn, { backgroundColor: T.accent, flex: 1 }]}
                  onPress={() => router.push(`/auth/register` as any)}
                  activeOpacity={0.85} accessibilityRole="button" testID="create-account-btn">
                  <Text style={styles.successCtaBtnText}>Create Account</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.successCtaBtnOutline, { borderColor: T.accent, flex: 1 }]}
                  onPress={() => router.push(`/auth/login` as any)}
                  activeOpacity={0.7} accessibilityRole="button" testID="login-btn">
                  <Text style={[styles.successCtaBtnOutlineText, { color: T.accent }]}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Timezone modal ────────────────────────────────────────────────────────

  const filteredTz = TIMEZONES.filter(t =>
    t.label.toLowerCase().includes(timezoneSearch.toLowerCase()),
  );

  const selectedTzLabel = TIMEZONES.find(t => t.tz === formData.timezone)?.label ?? formData.timezone;

  // ── Slot display ──────────────────────────────────────────────────────────

  const displaySlot = formData.timeSlot
    ? (formData.timezone === 'Asia/Kolkata'
      ? formData.timeSlot
      : convertISTSlot(formData.timeSlot, formData.timezone))
    : '';

  // ── Date picker handler ────────────────────────────────────────────────────

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    // On Android the picker closes automatically; on iOS keep it open until dismissed
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && selected) {
      setField('consultationDate', selected);
    }
    if (event.type === 'dismissed') setShowDatePicker(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render form
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
      {/* ── Already Used Modal ── */}
      <Modal visible={showAlreadyUsedModal} transparent animationType="fade"
        onRequestClose={() => setShowAlreadyUsedModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.alreadyUsedCard}>
            <TouchableOpacity style={styles.alreadyUsedClose}
              onPress={() => { setShowAlreadyUsedModal(false); onBack(); }}
              accessibilityRole="button">
              <Text style={styles.alreadyUsedCloseText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.alreadyUsedHeading}>Ready for the Next Step?</Text>
            <Text style={styles.alreadyUsedBody}>
              Your complimentary consultation has been used.{'\n'}
              To continue your journey with us...
            </Text>
            <Text style={styles.alreadyUsedMessage}>{alreadyUsedMessage}</Text>

            <TouchableOpacity
              style={styles.alreadyUsedPrimaryBtn}
              onPress={() => {
                setShowAlreadyUsedModal(false);
                router.push('/screens/packages/list' as any);
              }}
              activeOpacity={0.85} accessibilityRole="button" testID="explore-packages-btn">
              <Text style={styles.alreadyUsedPrimaryBtnText}>EXPLORE PACKAGES</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.alreadyUsedSecondaryBtn}
              onPress={() => { setShowAlreadyUsedModal(false); onBack(); }}
              activeOpacity={0.7} accessibilityRole="button">
              <Text style={styles.alreadyUsedSecondaryBtnText}>BACK TO HOME</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── ISD Code Picker Modal ── */}
      <Modal visible={isdModalOpen} animationType="slide"
        onRequestClose={() => { setIsdModalOpen(false); setIsdSearch(''); }}>
        <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
          <View style={styles.pickerModalHeader}>
            <Text style={styles.pickerModalTitle}>Select Country</Text>
            <TouchableOpacity onPress={() => { setIsdModalOpen(false); setIsdSearch(''); }}
              accessibilityRole="button">
              <Text style={[styles.pickerModalDone, { color: accent }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerSearchWrap}>
            <TextInput style={styles.pickerSearch} placeholder="Search country or code..."
              placeholderTextColor={T.dim} value={isdSearch}
              onChangeText={setIsdSearch} autoFocus />
          </View>
          <FlatList
            data={ISD_CODES.filter(c =>
              c.country.toLowerCase().includes(isdSearch.toLowerCase()) ||
              c.code.includes(isdSearch)
            )}
            keyExtractor={item => item.iso}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pickerItem,
                  selectedISD.iso === item.iso && styles.pickerItemSelected]}
                onPress={() => {
                  setSelectedISD(item);
                  setFormErrors(prev => ({ ...prev, phone: undefined }));
                  setIsdModalOpen(false);
                  setIsdSearch('');
                }} activeOpacity={0.7}>
                <Text style={[styles.pickerItemText,
                  selectedISD.iso === item.iso && { color: accent, fontWeight: '700' }]}>
                  {item.flag}{'  '}{item.country}
                </Text>
                <Text style={[styles.pickerItemSubText, { marginTop: 0 }]}>
                  {item.code} · {phoneLengthHint(item)}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* ── Timezone Picker Modal ── */}
      <Modal visible={timezoneModalOpen} animationType="slide"
        onRequestClose={() => setTimezoneModalOpen(false)}>
        <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
          <View style={styles.pickerModalHeader}>
            <Text style={styles.pickerModalTitle}>Your Timezone</Text>
            <TouchableOpacity onPress={() => { setTimezoneModalOpen(false); setTimezoneSearch(''); }}
              accessibilityRole="button">
              <Text style={[styles.pickerModalDone, { color: accent }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerSearchWrap}>
            <TextInput style={styles.pickerSearch} placeholder="Search timezone..."
              placeholderTextColor={T.dim} value={timezoneSearch}
              onChangeText={setTimezoneSearch} autoFocus />
          </View>
          <FlatList
            data={filteredTz}
            keyExtractor={item => item.tz}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.pickerItem,
                formData.timezone === item.tz && styles.pickerItemSelected]}
                onPress={() => {
                  setField('timezone', item.tz);
                  setField('timeSlot', '');
                  setTimezoneModalOpen(false);
                  setTimezoneSearch('');
                }} activeOpacity={0.7}>
                <Text style={[styles.pickerItemText,
                  formData.timezone === item.tz && { color: accent, fontWeight: '700' }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* ── Time Slot Picker Modal ── */}
      <Modal visible={slotModalOpen} animationType="slide"
        onRequestClose={() => setSlotModalOpen(false)}>
        <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
          <View style={styles.pickerModalHeader}>
            <Text style={styles.pickerModalTitle}>
              Select Slot{formData.timezone !== 'Asia/Kolkata' ? ' (your time)' : ''}
            </Text>
            <TouchableOpacity onPress={() => setSlotModalOpen(false)} accessibilityRole="button">
              <Text style={[styles.pickerModalDone, { color: accent }]}>Done</Text>
            </TouchableOpacity>
          </View>
          {slotsLoading ? (
            <View style={styles.center}><ActivityIndicator color={accent} /></View>
          ) : (
            <FlatList
              data={timeSlots}
              keyExtractor={item => item}
              renderItem={({ item: istSlot }) => {
                const localTime = formData.timezone === 'Asia/Kolkata'
                  ? istSlot
                  : convertISTSlot(istSlot, formData.timezone);
                const isSelected = formData.timeSlot === istSlot;
                return (
                  <TouchableOpacity
                    style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                    onPress={() => { setField('timeSlot', istSlot); setSlotModalOpen(false); }}
                    activeOpacity={0.7}>
                    <Text style={[styles.pickerItemText, isSelected && { color: accent, fontWeight: '700' }]}>
                      {localTime}
                    </Text>
                    {formData.timezone !== 'Asia/Kolkata' && (
                      <Text style={styles.pickerItemSubText}>{istSlot} IST</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* ── Native Date Picker (iOS: modal spinner, Android: system dialog) ── */}
      {showDatePicker && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
            <View style={styles.iosDateOverlay}>
              <View style={styles.iosDateCard}>
                <View style={styles.iosDateHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} accessibilityRole="button">
                    <Text style={[styles.iosDateAction, { color: T.body }]}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.iosDateTitle}>Select Date</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} accessibilityRole="button">
                    <Text style={[styles.iosDateAction, { color: accent, fontWeight: '700' }]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={formData.consultationDate ?? new Date()}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  onChange={onDateChange}
                  themeVariant="light"
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={formData.consultationDate ?? new Date()}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={onDateChange}
          />
        )
      )}

      {/* ── Form ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Back */}
          <TouchableOpacity style={styles.backRow} onPress={onBack} accessibilityRole="button">
            <Text style={[styles.backText, { color: accent }]}>{'\u2190'} Back</Text>
          </TouchableOpacity>

          {/* What Happens section */}
          <View style={styles.whatHappensCard}>
            <Text style={styles.whatHappensTitle}>What Happens in Your Free Consultation</Text>
            <View style={styles.whatHappensList}>
              {WHAT_HAPPENS.map((text, i) => (
                <View key={i} style={styles.whatHappensRow}>
                  <Icon name="check" size={14} color={T.accent} />
                  <Text style={styles.whatHappensText}>{text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Form card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Book Free Consultation</Text>

            {/* Role */}
            <Text style={styles.fieldLabel}>I am</Text>
            <View style={styles.roleGrid}>
              {ROLES.map(role => {
                const checked = formData.role === role;
                return (
                  <TouchableOpacity key={role}
                    style={styles.roleCheckRow}
                    onPress={() => setField('role', checked ? '' : role)}
                    activeOpacity={0.7} accessibilityRole="checkbox">
                    <View style={[styles.roleCheckBox, checked && { backgroundColor: T.accent, borderColor: T.accent }]}>
                      {checked && <Icon name="check" size={10} color={T.white} />}
                    </View>
                    <Text style={styles.roleCheckLabel}>{role}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {!!formErrors.role && <Text style={styles.fieldError}>{formErrors.role}</Text>}

            {/* First Name + Last Name (side by side) */}
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>First Name *</Text>
                <View style={[styles.inputWithIcon, !!formErrors.firstName && styles.inputWithIconError]}>
                  <Icon name="user" size={16} color={!!formErrors.firstName ? T.rose : T.dim} />
                  <TextInput style={[styles.iconInput, !!user && styles.inputLocked]}
                    placeholder="First Name" placeholderTextColor={T.dim}
                    value={formData.firstName}
                    onChangeText={t => setField('firstName', t)}
                    editable={!user || !profile?.name}
                    autoCapitalize="words" testID="consult-first-name" />
                </View>
                {!!formErrors.firstName && <Text style={styles.fieldError}>{formErrors.firstName}</Text>}
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Last Name *</Text>
                <View style={[styles.inputWithIcon, !!formErrors.lastName && styles.inputWithIconError]}>
                  <Icon name="user" size={16} color={!!formErrors.lastName ? T.rose : T.dim} />
                  <TextInput style={[styles.iconInput, !!user && styles.inputLocked]}
                    placeholder="Last Name" placeholderTextColor={T.dim}
                    value={formData.lastName}
                    onChangeText={t => setField('lastName', t)}
                    editable={!user || !profile?.name}
                    autoCapitalize="words" testID="consult-last-name" />
                </View>
                {!!formErrors.lastName && <Text style={styles.fieldError}>{formErrors.lastName}</Text>}
              </View>
            </View>

            {/* Email */}
            <Text style={styles.fieldLabel}>Email Address *</Text>
            <View style={[styles.inputWithIcon, !!formErrors.email && styles.inputWithIconError]}>
              <Icon name="mail" size={16} color={!!formErrors.email ? T.rose : T.dim} />
              <TextInput style={[styles.iconInput, !!user && styles.inputLocked]}
                placeholder="yourname@example.com" placeholderTextColor={T.dim}
                value={formData.email}
                onChangeText={t => setField('email', t)}
                editable={!user}
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                testID="consult-email" />
            </View>
            {!!formErrors.email && <Text style={styles.fieldError}>{formErrors.email}</Text>}

            {/* Phone with ISD code picker */}
            <Text style={styles.fieldLabel}>
              Phone Number
              <Text style={styles.fieldLabelOptional}> (optional)</Text>
            </Text>
            <View style={[styles.phoneRow, !!formErrors.phone && styles.inputWithIconError]}>
              {/* ISD trigger */}
              <TouchableOpacity style={styles.isdBtn}
                onPress={() => setIsdModalOpen(true)} activeOpacity={0.8}
                accessibilityRole="button" accessibilityLabel="Select country code">
                <Text style={styles.isdFlag}>{selectedISD.flag}</Text>
                <Text style={styles.isdCode}>{selectedISD.code}</Text>
                <Icon name="chevron-down" size={12} color={T.dim} />
              </TouchableOpacity>
              <View style={styles.isdDivider} />
              {/* Phone input */}
              <TextInput
                style={styles.phoneInput}
                placeholder={`${phoneLengthHint(selectedISD)}`}
                placeholderTextColor={T.dim}
                value={formData.phone}
                onChangeText={t => setField('phone', t.replace(/[^\d]/g, ''))}
                keyboardType="number-pad"
                maxLength={selectedISD.maxLength}
                testID="consult-phone"
              />
            </View>
            {!!formErrors.phone
              ? <Text style={styles.fieldError}>{formErrors.phone}</Text>
              : <Text style={styles.fieldHint}>{selectedISD.country} · {selectedISD.code} · {phoneLengthHint(selectedISD)}</Text>
            }

            {/* Timezone */}
            <Text style={styles.fieldLabel}>Your Timezone</Text>
            <TouchableOpacity style={styles.inputWithIcon}
              onPress={() => setTimezoneModalOpen(true)} activeOpacity={0.8}>
              <Icon name="clock" size={16} color={T.dim} />
              <Text style={[styles.pickerTriggerText, !selectedTzLabel && { color: T.dim }]} numberOfLines={1}>
                {selectedTzLabel || 'Select timezone'}
              </Text>
              <Icon name="chevron-down" size={14} color={T.dim} />
            </TouchableOpacity>

            {/* Date + Slot (side by side) */}
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Date *</Text>
                <TouchableOpacity
                  style={[styles.inputWithIcon, !!formErrors.consultationDate && styles.inputWithIconError]}
                  onPress={() => { setShowDatePicker(true); setFormErrors(p => ({ ...p, consultationDate: undefined })); }}
                  activeOpacity={0.8}>
                  <Icon name="calendar" size={16} color={!!formErrors.consultationDate ? T.rose : T.dim} />
                  <Text style={[styles.pickerTriggerText, !formData.consultationDate && { color: T.dim }]}>
                    {formData.consultationDate
                      ? formData.consultationDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : 'Date'}
                  </Text>
                </TouchableOpacity>
                {!!formErrors.consultationDate && <Text style={styles.fieldError}>{formErrors.consultationDate}</Text>}
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  Slot {formData.timezone !== 'Asia/Kolkata' ? '(your time) ' : ''}*
                </Text>
                <TouchableOpacity
                  style={[styles.inputWithIcon, !!formErrors.timeSlot && styles.inputWithIconError]}
                  onPress={() => { setSlotModalOpen(true); setFormErrors(p => ({ ...p, timeSlot: undefined })); }}
                  activeOpacity={0.8}>
                  <Icon name="clock" size={16} color={!!formErrors.timeSlot ? T.rose : T.dim} />
                  <Text style={[styles.pickerTriggerText, !displaySlot && { color: T.dim }]} numberOfLines={1}>
                    {displaySlot || 'Select Slot'}
                  </Text>
                  <Icon name="chevron-down" size={14} color={T.dim} />
                </TouchableOpacity>
                {!!formErrors.timeSlot && <Text style={styles.fieldError}>{formErrors.timeSlot}</Text>}
              </View>
            </View>

            {/* Message */}
            <Text style={styles.fieldLabel}>Details / Special Requests</Text>
            <TextInput style={[styles.input, styles.inputMultiline]}
              placeholder="Tell us about your requirements..."
              placeholderTextColor={T.dim}
              value={formData.message}
              onChangeText={t => setField('message', t)}
              multiline numberOfLines={3} textAlignVertical="top"
              testID="consult-message" />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8} accessibilityRole="button" testID="free-consult-submit">
              {isSubmitting ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color={T.white} size="small" />
                  <Text style={styles.submitBtnText}>Processing...</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>Book Free Consulation</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Premium ────────────────────────────────────────────────────────────────
  premiumContent:      { padding: 16, paddingBottom: 32 },
  premiumHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  premiumHeaderTitle:  { fontSize: 22, fontFamily: F.serif, fontWeight: '700', color: T.heading },
  bookBtn:             { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.md, gap: 6, ...SHADOW.card },
  bookBtnText:         { fontSize: 13, fontFamily: F.sans, fontWeight: '600', color: T.white },
  sectionTitle:        { fontSize: 14, fontFamily: F.serif, fontWeight: '600', color: T.heading, marginBottom: 10 },
  emptyCard:           { alignItems: 'center', justifyContent: 'center', backgroundColor: T.cardBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: T.border, padding: 24, gap: 8 },
  emptyText:           { fontSize: 14, fontFamily: F.sans, color: T.body },
  historyLink:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 44, marginTop: 16, gap: 4 },
  historyLinkText:     { fontSize: 14, fontFamily: F.sans, fontWeight: '600' },

  // ── Landing ────────────────────────────────────────────────────────────────
  landingScroll:     { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  landingHeading:    { fontSize: 26, fontFamily: F.serif, fontWeight: '700', color: T.heading, marginBottom: 4 },
  landingSubheading: { fontSize: 14, fontFamily: F.sans, color: T.body, lineHeight: 20, marginBottom: 24 },
  freeCard:          { backgroundColor: T.goldBg, borderWidth: 1.5, borderColor: T.gold + '55', borderRadius: RADIUS.lg, padding: 20, marginBottom: 28, ...SHADOW.card },
  freeCardHeader:    { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  freeCardIconWrap:  { width: 44, height: 44, borderRadius: 22, backgroundColor: T.white, alignItems: 'center', justifyContent: 'center', ...SHADOW.card },
  freeCardIcon:      { fontSize: 22 },
  freeCardTitle:     { fontSize: 17, fontFamily: F.serif, fontWeight: '700', color: T.heading, marginBottom: 2 },
  freeCardSub:       { fontSize: 13, fontFamily: F.sans, color: T.body, lineHeight: 18 },
  freeFeatureList:   { gap: 8, marginBottom: 20 },
  freeFeatureRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  freeFeatureCheck:  { width: 20, height: 20, borderRadius: 10, backgroundColor: T.success, alignItems: 'center', justifyContent: 'center' },
  freeFeatureText:   { fontSize: 14, fontFamily: F.sans, color: T.body, fontWeight: '500' },
  freeCardBtn:       { minHeight: 50, backgroundColor: T.gold, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', ...SHADOW.elevated },
  freeCardBtnText:   { fontSize: 15, fontFamily: F.sans, fontWeight: '700', color: T.white },
  packagesLabel:     { fontSize: 11, fontFamily: F.sans, fontWeight: '700', color: T.dim, letterSpacing: 1.5, marginBottom: 4 },
  packagesSubLabel:  { fontSize: 13, fontFamily: F.sans, color: T.body, marginBottom: 14, lineHeight: 18 },
  pkgRow:            { flexDirection: 'row', alignItems: 'center', backgroundColor: T.cardBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: T.border, padding: 16, marginBottom: 10, ...SHADOW.card },
  pkgRowTop:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  pkgRowName:        { fontSize: 15, fontFamily: F.sans, fontWeight: '700', color: T.heading },
  pkgRowSub:         { fontSize: 12, fontFamily: F.sans, color: T.body, marginBottom: 4 },
  pkgRowPrice:       { fontSize: 16, fontFamily: F.sans, fontWeight: '800', color: T.gold },
  popularBadge:      { backgroundColor: T.goldBg, borderWidth: 1, borderColor: T.gold + '55', borderRadius: RADIUS.sm, paddingHorizontal: 7, paddingVertical: 2 },
  popularBadgeText:  { fontSize: 9, fontFamily: F.sans, fontWeight: '700', color: T.gold, letterSpacing: 0.8 },

  // ── Form ────────────────────────────────────────────────────────────────────
  formScroll:       { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  backRow:          { marginBottom: 16, minHeight: 44, justifyContent: 'center' },
  backText:         { fontSize: 14, fontFamily: F.sans, fontWeight: '600' },

  whatHappensCard:  { backgroundColor: T.cardBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: T.border, padding: 18, marginBottom: 20, ...SHADOW.card },
  whatHappensTitle: { fontSize: 15, fontFamily: F.serif, fontWeight: '700', color: T.heading, textAlign: 'center', marginBottom: 14 },
  whatHappensList:  { gap: 8 },
  whatHappensRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  whatHappensText:  { flex: 1, fontSize: 13, fontFamily: F.sans, color: T.body, lineHeight: 18 },

  formCard:         { backgroundColor: T.cardBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: T.border, padding: 20, ...SHADOW.card },
  formTitle:        { fontSize: 20, fontFamily: F.serif, fontWeight: '700', color: T.heading, marginBottom: 20 },

  fieldLabel:       { fontSize: 11, fontFamily: F.sans, fontWeight: '700', color: T.body, letterSpacing: 1, textTransform: 'uppercase', marginTop: 16, marginBottom: 6 },
  fieldLabelOptional:{ fontSize: 10, fontFamily: F.sans, fontWeight: '400', color: T.dim, letterSpacing: 0, textTransform: 'none' },
  fieldError:       { fontSize: 11, fontFamily: F.sans, color: T.rose, marginTop: 4, marginBottom: 2 },
  fieldHint:        { fontSize: 11, fontFamily: F.sans, color: T.dim, marginTop: 3, marginBottom: 2 },

  roleGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  roleCheckRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: '45%' },
  roleCheckBox:     { width: 18, height: 18, borderWidth: 1.5, borderColor: T.border, borderRadius: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: T.cardBg },
  roleCheckLabel:   { fontSize: 13, fontFamily: F.sans, color: T.heading },

  nameRow:          { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 },

  inputWithIcon:         { flexDirection: 'row', alignItems: 'center', minHeight: 48, borderWidth: 1, borderColor: T.border, borderRadius: RADIUS.md, backgroundColor: T.cardBg, paddingHorizontal: 12, gap: 8, marginBottom: 2 },
  inputWithIconError:    { borderColor: T.rose, borderWidth: 1.5 },

  // ── Phone / ISD row ─────────────────────────────────────────────────────
  phoneRow:    { flexDirection: 'row', alignItems: 'center', minHeight: 48, borderWidth: 1, borderColor: T.border, borderRadius: RADIUS.md, backgroundColor: T.cardBg, marginBottom: 2, overflow: 'hidden' },
  isdBtn:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 12, gap: 4, minWidth: 82 },
  isdFlag:     { fontSize: 18, lineHeight: 22 },
  isdCode:     { fontSize: 13, fontFamily: F.sans, fontWeight: '700', color: T.heading },
  isdDivider:  { width: 1, height: 28, backgroundColor: T.border },
  phoneInput:  { flex: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, fontFamily: F.sans, color: T.ink },
  iconInput:        { flex: 1, fontSize: 14, fontFamily: F.sans, color: T.ink, paddingVertical: 12 },
  inputLocked:      { opacity: 0.55 },
  pickerTriggerText:{ flex: 1, fontSize: 14, fontFamily: F.sans, color: T.heading, paddingVertical: 12 },

  input:            { minHeight: 48, borderWidth: 1, borderColor: T.border, borderRadius: RADIUS.md, backgroundColor: T.cardBg, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: F.sans, color: T.ink },
  inputMultiline:   { minHeight: 88, paddingTop: 12, marginBottom: 2 },

  submitBtn:        { minHeight: 52, backgroundColor: T.accentBg, borderWidth: 1, borderColor: T.accent + '33', borderRadius: 0, alignItems: 'center', justifyContent: 'center', marginTop: 24, paddingHorizontal: 24 },
  submitBtnDisabled:{ opacity: 0.5 },
  submitBtnText:    { fontSize: 13, fontFamily: F.sans, fontWeight: '700', color: T.accent, letterSpacing: 0.5, textTransform: 'uppercase' },

  // ── Pickers ─────────────────────────────────────────────────────────────────
  pickerModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.border, backgroundColor: T.cardBg },
  pickerModalTitle:  { fontSize: 16, fontFamily: F.serif, fontWeight: '700', color: T.heading },
  pickerModalDone:   { fontSize: 15, fontFamily: F.sans, fontWeight: '700' },
  pickerSearchWrap:  { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.border },
  pickerSearch:      { minHeight: 40, borderWidth: 1, borderColor: T.border, borderRadius: RADIUS.md, paddingHorizontal: 12, fontSize: 13, fontFamily: F.sans, color: T.ink, backgroundColor: T.cardBg },
  pickerItem:        { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.border + '66' },
  pickerItemSelected:{ backgroundColor: T.accentBg },
  pickerItemText:    { fontSize: 14, fontFamily: F.sans, color: T.heading },
  pickerItemSubText: { fontSize: 11, fontFamily: F.sans, color: T.dim, marginTop: 2 },

  // ── Shared modal overlay ──────────────────────────────────────────────────
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },

  // ── iOS DateTimePicker modal ─────────────────────────────────────────────
  iosDateOverlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  iosDateCard:      { backgroundColor: T.cardBg, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, paddingBottom: 24, ...SHADOW.elevated },
  iosDateHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.border },
  iosDateTitle:     { fontSize: 15, fontFamily: F.serif, fontWeight: '700', color: T.heading },
  iosDateAction:    { fontSize: 15, fontFamily: F.sans },

  // ── Already Used modal ────────────────────────────────────────────────────
  alreadyUsedCard:          { width: '100%', backgroundColor: T.cardBg, borderRadius: RADIUS.lg, padding: 28, alignItems: 'center', ...SHADOW.elevated },
  alreadyUsedClose:         { position: 'absolute', top: 12, right: 12, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  alreadyUsedCloseText:     { fontSize: 16, color: T.dim },
  alreadyUsedHeading:       { fontSize: 20, fontFamily: F.serif, fontWeight: '700', color: T.heading, textAlign: 'center', marginBottom: 10, marginTop: 8 },
  alreadyUsedBody:          { fontSize: 13, fontFamily: F.sans, color: T.body, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  alreadyUsedMessage:       { fontSize: 12, fontFamily: F.sans, color: T.rose, textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  alreadyUsedPrimaryBtn:    { width: '100%', minHeight: 48, backgroundColor: T.accent, borderRadius: 0, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  alreadyUsedPrimaryBtnText:{ fontSize: 11, fontFamily: F.sans, fontWeight: '700', color: T.white, letterSpacing: 2, textTransform: 'uppercase' },
  alreadyUsedSecondaryBtn:  { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  alreadyUsedSecondaryBtnText:{ fontSize: 10, fontFamily: F.sans, fontWeight: '700', color: T.dim, letterSpacing: 1.5, textTransform: 'uppercase', textDecorationLine: 'underline' },

  // ── Success ────────────────────────────────────────────────────────────────
  successScroll:           { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 },
  successCircle:           { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle:            { fontSize: 22, fontFamily: F.serif, fontWeight: '700', color: T.heading, textAlign: 'center', marginBottom: 8, lineHeight: 30 },
  successDateText:         { fontSize: 13, fontFamily: F.sans, color: T.body, marginBottom: 20 },
  successCard:             { width: '100%', backgroundColor: T.cardBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: T.border, padding: 18, marginBottom: 20, ...SHADOW.card },
  successCardLabel:        { fontSize: 10, fontFamily: F.sans, fontWeight: '700', color: T.accent, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 },
  successItem:             { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 6 },
  successItemIcon:         { width: 32, height: 32, borderRadius: 16, backgroundColor: T.accentBg, alignItems: 'center', justifyContent: 'center' },
  successItemTitle:        { fontSize: 14, fontFamily: F.sans, fontWeight: '600', color: T.heading, marginBottom: 2 },
  successItemSub:          { fontSize: 12, fontFamily: F.sans, color: T.body, lineHeight: 18 },
  successItemDivider:      { height: 1, backgroundColor: T.border, marginVertical: 8 },
  successCtaGroup:         { width: '100%', gap: 10 },
  successCtaRow:           { flexDirection: 'row', gap: 10 },
  successGuestNote:        { fontSize: 13, fontFamily: F.sans, color: T.body, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  successCtaBtn:           { minHeight: 50, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 14, ...SHADOW.card },
  successCtaBtnText:       { fontSize: 15, fontFamily: F.sans, fontWeight: '700', color: T.white },
  successCtaBtnOutline:    { minHeight: 50, borderRadius: RADIUS.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  successCtaBtnOutlineText:{ fontSize: 15, fontFamily: F.sans, fontWeight: '700' },
});
