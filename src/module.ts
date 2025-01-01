import { defineNuxtModule, addPlugin, createResolver, addTemplate, addImportsDir } from '@nuxt/kit'
import type  ModuleOptions from './interface/moduleOptions';

// Define the Nuxt module
export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'cap-module', // Name of the module
    configKey: 'CapModule', // Configuration key in nuxt.config
  },
  // Default configuration options for the Nuxt module
  defaults: {
    client_id: '',
    is_multi_token: false,
    environment: 'Development',
    database:{
      version: 1,
      db_name: '',
      tables_name: [],
    },
    extra:[],
    api_methods: {
      user_info: '',
      authorization_by_app_code: '',
      refresh_token: ''
    },
    production: {
      base_url: '',
      redirect_uri: '',
      sso_site_url: '',
    },
    development: {
      base_url: '',
      redirect_uri: '',
      sso_site_url: '',
    }
  },
  setup(options, _nuxt) {
    // Create a resolver to resolve paths based on the current module's URL
    //@ts-ignore
    const resolver = createResolver(import.meta.url)

    //#region Add Template
    // Add a template to the Nuxt build, providing module options as a JavaScript export
    _nuxt.options.alias['#capModule'] = addTemplate({
      filename: 'cap-oauth.mjs', // Filename for the generated file
      write: true, // Ensure the file is written to disk
      getContents: () => `export default ${JSON.stringify(options, undefined, 2)}` // File contents
    }).dst || ''
    //#endregion

    //#region Register Composables
    // Register composables directory
    addImportsDir(resolver.resolve('./runtime/composables'))
    //#endregion

    //#region Register Plugins
    // Adding client configuration plugin
    addPlugin({
      src: resolver.resolve('./runtime/config.client'), // Path to the plugin file
      mode: 'all', // Load on both client and server
    })

    // Adding general plugin
    addPlugin({
      src: resolver.resolve('./runtime/plugin'), // Path to the plugin file
      mode: 'all', // Load on both client and server
    })
    //#endregion
  },
})
