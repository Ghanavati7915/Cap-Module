//@ts-ignore
import CapModule from '#capModule'
import {useCapApi} from './capApi';
import {IndexDBInsert} from "./indexedDB";

export function useCapAuth() {

  //#region Variable
  const client_id = ref(CapModule.client_id)
  const is_multi_token = ref(CapModule.is_multi_token)
  const redirect_uri_production = ref(CapModule.production.redirect_uri)
  const redirect_uri_development = ref(CapModule.development.redirect_uri)
  const sso_site_url_production = ref(CapModule.production.sso_site_url)
  const sso_site_url_development = ref(CapModule.development.sso_site_url)
  const environment = ref(CapModule.environment)

  const protocol = ref('oauth2')
  const response_type = ref('code')
  const access_type = ref('access_type')
  const scope = ref('openid')
  const state = ref('')
  const code_challenge_method = ref('code_challenge_method')
  //#endregion
  const login = async () => {
    if (process.client) {
      state.value = await generateStateCode();
      await IndexDBInsert('config', 'loginStateCode', state.value);
      window.location.href = `${environment.value == 'Production' ? sso_site_url_production.value : sso_site_url_development.value}/oauth/auth?&protocol=${protocol.value}&response_type=${response_type.value}&${access_type.value}&client_id=${client_id.value}&redirect_uri=${environment.value == 'Production' ? redirect_uri_production.value : redirect_uri_development.value}&scope=${scope.value}&state=${state.value}&${code_challenge_method.value}`
    }
  }
  const logout = async () => {
    try {
      await IndexDBRemove('config', 'Access-Token')
      await IndexDBRemove('config', 'Access-Token_expireAt')
      await IndexDBRemove('config', 'Refresh-Token')
      await IndexDBRemove('config', 'Refresh-Token_expireAt')
      await IndexDBRemove('config', 'UserInfo')
      await IndexDBRemove('config', 'All-Tokens')
      await IndexDBRemove('config', 'All-Tokens_expireAt')
    } catch (e) {
      console.log('logOut Error : ', e)
    }
  }
  const checkLogin = async (state:string , code:string) => {
    if (state) {
      const stateCode = await IndexDBGet('config', 'loginStateCode')
      if (state === stateCode) await IndexDBRemove('config', 'loginStateCode')
    }
    else return false

    if (code) return await authorizationByAppCode(code)
    else return false
  }
  const authorizationByAppCode = async (code: string) => {
    try {
      let capAPI = useCapApi()
      const {data} = await (await capAPI.useAPI())({
        method: 'post',
        url : CapModule.api_methods.authorization_by_app_code,
        data: {
          Code: code,
          Client_id: client_id.value,
        }
      })

      if (data){
        if (is_multi_token.value && data.length > 0) {
          let token = data.find((item: any) => item.isDefault === true)
          if (token === null) token = data[0]

          await IndexDBInsert('config','Access-Token', token.accessToken, token.accessTokenExpiresIn)
          await IndexDBInsert('config','Refresh-Token', token.refreshToken, token.refreshTokenExpiresIn)
          await IndexDBInsert('config','All-Tokens', data, token.accessTokenExpiresIn)

          const profile = await userInfo()
          if (profile.result) return { result: true }
          else return { result: false, message: 'Profile Error' }
        }
        else if (!is_multi_token.value) {
          const token = data
          await IndexDBInsert('config','Access-Token', token.accessToken, token.accessTokenExpiresIn)
          await IndexDBInsert('config','Refresh-Token', token.refreshToken, token.refreshTokenExpiresIn)

          const profile = await userInfo()
          if (profile.result) return { result: true }
          else return { result: false, message: 'Profile Error' }
        }
        else return { result: false, message: 'Token Error' }
      }
      else {
        return { result: false, message: 'Data NotFound & Error' }
      }

    } catch (e) {
      console.log('e : ', e)
      return {result: false, message: 'Login Error'}
    }
  }
  const generateStateCode = () => {
    let stateCode: string = ''
    const lettersAndNumbers: string[] = [
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'q',
      'r',
      's',
      't',
      'u',
      'v',
      'w',
      'x',
      'y',
      'z',
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ]
    for (let i = 1; i <= 15; i++) {
      stateCode += lettersAndNumbers[Math.floor(Math.random() * lettersAndNumbers.length)]
    }
    return stateCode
  }
  const userInfo = async () => {
    try {
      await new Promise((r) => setTimeout(r, 1000))

      let capAPI = useCapApi()
      const {data} = await (await capAPI.useAPI())({ method: 'get', url : CapModule.api_methods.user_info })

      await IndexDBInsert('config', 'UserInfo', {
        firstName: data.firstName,
        lastName: data.lastName,
        userName: data.userame,
        mobile: data.mobile,
        permissions: data.permissions,
      });

      return { result: true }
    } catch (e) {
      return { result: false }
    }
  }

  return {
    login,
    logout,
    userInfo,
    checkLogin,
  }
}
