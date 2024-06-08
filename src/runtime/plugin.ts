//#region Import
// @ts-ignore
import {defineNuxtPlugin} from '#app'
// @ts-ignore
import CapModule from '#capModule'
//#endregion

export default defineNuxtPlugin(({ nuxtApp, $config }) => {
  console.log('Plugin injected by CAP Module!')
})
