//#region Imports
// @ts-ignore
import CapModule from '#capModule'; // Import CapModule
import axios from "axios"; // Import axios for making HTTP requests
import { IndexDBGet } from "./indexedDB"; // Import function to get data from IndexedDB
//#endregion

// Function to use Cap API
export function useCapApi() {
  // Reactive references to store base URL and access token
  const base_url = ref<null | string>(null);
  const access_token = ref<null | string>(null);

  // Function to create and configure an axios instance
  const useAPI = async () => {
    //#region Set Base URL
    // Set the base URL based on the environment
    if (CapModule.environment === "Development") {
      base_url.value = CapModule.development.base_url;
    } else {
      base_url.value = CapModule.production.base_url;
    }
    //#endregion

    //#region Get Access Token
    // Retrieve access token from IndexedDB
    access_token.value = await IndexDBGet('config', 'Access-Token');
    //#endregion

    //#region Create Axios Instance
    // Create and return an axios instance with the configured base URL and headers
    return axios.create({
      baseURL: base_url.value,
      withCredentials: true,
      headers: {
        Authorization: access_token.value ? `Bearer ${access_token.value}` : ''
      }
    });
    //#endregion
  };

  return {
    useAPI // Return the useAPI function
  };
}
