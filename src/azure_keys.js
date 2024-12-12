// Include required dependencies
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

export async function retrieveSecrets() {
  try {
   
    // Authenticate to Azure using DefaultAzureCredential
    const credential = new DefaultAzureCredential();

    // Create a SecretClient to access secrets from Azure Key Vault
    const vaultName = "abbas-sleiman-keyvault";
    const url = `https://${vaultName}.vault.azure.net`;
    const client = new SecretClient(url, credential);

    // Fetch secrets from Key Vault
    const username = await client.getSecret("UsernameSafe");
    const password = await client.getSecret("PasswordSafe");

    const secrets = {
        username: username.value,
        password: password.value
    }

    return secrets;

  } catch (err) {
    console.error("Error connecting to the database:", err);
    return null;
  }
}
