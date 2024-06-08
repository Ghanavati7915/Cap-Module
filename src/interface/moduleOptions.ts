// Module options TypeScript interface definition
export default interface ModuleOptions {
  db_name : string;
  client_id : string;
  is_multi_token : boolean;
  environment : string; //Development - Production
  api_methods : {
    user_info: string;
    authorization_by_app_code: string;
  },
  production : {
    base_url: string;
    redirect_uri: string;
    sso_site_url: string;
  },
  development : {
    base_url : string;
    redirect_uri : string;
    sso_site_url : string;
  }
}
