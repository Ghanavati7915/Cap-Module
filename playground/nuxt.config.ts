export default defineNuxtConfig({
  modules: ['../src/module'],
  ssr:false,
  CapModule: {
    client_id:'',
    is_multi_token: true,
    environment: "Development",
    database:{
      version:1,
      db_name:'',
      tables_name:[],
    },
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
