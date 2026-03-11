'use client';

import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import swal from 'sweetalert';
import Image from 'next/image';

type SessionUser = { id: string; email: string; randomKey: string };
// eslint-disable-next-line react/require-default-props
type Props = { user?: SessionUser | null };

export default function ImageUploader({ user }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      swal('Invalid File', 'Please choose an image file.', 'error');
      return;
    }
    if (f.size > maxFileSize) {
      swal('File Too Large', 'File must be smaller than 5MB.', 'error');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleUpload() {
    if (!file) {
      swal('No File Selected', 'Please select a file to upload.', 'warning');
      return;
    }
    if (!user) {
      swal('Not Signed In', 'You must be signed in to upload.', 'warning');
      return;
    }

    setUploading(true);
    const uid = user.id;
    const filePath = `images/${uid}/${Date.now()}_${file.name}`;

    if (!storage) {
      swal('Upload Failed', 'Storage is not configured. Please try again later.', 'error');
      setUploading(false);
      return;
    }

    const storageRef = ref(storage!, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      snapshot => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(Math.round(pct));
      },
      error => {
        console.error('Upload error:', error);
        swal('Upload Failed', 'An error occurred during upload. Check console for details.', 'error');
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        if (!db) {
          swal('Upload Failed', 'Database is not configured. Please try again later.', 'error');
          setUploading(false);
          return;
        }

        await addDoc(collection(db!, 'images'), {
          uid,
          path: filePath,
          url,
          name: file.name,
          size: file.size,
          contentType: file.type,
          createdAt: serverTimestamp(),
        });
        setUploading(false);
        setFile(null);
        setPreview(null);
        setProgress(0);
        swal('Upload Complete!', 'Your image has been uploaded successfully.', 'success');
      },
    );
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFile} />
      {preview && (
        <Image
          src={preview}
          alt="preview"
          width={120}
          height={120}
          style={{ objectFit: 'cover' }}
          unoptimized
        />
      )}
      {uploading ? (
        <div>
          Uploading...
          {' '}
          {progress}
          %
        </div>
      ) : (
        <button type="button" onClick={handleUpload} disabled={!file || !user}>
          Upload
        </button>
      )}
    </div>
  );
}
