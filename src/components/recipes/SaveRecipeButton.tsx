'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Modal,
  Form,
  InputGroup,
  Spinner,
} from 'react-bootstrap';
import { Bookmark, BookmarkFill } from 'react-bootstrap-icons';

type Folder = { id: number; name: string };

type SavedStatus = { id: number; folderId: number | null; createdAt: string } | null;

type Props = {
  recipeId: number;
  userEmail: string | null;
};

export default function SaveRecipeButton({ recipeId, userEmail }: Props) {
  const router = useRouter();

  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [status, setStatus] = useState<SavedStatus>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(''); // '' = Unsorted
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isAuthed = !!userEmail;

  const buttonVariant = status ? 'success' : 'outline-success';
  const buttonLabel = status ? 'Saved' : 'Save';
  const ButtonIcon = status ? BookmarkFill : Bookmark;

  const folderOptions = useMemo(
    () => folders.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [folders],
  );

  const refreshModalData = useCallback(async () => {
    setError(null);
    setFoldersLoading(true);
    try {
      const [foldersRes, statusRes] = await Promise.all([
        fetch('/api/saved-recipes/folders', { method: 'GET' }),
        fetch(`/api/saved-recipes/status?recipeId=${encodeURIComponent(String(recipeId))}`, { method: 'GET' }),
      ]);

      if (foldersRes.status === 401 || statusRes.status === 401) {
        setError('Please sign in to save recipes.');
        setFolders([]);
        setStatus(null);
        setSelectedFolderId('');
        return;
      }

      if (!foldersRes.ok) throw new Error('Failed to load folders');
      if (!statusRes.ok) throw new Error('Failed to load save status');

      const foldersJson = await foldersRes.json();
      const statusJson = await statusRes.json();

      const loadedFolders = (foldersJson.folders ?? []) as Folder[];
      const loadedStatus = (statusJson.saved ?? null) as SavedStatus;

      setFolders(loadedFolders);
      setStatus(loadedStatus);
      setSelectedFolderId(loadedStatus?.folderId != null ? String(loadedStatus.folderId) : '');
    } catch (e) {
      console.error(e);
      setError('Could not load saved recipe info. Try again.');
    } finally {
      setFoldersLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    if (!show) return;
    refreshModalData();
  }, [show, refreshModalData]);

  const createFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/saved-recipes/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (res.status === 401) {
        setError('Please sign in to create folders.');
        return;
      }

      if (res.status === 409) {
        setError('A folder with that name already exists.');
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const folder = json.folder as Folder;
      setFolders((prev) => [...prev, folder]);
      setSelectedFolderId(String(folder.id));
      setNewFolderName('');
    } catch (e) {
      console.error(e);
      setError('Could not create folder. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/saved-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId,
          folderId: selectedFolderId === '' ? null : Number(selectedFolderId),
        }),
      });

      if (res.status === 401) {
        setError('Please sign in to save recipes.');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      await refreshModalData();
      setShow(false);
      router.refresh();
    } catch (e) {
      console.error(e);
      setError('Could not save recipe. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/saved-recipes?recipeId=${encodeURIComponent(String(recipeId))}`, {
        method: 'DELETE',
      });
      if (res.status === 401) {
        setError('Please sign in to remove saved recipes.');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setStatus(null);
      setSelectedFolderId('');
      setShow(false);
      router.refresh();
    } catch (e) {
      console.error(e);
      setError('Could not remove saved recipe. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthed) {
    return (
      <Link href="/auth/signin" passHref legacyBehavior>
        <Button variant="outline-secondary" className="w-100" style={{ fontWeight: 500 }}>
          <Bookmark className="me-2" />
          Sign in to save
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Button
        variant={buttonVariant}
        className="w-100"
        style={{ fontWeight: 500 }}
        onClick={() => setShow(true)}
      >
        <ButtonIcon className="me-2" />
        {buttonLabel}
      </Button>

      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Save recipe</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {foldersLoading ? (
            <div className="d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              <span>Loading…</span>
            </div>
          ) : (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Folder</Form.Label>
                <Form.Select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Unsorted</option>
                  {folderOptions.map((f) => (
                    <option key={f.id} value={String(f.id)}>
                      {f.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Create a new folder</Form.Label>
                <InputGroup>
                  <Form.Control
                    value={newFolderName}
                    placeholder="e.g. Vietnamese food"
                    onChange={(e) => setNewFolderName(e.target.value)}
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        createFolder();
                      }
                    }}
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={createFolder}
                    disabled={loading || !newFolderName.trim()}
                  >
                    Create
                  </Button>
                </InputGroup>
              </Form.Group>

              {error && <div className="text-danger small mt-2">{error}</div>}
            </>
          )}
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between">
          <div>
            {status && (
              <Button variant="outline-danger" onClick={remove} disabled={loading}>
                Remove
              </Button>
            )}
          </div>

          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={() => setShow(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="success" onClick={save} disabled={loading || foldersLoading}>
              {loading ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
}
