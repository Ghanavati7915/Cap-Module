//#region Imports
// @ts-ignore
import CapModule from '#capModule';
//#endregion

//#region Variables
let DB_NAME: string = CapModule.database.db_name; // Database name from CapModule
let DB_VERSION: number = 1; // Version of the IndexedDB
let DB: IDBDatabase | null; // Database instance
//#endregion

//#region IndexedDB Initialization
// Function to initialize and open the IndexedDB
export const IndexDB = (): Promise<IDBDatabase | null> => {
  try {
    return new Promise((resolve, reject) => {
      DB_NAME = CapModule.database.db_name;
      debugger;
      if (DB) resolve(DB);
      else {
        // Open IndexedDB
        let request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (e) => {
          reject(e);
        };

        request.onsuccess = (e: any) => {
          DB = (e.target as IDBOpenDBRequest).result;
          resolve(DB);
        };
        request.onupgradeneeded = (e: any) => {
          let db = (e.target as IDBOpenDBRequest).result;
          CapModule.database.tables_name.forEach((table:string) => {
            if (!db.objectStoreNames.contains(table)) {
              db.createObjectStore(table);
            }
          })
        };
      }
    });
  } catch (e) {
    console.error('cap-module ( IndexDB ) Error : ', e);
    return Promise.resolve(null);
  }
};

//#endregion

//#region Insert Data
// Function to insert data into IndexedDB
export const IndexDBInsert = async (tableName: string, field: string, value: any, ExpireTime: any | null = null) => {
  try {
    let db = await IndexDB(); // Ensure DB is initialized and version checked
    if (db) {
      return new Promise<void>((resolve, reject) => {
        let trans = db.transaction([tableName], 'readwrite');
        let store = trans.objectStore(tableName);
        store.put(value, field);
        if (ExpireTime) {
          const expire = new Date().setSeconds(ExpireTime);
          store.put(expire, `${field}_expireAt`);
        }
        trans.oncomplete = () => {
          resolve();
        };
        trans.onerror = () => {
          reject('Transaction error');
        };
      });
    } else {
      return null;
    }
  } catch (e) {
    console.error('cap-module ( IndexDBInsert ) Error : ', e);
    return null;
  }
};

//#endregion

//#region Remove Data
// Function to remove data from IndexedDB
export const IndexDBRemove = async (Table: string, field: string) => {
  try {
    let db = await IndexDB(); // Initialize DB
    if (db) {
      return new Promise<void>((resolve) => {
        let trans = db.transaction([Table], 'readwrite'); // Start transaction
        trans.oncomplete = () => {
          resolve(); // Resolve on transaction complete
        };
        let store = trans.objectStore(Table); // Get object store
        store.delete(field); // Delete field from store
      });
    } else return null
  } catch (e) {
    console.error('cap-module ( IndexDBRemove ) Error : ', e)
    return null;
  }
};
//#endregion

//#region Get Data
// Function to get data from IndexedDB
export const IndexDBGet = async (Table: string, field: string) => {
  try {
    let db = await IndexDB(); // Initialize DB
    if (db) {
      return new Promise((resolve) => {
        let trans = db.transaction([Table], 'readonly'); // Start read-only transaction
        let response: any = null;
        trans.oncomplete = () => {
          resolve(response); // Resolve with response on transaction complete
        };
        let store = trans.objectStore(Table); // Get object store
        store.openCursor().onsuccess = (e: any) => {
          let cursor: IDBCursorWithValue = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            if (cursor.key === field) {
              response = cursor.value; // Set response if cursor key matches field
            } else {
              cursor.continue(); // Continue cursor if key does not match
            }
          }
        };
      });
    } else return null
  } catch (e) {
    console.error('cap-module ( IndexDBGet ) Error : ', e)
    return null;
  }
};
//#endregion

//#region Clear Data
// Function to clear data from IndexedDB
export const IndexDBClear = async (Table: string) => {
  try {
    let db = await IndexDB(); // Initialize DB
    if (db) {
      return new Promise<void>((resolve) => {
        let trans = db.transaction([Table], 'readwrite'); // Start transaction
        trans.oncomplete = () => {
          resolve(); // Resolve on transaction complete
        };
        let store = trans.objectStore(Table); // Get object store
        store.clear(); // Clear all data from store
      });
    } else return null
  } catch (e) {
    console.error('cap-module ( IndexDBClear ) Error : ', e)
    return null;
  }
};
//#endregion
