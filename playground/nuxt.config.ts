export default defineNuxtConfig({
  modules: ['../src/module', "@nuxtjs/tailwindcss"],
  ssr:false,
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