import { createStore, del, get, set } from 'idb-keyval';

const store = createStore('ksx-engine-files', 'blobs');

export const saveFile = (id: string, blob: Blob) => set(id, blob, store);
export const loadFile = (id: string) => get<Blob>(id, store);
export const deleteFile = (id: string) => del(id, store);

export async function openFile(id: string, name: string, download = false) {
  const blob = await loadFile(id);
  if (!blob) {
    alert('File contents not found in this browser.');
    return;
  }
  const url = URL.createObjectURL(blob);
  if (download) {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  } else {
    window.open(url, '_blank');
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
