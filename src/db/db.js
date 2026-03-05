import { openDB } from 'idb';

const DB_NAME = 'canalWireDB';
const DB_VERSION = 1;

// Helper to generate random dates within the last year
const getRandomDate = () => {
  const start = new Date(2025, 0, 1);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
};

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        userStore.createIndex('name', 'name', { unique: false });
        userStore.createIndex('role', 'role', { unique: false });
      }
      if (!db.objectStoreNames.contains('officials')) {
        db.createObjectStore('officials', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('canalWires')) {
        const wireStore = db.createObjectStore('canalWires', { keyPath: 'id', autoIncrement: true });
        wireStore.createIndex('officialId', 'officialId', { unique: false });
        wireStore.createIndex('authorId', 'authorId', { unique: false });
        wireStore.createIndex('authorName', 'authorName', { unique: false });
      }
    },
  });
};

export const seedDatabase = async () => {
  const db = await initDB();
  const tx = db.transaction(['users', 'officials', 'canalWires'], 'readwrite');

  // Seed Admin User
  const users = await tx.objectStore('users').getAll();
  if (users.length === 0) {
    await tx.objectStore('users').add({
      name: 'Admin',
      role: 'Admin',
      pin: '1234',
      canEdit: true,
      canDelete: true,
    });

    // Seed sample operators
    await tx.objectStore('users').add({
      name: 'Operator 1',
      role: 'Operator',
      pin: '1234',
      canEdit: false,
      canDelete: false,
    });
  }

  // Seed Officials
  let officials = await tx.objectStore('officials').getAll();
  if (officials.length === 0) {
    const sampleOfficials = [
      { name: 'XEN Operation', designation: 'Executive Engineer', signatureText: 'Executive Engineer (Operation)\nCanal Dept' },
      { name: 'SDO Headquarter', designation: 'Sub Divisional Officer', signatureText: 'SDO Headquarter\nCanal Dept' },
      { name: 'Secretary Irrigation', designation: 'Secretary', signatureText: 'Secretary to Govt.\nIrrigation Dept' }
    ];
    for (const off of sampleOfficials) {
      await tx.objectStore('officials').add(off);
    }
    officials = await tx.objectStore('officials').getAll();
  }

  // Seed Canal Wires
  const wires = await tx.objectStore('canalWires').getAll();
  if (wires.length === 0 && officials.length > 0) {
    for (let i = 1; i <= 10; i++) {
      const randomOfficial = officials[Math.floor(Math.random() * officials.length)];
      const randomAuthor = Math.random() > 0.5 ? 'Admin' : 'Operator 1';

      await tx.objectStore('canalWires').add({
        officialId: randomOfficial.id,
        content: `This is a sample Canal Wire report generated automatically. It discusses standard operations regarding water flow levels observed at barrage points. Report reference number CW-2026-00${i}.\n\n---\n${randomOfficial.signatureText}`,
        authorId: randomAuthor === 'Admin' ? 1 : 2,
        authorName: randomAuthor,
        createdAt: getRandomDate(),
        updatedAt: new Date().toISOString(),
        status: 'Saved'
      });
    }
  }

  await tx.done;
};

// Generic DB Helpers
export const getAll = async (storeName) => {
  const db = await initDB();
  return db.getAll(storeName);
};

export const getById = async (storeName, id) => {
  const db = await initDB();
  return db.get(storeName, id);
};

export const getByIndex = async (storeName, indexName, key) => {
  const db = await initDB();
  return db.getAllFromIndex(storeName, indexName, key);
};

export const add = async (storeName, data) => {
  const db = await initDB();
  return db.add(storeName, data);
};

export const update = async (storeName, data) => {
  const db = await initDB();
  return db.put(storeName, data);
};

export const remove = async (storeName, id) => {
  const db = await initDB();
  return db.delete(storeName, id);
};

export const restoreDatabase = async (jsonData) => {
  const db = await initDB();
  const tx = db.transaction(['users', 'officials', 'canalWires'], 'readwrite');

  // 1. Clear existing stores
  await tx.objectStore('users').clear();
  await tx.objectStore('officials').clear();
  await tx.objectStore('canalWires').clear();

  // 2. Restore Users
  if (jsonData.users && Array.isArray(jsonData.users)) {
    for (const user of jsonData.users) {
      await tx.objectStore('users').put(user);
    }
  }

  // 3. Restore Officials
  if (jsonData.officials && Array.isArray(jsonData.officials)) {
    for (const official of jsonData.officials) {
      await tx.objectStore('officials').put(official);
    }
  }

  // 4. Restore Canal Wires
  if (jsonData.canalWires && Array.isArray(jsonData.canalWires)) {
    for (const wire of jsonData.canalWires) {
      await tx.objectStore('canalWires').put(wire);
    }
  }

  await tx.done;
  return true;
};
