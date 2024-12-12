import { retrieveSecrets } from "../azure_keys.js";

export async function retrieveConfig() {
  try {
    // retrieve secrets from the key vault
    const secrets = await retrieveSecrets();

    // config for database connection
    const config = {
      server: "abbas-sleiman-server.database.windows.net",
      authentication: {
        type: "default",
        options: {
          userName: secrets.username,
          password: secrets.password,
        },
      },
      options: {
        encrypt: true,
        database: "abbas_sleiman_database",
      },
    };
    
    return config;

  } catch (err) {
    console.log("Error in config: ", err);
    return null;
  }
}
