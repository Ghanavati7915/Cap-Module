import {defineNuxtModule, addPlugin, createResolver, addTemplate, addImports, addImportsDir} from '@nuxt/kit'
import ModuleOptions from './interface/moduleOptions';

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'capModule',
    configKey: 'CapModule',
  },
  // Default configuration options of the Nuxt module
  defaults: {
    db_name:'',
    client_id:'',
    is_multi_token:false,
    environment:'Development',
    api_methods : {
      user_info: '',
      authorization_by_app_code: ''
    },
    production : {
      base_url:'',
      redirect_uri:'',
      sso_site_url:'',
    },
    development : {
      base_url:'',
      redirect_uri:'',
      sso_site_url:'',
    }
  },
  setup(options, _nuxt) {
    //@ts-ignore
    const resolver = createResolver(import.meta.url)

    _nuxt.options.alias['#capModule'] = addTemplate({
      filename: 'cap-oauth.mjs',
      write: true,
      getContents: () => `export default ${JSON.stringify(options, undefined, 2)}`
    }).dst || ''

    //#region Register composables
    // Register composables directory
    addImportsDir(resolver.resolve('./runtime/composables'))
    //#endregion

    //#region Register plugins
    addPlugin({
      src: resolver.resolve('./runtime/config.client'),
      mode: 'all',
    })
    addPlugin({
        src: resolver.resolve('./runtime/plugin'),
        mode: 'all',
      })
    //#endregion

  },
})
