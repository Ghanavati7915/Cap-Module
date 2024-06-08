//@ts-ignore
import CapModule from '#capModule'

let DB_NAME: string = CapModule.db_name;
let DB_VERSION: number = 1;
let DB: IDBDatabase | null;

export const IndexDB = (tableName:string): Promise<IDBDatabase> => {
  DB_NAME = CapModule.db_name;
  return new Promise((resolve, reject) => {
    if (DB) {return resolve(DB); }
    let request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (e) => {reject('Error opening db');};

    request.onsuccess = (e: any) => {
      DB = e.target.result;
      resolve(DB);
    };

    request.onupgradeneeded = (e) => {
      let db: IDBDatabase = (e.target as IDBOpenDBRequest).result;
      db.createObjectStore(tableName);
    };
  });
}

export const IndexDBInsert = async (Table: string, field: string, value: any, ExpireTime: any|null = null) => {
  let db = await IndexDB(Table);
  return new Promise<void>((resolve) => {
    let trans = db.transaction([Table], 'readwrite');
    trans.oncomplete = () => {
      resolve();
    };
    let store = trans.objectStore(Table);
    store.put(value, field);

    if (ExpireTime){
      const expire = new Date().setSeconds(ExpireTime);
      store.put( expire,`${field}_expireAt`);
    }

  });
}
export const IndexDBRemove = async (Table: string, field: string) => {
  let db = await IndexDB(Table);
  return new Promise<void>((resolve) => {
    let trans = db.transaction([Table], 'readwrite');
    trans.oncomplete = () => {
      resolve();
    };
    let store = trans.objectStore(Table);
    store.delete(field)
    // store.put(null, field);
  });
}
export const IndexDBGet = async (Table: string, field: string) => {
  let db = await IndexDB(Table);
  return new Promise((resolve) => {
    let trans = db.transaction([Table], 'readonly');
    let response: any = null;
    trans.oncomplete = () => {
      resolve(response);
    };
    let store = trans.objectStore(Table);
    store.openCursor().onsuccess = (e: any) => {
      let cursor: IDBCursorWithValue = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        if (cursor.key === field) {
          response = cursor.value;
        } else {
          cursor.continue();
        }
      }
    };
  });
}

export const IndexDBClear = async (Table: string) => {
  let db = await IndexDB(Table);
  return new Promise<void>((resolve) => {
    let trans = db.transaction([Table], 'readwrite');
    trans.oncomplete = () => {
      resolve();
    };
    let store = trans.objectStore(Table);
    store.clear();
  });
}
