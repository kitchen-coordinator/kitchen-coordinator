/* eslint-disable react/jsx-no-bind */

'use client';

import React, { useState } from 'react';
import { Modal, Button, Form, ProgressBar } from 'react-bootstrap';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import swal from 'sweetalert';
import Image from 'next/image';

type Props = {
  show: boolean;
  onHide: () => void;
  recipeId: number;
  recipeTitle: string;
  userEmail: string | null;
};

export default function DishImageUploadModal({
  show,
  onHide,
  recipeId,
  recipeTitle,
  userEmail,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const maxFileSize = 5 * 1024 * 1024;

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

  function handleClose() {
    setFile(null);
    setPreview(null);
    setProgress(0);
    onHide();
  }

  async function handleUpload() {
    if (!file) {
      swal('No File Selected', 'Please select a file to upload.', 'warning');
      return;
    }
    if (!userEmail) {
      swal('Not Signed In', 'You must be signed in to upload.', 'warning');
      return;
    }

    setUploading(true);
    const filePath = `recipe-images/${userEmail}/${recipeId}/${Date.now()}_${file.name}`;

    if (!storage) {
      swal('Upload Failed', 'Storage is not configured. Please try again later.', 'error');
      setUploading(false);
      return;
    }

    const storageRef = ref(storage!, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(Math.round(pct));
      },
      (error) => {
        console.error('Upload error:', error);
        swal(
          'Upload Failed',
          'An error occurred during upload. Check console for details.',
          'error',
        );
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        await addDoc(collection(db, 'recipeImages'), {
          userEmail,
          recipeId,
          recipeTitle,
          path: filePath,
          url,
          name: file.name,
          size: file.size,
          contentType: file.type,
          createdAt: serverTimestamp(),
        });
        setUploading(false);
        swal(
          'Upload Complete!',
          'Your dish photo has been uploaded successfully.',
          'success',
        );
        handleClose();
      },
    );
  }

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          Share Your
          {' '}
          {recipeTitle}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Upload Photo</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleFile}
              disabled={uploading}
            />
            <Form.Text className="text-muted">
              Maximum file size: 5MB. Accepted formats: JPG, PNG, GIF, WebP
            </Form.Text>
          </Form.Group>

          {preview && (
            <div className="mb-3 text-center">
              <Image
                src={preview}
                alt="preview"
                width={400}
                height={300}
                style={{ objectFit: 'cover', borderRadius: '8px' }}
                unoptimized
              />
            </div>
          )}

          {uploading && (
            <ProgressBar
              now={progress}
              label={`${progress}%`}
              animated
              className="mb-3"
            />
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          variant="success"
          onClick={handleUpload}
          disabled={!file || !userEmail || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
