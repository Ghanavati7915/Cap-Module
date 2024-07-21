//#region Import
// Importing necessary modules with TypeScript ignore comments
// @ts-ignore
import { defineNuxtPlugin } from '#app';
// @ts-ignore
import CapModule from '#capModule';
//#endregion

// Define a Nuxt plugin
export default defineNuxtPlugin(async (nuxtApp) => {
  // Ensure this code only runs on the client side
  if (process.client) {
    // Fetch the configuration data from a JSON file
    const response = await fetch('/cap_module_config.json');
    const configData = await response.json();

    //#region Set CapModule Configuration
    // Set the CapModule properties based on the fetched configuration data
    CapModule.database.db_name = configData.database.db_name;
    CapModule.database.tables_name = configData.database.tables_name;
    CapModule.client_id = configData.client_id;
    CapModule.is_multi_token = configData.is_multi_token;
    CapModule.environment = configData.environment;
    CapModule.api_methods.user_info = configData.api_methods.user_info;
    CapModule.api_methods.refresh_token = configData.api_methods.refresh_token;
    CapModule.api_methods.authorization_by_app_code = configData.api_methods.authorization_by_app_code;
    CapModule.production.base_url = configData.production.base_url;
    CapModule.production.redirect_uri = configData.production.redirect_uri;
    CapModule.production.sso_site_url = configData.production.sso_site_url;
    CapModule.development.base_url = configData.development.base_url;
    CapModule.development.redirect_uri = configData.development.redirect_uri;
    CapModule.development.sso_site_url = configData.development.sso_site_url;
    //#endregion
  }
});
