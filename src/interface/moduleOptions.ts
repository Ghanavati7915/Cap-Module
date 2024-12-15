//#region ModuleOptions Interface

/**
 * Interface representing the options for the module configuration.
 */
export default interface ModuleOptions {
  //#region Client Configuration
  /**
   * Client ID for authentication purposes.
   */
  client_id: string;

  /**
   * Flag to indicate if multiple tokens are supported.
   */
  is_multi_token: boolean;


  //#region Database and Client Configuration
  database:{
    /**
     * Version of the database.
     */
    version: number;
    /**
     * Name of the database.
     */
    db_name: string;
    /**
     * Name of the database.
     */
    tables_name:string[];
  }
  //#endregion

  //#region Environment Settings

  /**
   * The current environment (Development or Production).
   */
  environment: string;

  //#endregion

  //#region API Methods

  /**
   * Object containing API method endpoints.
   */
  api_methods: {
    /**
     * Endpoint for fetching user information.
     */
    user_info: string;

    /**
     * Endpoint for authorization using an app code.
     */
    authorization_by_app_code: string;

    /**
     * Endpoint for refresh Token using an app code.
     */
    refresh_token: string;
  };

  //#endregion

  //#region Production Settings

  /**
   * Configuration settings specific to the production environment.
   */
  production: {
    /**
     * Base URL for API requests in production.
     */
    base_url: string;

    /**
     * Redirect URI for OAuth in production.
     */
    redirect_uri: string;

    /**
     * Single Sign-On site URL for production.
     */
    sso_site_url: string;
  };

  //#endregion

  //#region Development Settings

  /**
   * Configuration settings specific to the development environment.
   */
  development: {
    /**
     * Base URL for API requests in development.
     */
    base_url: string;

    /**
     * Redirect URI for OAuth in development.
     */
    redirect_uri: string;

    /**
     * Single Sign-On site URL for development.
     */
    sso_site_url: string;
  };

  //#endregion
}

//#endregion
