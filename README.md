
[![CAP](https://betezadi.ir/_nuxt/img/logo.12e352e.png)](https://i-cap.ir)

Manage Storage, Login and Register Users and API Caller in CAPModule package manager:

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

* **IndexedDB :** Using Browser `IndexedDB` For Store FrontEnd Data .
* **OAuth :** Using `OAuth2` Methods For Login / Register Users And Get Tokens.
* **SSO :** Using `Single Sign On` Services From `CAPco`.
* **API With Credentials.** Axios Combine With SSO Login And Set Token Automatically.

Last Testing With Nuxt Version : **3.11.2**

## Sponsors
<table>
  <tbody>
    <tr>
      <td align="center" valign="middle">
        <a href="https://bit.dev/?utm_source=pnpm&utm_medium=readme" target="_blank">
<img src="https://betezadi.ir/_nuxt/img/logo.12e352e.png" width="150">
</a>
      </td>
    </tr>
  </tbody>
</table>

## Background

In the past, for the development of each project and each version in the front, we needed to write a large amount of code to perform the process of entering, registering, maintaining tokens, as well as calling APIs with the token. This process was time-consuming and also caused problems for developers with different experiences.
It was decided to prepare a complete package of all the company's requirements and provide it to the company's developers.

## Getting Started

-   [Installation](#installation)
-   [Usage Auth](#UsageAuth)
-   [Usage Api](#UsageApi)
-   [Usage DB](#UsageDB)
-   [ExternalConfigFile](#ExternalConfigFile)
-   [Setting](#Setting)

## Installation
Installing Package To Your Project With : 
- pnpm Package Manager :
```shell
 pnpm install @cap/module latest
```
- OR npm Package Manager :
```shell
 npm install @cap/module latest
```
- OR yarn Package Manager :
```shell
 yarn add @cap/module latest
```
--------------------------------

Then, add **@cap/module** to the modules section of your Nuxt configuration:
```javascript
export default defineNuxtConfig({
  modules: ['@cap/module']
})
```

--------------------------------

Finally, add **CapModule** Json Object Property to the Nuxt Config section of your Nuxt configuration:
```javascript
export default defineNuxtConfig({
  CapModule: {
    db_name:'',
    client_id:'',
    is_multi_token: true,
    environment: "Development",
    api_methods : {
      user_info: "",
      authorization_by_app_code: ""
    },
    production : {
      base_url : "",
      redirect_uri: "",
      sso_site_url: ""
    },
    development : {
      base_url : "",
      redirect_uri: "",
      sso_site_url: ""
    }
  }
})
```

## UsageAuth

  To use the services related to login, exit from the user account and check and receive the token, use the following methods:
```javascript
    <script setup lang="ts">
        const { login , logout , checkLogin , userInfo } = useCapAuth();
    </script>
```
- **login** 

By calling this method, the user is transferred to the SSO page in the HUB according to the project settings, and after performing the login or register operation, she is redirected to the page specified in the settings with the name CallBackURL.

- **logout**

By calling this method, all the information related to the logged in user will be removed from the database created in the browser, and after that the developer can issue the transfer command to the guest page.

- **checkLogin**
  
The time to call this method is after the user returns from the SSO page and it requires sending the state and code parameters that are in the Query. The answer of this method is True or False, which will indicate the completion of the login process or an error in performing the operation. Send the information similar to the example below:
```javascript
await checkLogin(route.query.state , route.query.code)
```
- **userInfo**
  
You can call this method to retrieve user information from the backend according to the received and active token.

-------------------------------

## UsageApi

To call different methods from the project's backend, you can use the completed **AXIOS** method, which sends the Token value along with the request in the Header when the user is logged in, as follows:
```javascript
    <script setup lang="ts">
        const capAPI = useCapApi();
        const getReport = async () => {
            const {data} = await (await capAPI.useAPI())({ method: 'get', url : 'user/getAll' })
        }
    </script>
```

-------------------------------

## UsageDB

In this module, it is possible to create a database on the user's browser, which will be created automatically when logging in OR registering.
The value of the title of this database is obtained from the settings, where you can specify a desired name.
4 actions **Insert**, **Get**, **Clear**, **Remove** are currently active.
To use each one, pay attention to the following examples. Also, you don't need to create an Instance in the project and NUXT itself will import the class related to the database.
```javascript
    <script setup lang="ts">
        const insert = async () => {
            await IndexDBInsert('{{ TableName }}', '{{ Key Name }}', '{{ Value }}')
        }
        const get = async () => {
            await IndexDBGet('{{ TableName }}', '{{ Key Name }}')
        }
        const remove = async () => {
            await IndexDBRemove('{{ TableName }}', '{{ Key Name }}')
        }
        const clear = async () => {
            await IndexDBClear('{{ TableName }}')
        }
    </script>
```

-------------------------------

## ExternalConfigFile
You can save the settings related to the project in a separate file outside Nuxt.Config.ts file.
For this, create a file called **cap_module_config.json** in the **public** folder and enter the following values :
```javascript
{
  "db_name": "...",
  "client_id": "...",
  "is_multi_token": true,
  "environment": "Development",
  "api_methods" : {
    "user_info": "Auth/UserInfo",
    "authorization_by_app_code": "Auth/AuthorizationByAppCode"
  },
  "production" : {
    "base_url" : "https://b.abc.com",
    "redirect_uri": "https://abc.com/landing",
    "sso_site_url": "https://sso.abc.com"
  },
  "development" : {
    "base_url" : "https://b.abc.com",
    "redirect_uri": "http://localhost:3000",
    "sso_site_url": "https://sso.abc.com"
  }
}
```
The advantage of this work is that when the output from the project is prepared and placed on the server, you can change the settings related to the connection to the BackEnd without the need to prepare a new output.

## Setting
| **Key**                                 | **Type**   | **Default** | **Description**                                                                                                               |
|-----------------------------------------|------------|-------------|-------------------------------------------------------------------------------------------------------------------------------|
| `db_name`                               | `string`   | empty       | The title of the database that will be created for the project in the browser                                                 |
| `client_id`                             | `string`   | empty       | The key agreed between the IDM service and your project to start SSO authentication services                                  |
| `is_multi_token`                        | `boolean`  | false       | Are there more than one tokens received from BackEnd? Default is false                                                        |
| `environment`                           | `string`   | empty       | The current working environment of the programmer to use the parameters . Default is Development ( Production / Development ) |
| `api_methods.user_info`                 | `string`   | empty       | The address related to the method of receiving user information who has logged in (in Production)                             |
| `api_methods.authorization_by_app_code` | `string`   | empty       | The address related to the method of receiving the token from the HUB (in Production)                                         |
| `production.base_url`                   | `string`   | empty       | The address related to the BackEnd of the project (in Production)                                                             |
| `production.redirect_uri`               | `string`   | empty       | The address of the user hosting page that HUB returns to the project (in Production)                                          |
| `production.sso_site_url`               | `string`   | empty       | The address of the HUB page to perform login and register operations (in Production)                                          |
| `development.base_url`                  | `string`   | empty       | The address related to the BackEnd of the project (in Development)                                                            |
| `development.redirect_uri`              | `string`   | empty       | The address of the user hosting page that HUB returns to the project (in Development)                                         |
| `development.sso_site_url`              | `string`   | empty       | The address of the HUB page to perform login and register operations (in Development)                                         |

## Thank You
Thanks to all colleagues of [CAP Company](https://i-cap.ir)


Author : [Ahmad Ghanavati](mailto:ahmad_ghanavati.ir)








<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt3-db/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://www.npmjs.com/package/nuxt3-db

[npm-downloads-src]: https://img.shields.io/npm/dt/nuxt3-db.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://www.npmjs.com/package/nuxt3-db

[license-src]: https://img.shields.io/npm/l/nuxt3-db.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://www.npmjs.com/package/nuxt3-db
