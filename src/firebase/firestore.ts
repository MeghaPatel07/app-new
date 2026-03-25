import { collection } from 'firebase/firestore';
import { db } from './config';

export { db };

export const collections = {
  users: collection(db, 'users'),
  products: collection(db, 'products'),
  orders: collection(db, 'orders'),
  chats: collection(db, 'chats'),
  consultations: collection(db, 'consultations'),
  slots: collection(db, 'slots'),
  packages: collection(db, 'packages'),
  styleBoards: collection(db, 'styleBoards'),
  userPackages: collection(db, 'userPackages'),
  easeBotConversations: collection(db, 'easeBotConversations'),
  freeConsultRequests: collection(db, 'freeConsultRequests'),
};
