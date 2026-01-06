import { ref } from 'vue';
import CapModule from '#capModule';
import axios from "axios";
import { IndexDBGet, IndexDBClear } from "./indexedDB";
import { useCapAuth } from "./capAuth";
import { useRouter } from 'vue-router';

//#region Function to use Cap API
export function useCapApi() {
  const base_url = ref<any>(null);
  const access_token = ref<any>(null);
  const access_token_expireAt = ref<any>(null);
  const refresh_token = ref<any>(null);
  const refresh_token_expireAt = ref<any>(null);

  const router = useRouter();
  const { refreshToken } = useCapAuth();

  const useAPI = async (withAccessToken: boolean = true) => {
    //#region 🔹 تعیین base URL
    base_url.value =
      CapModule.environment === "Development"
        ? CapModule.development.base_url
        : CapModule.production.base_url;
    //#endregion

    let axiosInstance: any = null;

    //#region 🔹 ایجاد instance بر اساس نوع احراز هویت
    if (withAccessToken) {
      access_token.value = await IndexDBGet('config', 'Access-Token');
      access_token_expireAt.value = await IndexDBGet('config', 'Access-Token_expireAt');
      refresh_token.value = await IndexDBGet('config', 'Refresh-Token');
      refresh_token_expireAt.value = await IndexDBGet('config', 'Refresh-Token_expireAt');

      if (access_token.value) {
        const accessTokenExpired = isTokenExpired(access_token_expireAt.value);
        if (accessTokenExpired && refresh_token.value) {
          const refreshTokenExpired = isTokenExpired(refresh_token_expireAt.value);
          if (!refreshTokenExpired) {
            const _refreshToken = await refreshToken();
            if (_refreshToken.result) {
              access_token.value = _refreshToken.accessToken;
            } else logoutUser();
          }
        }
      }

      axiosInstance = axios.create({
        baseURL: base_url.value,
        withCredentials: true,
        headers: {
          Authorization: access_token.value ? `Bearer ${access_token.value}` : null,
          AppCode: CapModule.app_code ? CapModule.app_code : null,
        }
      });
    } else {
      axiosInstance = axios.create({
        baseURL: base_url.value,
        withCredentials: true,
      });
    }
    //#endregion

    //#region 🧩 Request Interceptor
    axiosInstance.interceptors.request.use((config: any) => {

      //#region 🔹 تبدیل اعداد در URL
      if (config.url && typeof config.url === 'string') {
        config.url = convertNumbersToEnglish(config.url);
      }
      //#endregion

      //#region 🔹 تبدیل اعداد در Query Params
      if (config.params && typeof config.params === 'object') {
        for (const key in config.params) {
          if (Object.prototype.hasOwnProperty.call(config.params, key)) {
            const value = config.params[key];
            if (typeof value === 'string' || typeof value === 'number') {
              const converted = convertNumbersToEnglish(value.toString());
              config.params[key] =
                typeof value === 'number' ? Number(converted) : converted;
            }
          }
        }
      }
      //#endregion

      //#region 🔹 تبدیل اعداد در Body (data)
      if (config.data) {
        const contentType =
          config.headers?.['Content-Type'] ||
          config.headers?.common?.['Content-Type'] ||
          '';

        // ✅ اگر از نوع FormData باشد
        if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
          const newFormData = new FormData();
          for (const [key, value] of config.data.entries()) {
            if (typeof value === 'string') {
              newFormData.append(key, convertNumbersToEnglish(value));
            } else {
              newFormData.append(key, value); // فایل‌ها دست‌نخورده
            }
          }
          config.data = newFormData;
        }

        // ✅ اگر JSON Body یا Object معمولی باشد
        else if (typeof config.data === 'object') {
          for (const key in config.data) {
            if (Object.prototype.hasOwnProperty.call(config.data, key)) {
              const value = config.data[key];
              if (typeof value === 'string' || typeof value === 'number') {
                const converted = convertNumbersToEnglish(value.toString());
                config.data[key] =
                  typeof value === 'number' ? Number(converted) : converted;
              }
            }
          }

          // ✅ اگر فرم-urlencoded باشد
          if (contentType.includes('application/x-www-form-urlencoded')) {
            const formBody = Object.keys(config.data)
              .map(
                key =>
                  encodeURIComponent(key) +
                  '=' +
                  encodeURIComponent(config.data[key])
              )
              .join('&');
            config.data = formBody;
          }
        }
      }
      //#endregion

      return config;
    });
    //#endregion

    //#region 🧩 Response Interceptor
    axiosInstance.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        const originalRequest = error.config;

        // جلوگیری از تلاش بی‌پایان
        if (!originalRequest.retryCount) originalRequest.retryCount = 1;
        else if (originalRequest.retryCount >= 2) {
          logoutUser();
          return Promise.reject(error);
        }

        const currentRefreshToken = await IndexDBGet('config', 'Refresh-Token');

        if (
          error.response &&
          error.response.status === 401 &&
          currentRefreshToken &&
          !originalRequest._isRetry
        ) {
          originalRequest._isRetry = true;
          originalRequest.retryCount++;

          try {
            const newAccessToken = await refreshToken();
            if (newAccessToken.result) {
              access_token.value = newAccessToken.accessToken;
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken.accessToken}`;
              return axiosInstance(originalRequest);
            } else {
              logoutUser();
              return Promise.reject();
            }
          } catch (refreshError) {
            logoutUser();
            return Promise.reject(refreshError);
          }
        }

        if (error.response && error.response.status === 401 && !currentRefreshToken) {
          logoutUser();
          return Promise.reject(error);
        }

        if (error.response && error.response.status === 403) {
          router.push(`/error?statusCode=403`);
        }

        return Promise.reject(error);
      }
    );
    //#endregion

    return axiosInstance;
  };

  return { useAPI };
}
//#endregion

//#region 🔒 Internal Logout Function
const logoutUser = () => {
  const tables = CapModule.database.tables_name;
  const environment = CapModule.environment;
  const sso_site_url_production = CapModule.production.sso_site_url;
  const sso_site_url_development = CapModule.development.sso_site_url;

  tables.forEach(async (table: string) => { await IndexDBClear(table); });
  window.location.href = `${environment == 'Production'
    ? sso_site_url_production
    : sso_site_url_development
  }/logout`;
};
//#endregion

//#region ⏱️ Token Expiration Checker
const isTokenExpired = (expireAt: any) => {
  const currentTime = new Date().getTime();
  return currentTime > expireAt;
};
//#endregion

//#region 🔢 Convert Arabic/Farsi numbers to English
const convertNumbersToEnglish = (input: string | number | null | undefined): string => {
  if (input === null || input === undefined) return '';

  return input
    .toString()
    // اعداد فارسی
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    // اعداد عربی
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
};
//#endregion
