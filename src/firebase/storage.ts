import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { firebaseStorage } from './config';

export async function uploadFile(localUri: string, remotePath: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const storageRef = ref(firebaseStorage, remotePath);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function deleteFile(remotePath: string): Promise<void> {
  const storageRef = ref(firebaseStorage, remotePath);
  await deleteObject(storageRef);
}
