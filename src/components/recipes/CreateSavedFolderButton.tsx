'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, Form, InputGroup } from 'react-bootstrap';

export default function CreateSavedFolderButton() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/saved-recipes/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      if (res.status === 409) {
        setError('A folder with that name already exists.');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setShow(false);
      setName('');
      router.refresh();
    } catch (e) {
      console.error(e);
      setError('Could not create folder. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline-secondary" onClick={() => setShow(true)}>
        New folder
      </Button>

      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create folder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Label>Folder name</Form.Label>
          <InputGroup>
            <Form.Control
              value={name}
              placeholder="e.g. Vietnamese food"
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  create();
                }
              }}
              autoFocus
            />
            <Button
              variant="success"
              onClick={create}
              disabled={loading || !name.trim()}
            >
              {loading ? 'Creating…' : 'Create'}
            </Button>
          </InputGroup>
          {error && <div className="text-danger small mt-2">{error}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)} disabled={loading}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
