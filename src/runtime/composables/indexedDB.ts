//#region Imports
// @ts-ignore
import CapModule from '#capModule';
//#endregion

//#region Variables
let DB_NAME: string = CapModule.database.db_name;
let DB_VERSION: number = CapModule.database.version || 1;
let DB: IDBDatabase | null = null;
//#endregion

//#region Helpers

// تابع retry با backoff نمایی
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 5,
  delay = 200
): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= retries) throw err;
      await new Promise(res => setTimeout(res, delay * Math.pow(2, attempt))); // backoff
    }
  }
  throw new Error("عملیات بعد از چند بار تلاش ناموفق بود");
}

// بستن همه کانکشن‌های باز (پیشگیری از lock)
async function closeConnectionsIfLocked() {
  if (typeof (window as any).indexedDB?.databases === "function") {
    const dbs = await (window as any).indexedDB.databases();
    for (const db of dbs) {
      if (db.name === DB_NAME) {
        const openReq = indexedDB.open(DB_NAME);
        openReq.onsuccess = () => {
          openReq.result.close();
        };
      }
    }
  }
}

//#endregion

//#region IndexedDB Initialization
export const IndexDB = async (): Promise<IDBDatabase> => {
  return withRetry(async () => {
    if (DB) return DB;

    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("خطا در باز کردن دیتابیس"));
      };

      request.onsuccess = () => {
        DB = request.result;
        DB.onclose = async () => {
          DB = null;
          await closeConnectionsIfLocked();
        };
        resolve(DB);
      };

      request.onupgradeneeded = (e: any) => {
        const db = e.target.result as IDBDatabase;
        CapModule.database.tables_name.forEach((table: string) => {
          if (!db.objectStoreNames.contains(table)) {
            db.createObjectStore(table);
          }
        });
      };
    });
  });
};
//#endregion

//#region Insert Data
export const IndexDBInsert = async (
  tableName: string,
  field: string,
  value: any,
  ExpireTime: number | null = null
) => {
  try {
    await withRetry(async () => {
      const db = await IndexDB();
      return new Promise<void>((resolve, reject) => {
        const trans = db.transaction([tableName], "readwrite");
        const store = trans.objectStore(tableName);

        store.put(value, field);

        if (ExpireTime) {
          const expireAt = Date.now() + ExpireTime * 1000;
          store.put(expireAt, `${field}_expireAt`);
        }

        trans.oncomplete = () => resolve();
        trans.onerror = (e) => reject(e);
      });
    });

    return { state: true, message: "داده با موفقیت درج شد" };
  } catch (e) {
    return { state: false, message: "خطا در درج داده" };
  }
};
//#endregion

//#region Remove Data
export const IndexDBRemove = async (Table: string, field: string) => {
  try {
    await withRetry(async () => {
      const db = await IndexDB();
      return new Promise<void>((resolve, reject) => {
        const trans = db.transaction([Table], "readwrite");
        const store = trans.objectStore(Table);
        store.delete(field);

        trans.oncomplete = () => resolve();
        trans.onerror = (e) => reject(e);
      });
    });

    return { state: true, message: "داده با موفقیت حذف شد" };
  } catch (e) {
    return { state: false, message: "خطا در حذف داده" };
  }
};
//#endregion

//#region Get Data
export const IndexDBGet = async (Table: string, field: string) => {
  try {
    const db = await IndexDB();
    return new Promise<any>((resolve, reject) => {
      const trans = db.transaction([Table], "readonly");
      const store = trans.objectStore(Table);
      const req = store.get(field);

      req.onsuccess = () => {
        const expireReq = store.get(`${field}_expireAt`);
        expireReq.onsuccess = () => {
          const expireAt = expireReq.result;
          if (expireAt && Date.now() > expireAt) {
            resolve(null); // داده منقضی شده
          } else {
            resolve(req.result);
          }
        };
      };
      req.onerror = (e) => reject(e);
    });
  } catch (e) {
    return null;
  }
};
//#endregion

//#region Get All Keys
export const IndexDBGetAllKeys = async (Table: string) => {
  try {
    const db = await IndexDB();
    return new Promise<any[]>((resolve, reject) => {
      const trans = db.transaction([Table], "readonly");
      const store = trans.objectStore(Table);
      const req = store.getAllKeys();

      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e);
    });
  } catch {
    return null;
  }
};
//#endregion

//#region Get All Values
export const IndexDBGetAll = async (Table: string) => {
  try {
    const db = await IndexDB();
    return new Promise<any[]>((resolve, reject) => {
      const trans = db.transaction([Table], "readonly");
      const store = trans.objectStore(Table);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e);
    });
  } catch {
    return null;
  }
};
//#endregion

//#region Clear Data
export const IndexDBClear = async (Table: string) => {
  try {
    await withRetry(async () => {
      const db = await IndexDB();
      return new Promise<void>((resolve, reject) => {
        const trans = db.transaction([Table], "readwrite");
        const store = trans.objectStore(Table);
        store.clear();

        trans.oncomplete = () => resolve();
        trans.onerror = (e) => reject(e);
      });
    });

    return { state: true, message: "جدول با موفقیت پاک شد" };
  } catch {
    return { state: false, message: "خطا در پاک‌سازی جدول" };
  }
};
//#endregion
