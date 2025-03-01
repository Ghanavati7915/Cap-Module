import { ref } from 'vue';
import CapModule from '#capModule';
import axios from "axios";
import { IndexDBGet, IndexDBClear } from "./indexedDB";
import { useCapAuth } from "./capAuth";
import { useRouter } from 'vue-router';

// Function to use Cap API
export function useCapApi() {
  const base_url = ref<any>(null);
  const access_token = ref<any>(null);
  const access_token_expireAt = ref<any>(null);
  const refresh_token = ref<any>(null);
  const refresh_token_expireAt = ref<any>(null);

  const router = useRouter();
  const { refreshToken } = useCapAuth();

  const useAPI = async (withAccessToken: boolean = true) => {
    if (CapModule.environment === "Development")
      base_url.value = CapModule.development.base_url;
    else
      base_url.value = CapModule.production.base_url;

    let axiosInstance: any = null;

    if (withAccessToken) {
      access_token.value = await IndexDBGet('config', 'Access-Token');
      access_token_expireAt.value = await IndexDBGet('config', 'Access-Token_expireAt');
      refresh_token.value = await IndexDBGet('config', 'Refresh-Token');
      refresh_token_expireAt.value = await IndexDBGet('config', 'Refresh-Token_expireAt');

      if (access_token.value) {
        let accessTokenExpired = isTokenExpired(access_token_expireAt.value);

        if (accessTokenExpired && refresh_token.value) {
          let refreshTokenExpired = isTokenExpired(refresh_token_expireAt.value);
          if (!refreshTokenExpired) {
            let _refreshToken = await refreshToken();
            if (_refreshToken.result) {
              access_token.value = _refreshToken.accessToken;
            } else {
              logoutUser();
            }
          }
        }
      }

      axiosInstance = axios.create({
        baseURL: base_url.value,
        withCredentials: true,
        headers: {
          Authorization: access_token.value ? `Bearer ${access_token.value}` : ''
        }
      });
    } else {
      axiosInstance = axios.create({
        baseURL: base_url.value,
        withCredentials: true,
      });
    }

    //#region Add a request interceptor
    axiosInstance.interceptors.request.use((config: any) => {
      if (config.data) {
        for (const key in config.data) {
          if (config.data.hasOwnProperty(key) && typeof config.data[key] === 'string') {
            config.data[key] = convertNumbersToEnglish(config.data[key]);
          }
        }
      }
      return config;
    });
    //#endregion

    //#region Add a response interceptor
    axiosInstance.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        const originalRequest = error.config;

        // جلوگیری از تلاش بی‌پایان برای رفرش توکن
        if (!originalRequest.retryCount) {
          originalRequest.retryCount = 1;
        } else if (originalRequest.retryCount >= 2) {
          logoutUser();
          return Promise.reject(error);
        }

        let currentRefreshToken = await IndexDBGet('config', 'Refresh-Token');

        if (error.response && error.response.status === 401 && currentRefreshToken && !originalRequest._isRetry) {
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

//#region Internal Logout Functions
const logoutUser = () => {
  const tables = CapModule.database.tables_name;
  const environment = CapModule.environment;
  const sso_site_url_production = CapModule.production.sso_site_url;
  const sso_site_url_development = CapModule.development.sso_site_url;

  tables.forEach(async (table: string) => { await IndexDBClear(table); });
  window.location.href = `${environment == 'Production' ? sso_site_url_production : sso_site_url_development}/logout`;
}
//#endregion

//#region Function to check if token is expired
const isTokenExpired = (expireAt: any) => {
  const currentTime = new Date().getTime();
  return currentTime > expireAt;
}
//#endregion

//#region Function to convert Arabic/Farsi numbers to English numbers
const convertNumbersToEnglish = (input: string | number): string => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const farsiNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  let output = input.toString();

  arabicNumbers.forEach((num, index) => {
    output = output.replace(new RegExp(num, 'g'), index.toString());
  });

  farsiNumbers.forEach((num, index) => {
    output = output.replace(new RegExp(num, 'g'), index.toString());
  });

  return output;
};
//#endregion
