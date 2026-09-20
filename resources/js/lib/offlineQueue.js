import { openDB } from 'idb';

const DB_NAME = 'sokokuku';
const STORE = 'pending_surveys';

async function getDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: 'offline_uuid' });
            }
        },
    });
}

export async function enqueue(survey) {
    const db = await getDB();
    await db.put(STORE, survey);
}

export async function getPending() {
    const db = await getDB();
    return db.getAll(STORE);
}

export async function dequeue(offline_uuid) {
    const db = await getDB();
    await db.delete(STORE, offline_uuid);
}

export async function pendingCount() {
    const db = await getDB();
    return db.count(STORE);
}
