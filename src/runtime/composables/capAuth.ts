
//#region Imports
import { ref } from 'vue'; // ref From Vue
// @ts-ignore
import CapModule from '#capModule'; // Import CapModule for configuration details
import { jwtDecode, type JwtPayload } from "jwt-decode";
import { useCapApi } from './capApi'; // Import the Cap API utility
import {IndexDBInsert, IndexDBGet, IndexDBRemove, IndexDBClear} from "./indexedDB"; // Import IndexedDB utilities
//#endregion

// Function to handle Cap Authentication
export function useCapAuth() {
  //#region Variables
  const tables = ref(CapModule.database.tables_name); // DataBase Tables Name from CapModule

  const client_id = ref(CapModule.client_id); // Client ID from CapModule
  const app_code = ref(CapModule.app_code); // App Code from CapModule
  const is_multi_token = ref(CapModule.is_multi_token); // Multi-token support flag from CapModule
  const redirect_uri_production = ref(CapModule.production.redirect_uri); // Redirect URI for production
  const redirect_uri_development = ref(CapModule.development.redirect_uri); // Redirect URI for development
  const sso_site_url_production = ref(CapModule.production.sso_site_url); // SSO site URL for production
  const sso_site_url_development = ref(CapModule.development.sso_site_url); // SSO site URL for development
  const environment = ref(CapModule.environment); // Current environment from CapModule

  const protocol = ref('oauth2'); // OAuth2 protocol
  const response_type = ref('code'); // Response type for OAuth2
  const access_type = ref('access_type'); // Access type for OAuth2
  const scope = ref('openid'); // Scope for OAuth2
  const state = ref(''); // State for OAuth2
  const code_challenge_method = ref('code_challenge_method'); // Code challenge method for OAuth2
  //#endregion

  //#region Login
  // Function to initiate login process
  const login = async (redirect_to_internal_page : string | null = null) => {
    if (process.client) {
      state.value = generateStateCode(); // Generate a state code
      await IndexDBInsert('config', 'loginStateCode', state.value); // Store the state code in IndexedDB

      let internalRedirect = ''
      if (redirect_to_internal_page) internalRedirect = `?internalPage=${redirect_to_internal_page}`

      // Redirect to SSO site with the appropriate parameters
      window.location.href = `${environment.value == 'Production' ? sso_site_url_production.value : sso_site_url_development.value}/oauth/auth?protocol=${protocol.value}&response_type=${response_type.value}&${access_type.value}&client_id=${client_id.value}&sub_app_code=${app_code.value}&redirect_uri=${environment.value === 'Production' ? redirect_uri_production.value + internalRedirect : redirect_uri_development.value + internalRedirect }&scope=${scope.value}&state=${state.value}&${code_challenge_method.value}`;
    }
  };
  //#endregion

  //#region Logout
  // Function to handle logout process
  const logout = async (removeAll:boolean = true) => {
    if (removeAll) {
      try {
        // Remove tokens and user info from IndexedDB
        tables.value.forEach(async (table : string) => {
          await IndexDBClear(table);
        })

        window.location.href = `${environment.value == 'Production' ? sso_site_url_production.value : sso_site_url_development.value}/logout`;

      }
      catch (e) {
        console.log('logOut Error:', e); // Log error if any
      }
    }
    else{
      try {
        await IndexDBRemove('config', 'Access-Token');
        await IndexDBRemove('config', 'Access-Token_expireAt');
        await IndexDBRemove('config', 'All-Tokens');
        await IndexDBRemove('config', 'All-Tokens_expireAt');
        await IndexDBRemove('config', 'Current-Token');
        await IndexDBRemove('config', 'Current-Token_expireAt');
        await IndexDBRemove('config', 'Refresh-Token');
        await IndexDBRemove('config', 'Refresh-Token_expireAt');
        await IndexDBRemove('config', 'UserInfo');
        window.location.href = `${environment.value == 'Production' ? sso_site_url_production.value : sso_site_url_development.value}/logout`;
      }
      catch (e) {
        console.log('logOut Error:', e); // Log error if any
      }
    }

  };
  //#endregion

  //#region Check Login
  // Function to check login status using state and code
  const checkLogin = async (state: string, code: string) => {
    if (state) {
      const stateCode = await IndexDBGet('config', 'loginStateCode'); // Retrieve the stored state code from IndexedDB
      if (state === stateCode) await IndexDBRemove('config', 'loginStateCode'); // Remove the state code from IndexedDB if it matches
    } else return false;

    if (code) return await authorizationByAppCode(code); // Authorize using the app code if provided
    else return false;
  };
  //#endregion

  //#region Refresh Token
  // Function to renew Token
  const refreshToken = async () => {
    try {
      const capAPI = useCapApi();
      const [currentAccessToken, currentRefreshToken] = await Promise.all([
        IndexDBGet('config', 'Access-Token'),
        IndexDBGet('config', 'Refresh-Token')
      ]);

      if (!currentAccessToken || !currentRefreshToken) {
        console.error('Missing tokens for refresh');
        return { result: false, message: 'Missing tokens' };
      }

      const { data } = await (await capAPI.useAPI(false))({
        method: 'post',
        url: CapModule.api_methods.refresh_token,
        data: {
          accessToken: currentAccessToken,
          refreshToken: currentRefreshToken,
        }
      });

      if (!data) {
        return { result: false, message: 'Refresh Token Error' };
      }

      await processAndSaveTokens(data);
      await refreshUserProfile();

      return { result: true, accessToken: data.accessToken };

    } catch (error) {
      console.error('refreshToken Error:', error);
      return { result: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  };
  //#endregion

  //#region Authorization by App Code
  // Function to handle authorization using app code
  const authorizationByAppCode = async (code: string) => {
    try {
      const capAPI = useCapApi();
      const { data } = await (await capAPI.useAPI(false))({
        method: 'post',
        url: CapModule.api_methods.authorization_by_app_code,
        data: {
          Code: code,
          Client_id: client_id.value,
        }
      });

      if (!data) {
        return { result: false, message: 'Data Not Found' };
      }

      // Handle multi-token scenario
      if (is_multi_token.value) {
        if (!Array.isArray(data) || data.length === 0) {
          return { result: false, message: 'Token Error' };
        }

        const token = findDefaultToken(data);
        await processAndSaveTokens(token);
        await IndexDBInsert('config', 'All-Tokens', data);
      }
      // Handle single token scenario
      else {
        await processAndSaveTokens(data);
      }

      await refreshUserProfile();
      return { result: true };

    } catch (error) {
      console.error('CAP Module API Caller Error:', error);
      return { result: false, message: 'Login Error' };
    }
  };
  //#endregion

  //#region Generate State Code
  // Function to generate a random state code
  const generateStateCode = () => {
    let stateCode = '';
    const lettersAndNumbers = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
    for (let i = 1; i <= 15; i++) {
      stateCode += lettersAndNumbers[Math.floor(Math.random() * lettersAndNumbers.length)];
    }
    return stateCode;
  };
  //#endregion

  //#region User Info
  // Function to get user info
  const userInfo = async () => {
    try {
      await new Promise(r => setTimeout(r, 1000)); // Simulate delay
      let capAPI = useCapApi(); // Get the Cap API instance
      const { data } = await (await capAPI.useAPI())({ method: 'get', url: CapModule.api_methods.user_info });
      // Insert user info into IndexedDB
      await IndexDBInsert('config', 'UserInfo', {...data});
      return { result: true };
    } catch (e) {
      return { result: false };
    }
  };
  //#endregion

  //#region UserLoggedIn
  // Function to get user info
  const getLoggedInUser = async () => {
    try {
      let user = await IndexDBGet('config', 'UserInfo')
      if (user) return user;
      else return null;
    }
    catch (e) {
      return null ;
    }
  };
  //#endregion


  //#region Helper function to process tokens and save to IndexDB
  const processAndSaveTokens = async (tokenData: any) => {
    const JWT_AT: any = jwtDecode<JwtPayload>(tokenData.accessToken);
    let NOWDate = new Date((JWT_AT.exp * 1000));
    NOWDate.setSeconds(NOWDate.getSeconds() - tokenData.accessTokenExpiresIn);
    NOWDate.setSeconds(NOWDate.getSeconds() + tokenData.refreshTokenExpiresIn);
    const refreshTokenExpiry = NOWDate.getTime();

    await Promise.all([
      IndexDBInsert('config', 'Access-Token', tokenData.accessToken),
      IndexDBInsert('config', 'Refresh-Token', tokenData.refreshToken, refreshTokenExpiry, true)
    ]);

    return refreshTokenExpiry;
  };
  //#endregion

  //#region Helper function to handle user profile after token refresh
  const refreshUserProfile = async () => {
    const profile = await userInfo();
    if (!profile.result) {
      throw new Error('Profile Error');
    }
    return true;
  };
  //#endregion

  //#region Helper to find default token
  const findDefaultToken = (tokens: any[]) => {
    return tokens.find((item: any) => item.isDefault === true) || tokens[0];
  };
  //#endregion

  return {
    login,
    logout,
    userInfo,
    checkLogin,
    refreshToken,
    getLoggedInUser,
  };
}
