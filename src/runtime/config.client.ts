//#region Import
// @ts-ignore
import {defineNuxtPlugin} from '#app'
// @ts-ignore
import CapModule from '#capModule'
//#endregion
export default defineNuxtPlugin(async (nuxtApp) => {
    if (process.client) {
      const response = await fetch('/cap_module_config.json')
      const configData = await response.json()
      CapModule.db_name = configData.db_name;
      CapModule.client_id = configData.client_id;
      CapModule.is_multi_token = configData.is_multi_token;
      CapModule.environment = configData.environment;
      CapModule.api_methods.user_info = configData.api_methods.user_info;
      CapModule.api_methods.authorization_by_app_code = configData.api_methods.authorization_by_app_code;
      CapModule.production.base_url = configData.production.base_url;
      CapModule.production.redirect_uri = configData.production.redirect_uri;
      CapModule.production.sso_site_url = configData.production.sso_site_url;
      CapModule.development.base_url = configData.development.base_url;
      CapModule.development.redirect_uri = configData.development.redirect_uri;
      CapModule.development.sso_site_url = configData.development.sso_site_url;
    }
})
