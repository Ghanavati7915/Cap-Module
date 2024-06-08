//@ts-ignore
import CapModule from '#capModule'
import axios from "axios";
import {IndexDBGet} from "./indexedDB";

export function useCapApi() {
  const base_url = ref<null|string>(null)
  const access_token = ref<null|string>(null)

  const useAPI = async () => {

    if (CapModule.environment == "Development") base_url.value = CapModule.development.base_url;
    else base_url.value = CapModule.production.base_url;

    access_token.value = await IndexDBGet('config','Access-Token');
    return axios.create({
      baseURL: base_url.value,
      withCredentials: true,
      headers: {
        Authorization: access_token.value ? `Bearer ${access_token.value}` : ''
      }
    });
  }

  return {
    useAPI
  }
}
