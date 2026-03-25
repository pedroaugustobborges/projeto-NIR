/**
 * WhatsApp API Service
 *
 * This service integrates with the Colmeia API for sending WhatsApp messages.
 * Implements proper token generation and auto-refresh.
 * Supports dynamic hospital/campaign configuration per template.
 */

import { HOSPITALS } from '../types';

// Colmeia API Configuration from environment variables
const COLMEIA_CONFIG = {
  baseUrl: "https://api.colmeia.me/v1/rest",
  tokenId: import.meta.env.VITE_COLMEIA_TOKEN_ID || "",
  email: import.meta.env.VITE_COLMEIA_EMAIL || "",
  password: import.meta.env.VITE_COLMEIA_PASSWORD || "",
  // Default values (fallback for backward compatibility)
  socialNetworkId: import.meta.env.VITE_COLMEIA_SOCIAL_NETWORK_ID || "",
  idCampaignAction: import.meta.env.VITE_COLMEIA_CAMPAIGN_ACTION_ID || "",
};

// Token cache - now keyed by socialNetworkId for multiple hospitals
const tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

interface SendIndividualParams {
  phone: string;
  templateId: string;
  parameters: Record<string, string>;
  hospitalId?: string;
  campaignActionId?: string;
}

interface SendMessageResult {
  success: boolean;
  message: string;
  errorType?: 'invalid_campaign' | 'parameter_mismatch' | 'missing_parameter' | 'api_error' | 'network_error';
  errorDetails?: {
    expectedParams?: string[];
    receivedParams?: string[];
    description?: string;
  };
}

interface ColmeiaErrorResponse {
  type: string;
  status: number;
  error?: {
    id: string;
    descriptions: Array<{ msg: string }>;
  };
}

interface ColmeiaSuccessResponse {
  contactsWithErrors?: Array<{
    errorDescription: string;
    contact: Record<string, string>;
    values: string[];
    metadata: string[];
    isEmptyRowOrInvalidFields: boolean;
  }>;
  contactsSentSuccessLength: number;
}

interface ColmeiaTokenResponse {
  token: string;
  type?: string;
  status?: number;
}

/**
 * Hash password using SHA256 (uppercase hex)
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex.toUpperCase();
}

/**
 * Get hospital configuration
 */
function getHospitalConfig(hospitalId?: string): { socialNetworkId: string; tokenId: string } {
  if (!hospitalId) {
    return {
      socialNetworkId: COLMEIA_CONFIG.socialNetworkId,
      tokenId: COLMEIA_CONFIG.tokenId,
    };
  }

  const hospital = HOSPITALS.find(h => h.id === hospitalId);
  if (hospital) {
    return {
      socialNetworkId: hospital.socialNetworkId,
      tokenId: hospital.tokenId || COLMEIA_CONFIG.tokenId,
    };
  }

  return {
    socialNetworkId: COLMEIA_CONFIG.socialNetworkId,
    tokenId: COLMEIA_CONFIG.tokenId,
  };
}

/**
 * Get the social network ID for a hospital
 */
function getSocialNetworkId(hospitalId?: string): string {
  return getHospitalConfig(hospitalId).socialNetworkId;
}

/**
 * Generate authentication token from Colmeia API
 */
async function generateToken(socialNetworkId: string, tokenId: string): Promise<string> {
  console.log("[Colmeia] Generating new authentication token for socialNetworkId:", socialNetworkId);

  if (!tokenId || !COLMEIA_CONFIG.email || !COLMEIA_CONFIG.password) {
    throw new Error(
      "Credenciais da Colmeia não configuradas. Verifique as variáveis de ambiente."
    );
  }

  const hashedPassword = await hashPassword(COLMEIA_CONFIG.password);

  const response = await fetch(`${COLMEIA_CONFIG.baseUrl}/generate-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      idSocialNetwork: socialNetworkId,
    },
    body: JSON.stringify({
      idTokenToRefresh: tokenId,
      email: COLMEIA_CONFIG.email,
      password: hashedPassword,
    }),
  });

  const responseText = await response.text();
  console.log("[Colmeia] Token generation response:", response.status, responseText);

  if (!response.ok) {
    // Provide more helpful error message for 401
    if (response.status === 401) {
      const hospital = HOSPITALS.find(h => h.socialNetworkId === socialNetworkId);
      const hospitalName = hospital?.name || 'desconhecido';
      throw new Error(
        `Falha na autenticação para ${hospitalName}. Verifique se o Token ID está configurado corretamente (VITE_COLMEIA_TOKEN_ID_${hospitalName}).`
      );
    }
    throw new Error(`Falha na autenticação: ${response.status} - ${responseText}`);
  }

  const data: ColmeiaTokenResponse = JSON.parse(responseText);

  if (!data.token) {
    throw new Error("Token não retornado pela API");
  }

  // Cache token for 55 minutes (token expires in 1 hour)
  tokenCache.set(socialNetworkId, {
    token: data.token,
    expiresAt: Date.now() + 55 * 60 * 1000,
  });

  console.log("[Colmeia] Token generated successfully for:", socialNetworkId);
  return data.token;
}

/**
 * Get valid authentication token (generates new one if expired)
 */
async function getAuthToken(socialNetworkId: string, tokenId: string): Promise<string> {
  // Check if we have a valid cached token for this socialNetworkId
  const cached = tokenCache.get(socialNetworkId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  // Generate new token
  return generateToken(socialNetworkId, tokenId);
}

// Contact type for Colmeia API
interface ColmeiaContact {
  Celular: string;
  [key: string]: string;
}

// Campaign configuration for dynamic sending
interface CampaignConfig {
  socialNetworkId: string;
  campaignActionId: string;
  tokenId: string;
}

/**
 * Parse Colmeia API response and extract error details
 */
function parseColmeiaResponse(
  status: number,
  responseText: string
): SendMessageResult {
  try {
    const data = JSON.parse(responseText);

    // Check for 400 Bad Request - Invalid campaign ID
    if (status === 400 && data.type === "error") {
      const errorData = data as ColmeiaErrorResponse;
      const errorId = errorData.error?.id || "";
      const errorMsg = errorData.error?.descriptions?.[0]?.msg || "Erro desconhecido";

      if (errorId === "idCampaignActionMissingOrInvalid") {
        return {
          success: false,
          message: "ID da Campanha inválido ou não encontrado. Verifique a configuração do template.",
          errorType: "invalid_campaign",
          errorDetails: {
            description: errorMsg,
          },
        };
      }

      return {
        success: false,
        message: `Erro da API: ${errorMsg}`,
        errorType: "api_error",
        errorDetails: {
          description: errorMsg,
        },
      };
    }

    // Check for 201 Created but with contactsWithErrors
    if (status === 201 || status === 200) {
      const successData = data as ColmeiaSuccessResponse;

      if (successData.contactsWithErrors && successData.contactsWithErrors.length > 0) {
        const firstError = successData.contactsWithErrors[0];
        const expectedParams = firstError.metadata || [];
        const receivedParams = Object.keys(firstError.contact || {});

        // Determine error type
        let errorType: SendMessageResult["errorType"] = "parameter_mismatch";
        let message = "Erro nos parâmetros do template.";

        if (firstError.isEmptyRowOrInvalidFields) {
          // Check if it's a missing parameter or mismatch
          const missingParams = expectedParams.filter(
            (p) => !receivedParams.map((r) => r.toLowerCase()).includes(p.toLowerCase())
          );

          if (missingParams.length > 0) {
            errorType = "missing_parameter";
            message = `Parâmetro(s) faltando: ${missingParams.join(", ")}. Esperado: ${expectedParams.join(", ")}.`;
          } else {
            message = `Os nomes dos parâmetros não correspondem ao template. Esperado: ${expectedParams.join(", ")}. Recebido: ${receivedParams.join(", ")}.`;
          }
        }

        return {
          success: false,
          message,
          errorType,
          errorDetails: {
            expectedParams,
            receivedParams,
            description: firstError.errorDescription,
          },
        };
      }

      // Check if any messages were sent successfully
      if (successData.contactsSentSuccessLength === 0) {
        return {
          success: false,
          message: "Nenhuma mensagem foi enviada. Verifique os dados.",
          errorType: "api_error",
        };
      }

      return {
        success: true,
        message: "Mensagem enviada com sucesso via WhatsApp",
      };
    }

    // Generic error for other status codes
    return {
      success: false,
      message: `Erro da API Colmeia: ${status} - ${responseText}`,
      errorType: "api_error",
    };
  } catch {
    // JSON parsing failed
    return {
      success: false,
      message: `Erro da API Colmeia: ${status} - ${responseText}`,
      errorType: "api_error",
    };
  }
}

/**
 * Send campaign via Colmeia API
 */
async function sendCampaign(
  contacts: ColmeiaContact[],
  config?: CampaignConfig
): Promise<SendMessageResult> {
  const socialNetworkId = config?.socialNetworkId || COLMEIA_CONFIG.socialNetworkId;
  const campaignActionId = config?.campaignActionId || COLMEIA_CONFIG.idCampaignAction;
  const tokenId = config?.tokenId || COLMEIA_CONFIG.tokenId;

  console.log("[Colmeia] Sending campaign to", contacts.length, "contacts");
  console.log("[Colmeia] Using socialNetworkId:", socialNetworkId);
  console.log("[Colmeia] Using campaignActionId:", campaignActionId);
  console.log("[Colmeia] Contact list:", JSON.stringify(contacts, null, 2));

  // Validate configuration
  if (!socialNetworkId) {
    return {
      success: false,
      message: "Hospital não configurado no template. Edite o template e selecione um hospital.",
      errorType: "invalid_campaign",
    };
  }

  if (!campaignActionId) {
    return {
      success: false,
      message: "ID da Campanha não configurado no template. Edite o template e adicione o ID da campanha.",
      errorType: "invalid_campaign",
    };
  }

  if (!tokenId) {
    const hospital = HOSPITALS.find(h => h.socialNetworkId === socialNetworkId);
    const hospitalName = hospital?.name || 'este hospital';
    return {
      success: false,
      message: `Token ID não configurado para ${hospitalName}. Adicione VITE_COLMEIA_TOKEN_ID_${hospital?.name || 'HOSPITAL'} nas variáveis de ambiente.`,
      errorType: "invalid_campaign",
    };
  }

  try {
    const authToken = await getAuthToken(socialNetworkId, tokenId);
    console.log("[Colmeia] Using token:", authToken.substring(0, 10) + "...");

    const response = await fetch(
      `${COLMEIA_CONFIG.baseUrl}/marketing-send-campaign`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
          idSocialNetwork: socialNetworkId,
        },
        body: JSON.stringify({
          idCampaignAction: campaignActionId,
          contactList: contacts,
        }),
      }
    );

    const responseText = await response.text();
    console.log("[Colmeia] Response:", response.status, responseText);

    // If unauthorized, try to refresh token and retry once
    if (response.status === 401) {
      console.log("[Colmeia] Token expired, refreshing...");
      tokenCache.delete(socialNetworkId);

      const newToken = await getAuthToken(socialNetworkId, tokenId);
      const retryResponse = await fetch(
        `${COLMEIA_CONFIG.baseUrl}/marketing-send-campaign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: newToken,
            idSocialNetwork: socialNetworkId,
          },
          body: JSON.stringify({
            idCampaignAction: campaignActionId,
            contactList: contacts,
          }),
        }
      );

      const retryText = await retryResponse.text();
      console.log("[Colmeia] Retry response:", retryResponse.status, retryText);

      return parseColmeiaResponse(retryResponse.status, retryText);
    }

    return parseColmeiaResponse(response.status, responseText);
  } catch (error) {
    console.error("[Colmeia] Error in sendCampaign:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro de conexão ao enviar mensagem",
      errorType: "network_error",
    };
  }
}

export const whatsappService = {
  /**
   * Send individual WhatsApp message
   */
  async sendIndividual(
    params: SendIndividualParams
  ): Promise<SendMessageResult> {
    try {
      const { phone, parameters, hospitalId, campaignActionId } = params;

      // Validate phone number
      let cleanPhone = phone.replace(/\D/g, "");

      // Add country code if not present
      if (cleanPhone.length === 10 || cleanPhone.length === 11) {
        cleanPhone = "55" + cleanPhone;
      }

      if (cleanPhone.length < 12 || cleanPhone.length > 13) {
        return {
          success: false,
          message: "Número de telefone inválido",
        };
      }

      // Build contact object with parameters
      const contact: ColmeiaContact = {
        Celular: cleanPhone,
        ...parameters,
      };

      // Build campaign config if hospital/campaign IDs are provided
      const hospitalConfig = getHospitalConfig(hospitalId);
      const campaignConfig: CampaignConfig | undefined =
        hospitalId && campaignActionId
          ? {
              socialNetworkId: hospitalConfig.socialNetworkId,
              campaignActionId,
              tokenId: hospitalConfig.tokenId,
            }
          : undefined;

      console.log(
        "[Colmeia] Sending message to:",
        cleanPhone,
        "with params:",
        contact,
        "config:",
        campaignConfig
      );

      const result = await sendCampaign([contact], campaignConfig);

      return result;
    } catch (error) {
      console.error("[Colmeia] Error sending message:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao enviar mensagem",
      };
    }
  },

  /**
   * Send bulk WhatsApp messages
   */
  async sendBulk(
    contacts: Array<{
      phone: string;
      [key: string]: string | undefined;
    }>,
    hospitalId?: string,
    campaignActionId?: string
  ): Promise<SendMessageResult> {
    try {
      // Transform contacts to Colmeia format
      const colmeiaContacts = contacts.map((contact) => {
        let cleanPhone = contact.phone.replace(/\D/g, "");

        // Add country code if not present
        if (cleanPhone.length === 10 || cleanPhone.length === 11) {
          cleanPhone = "55" + cleanPhone;
        }

        const colmeiaContact: ColmeiaContact = {
          Celular: cleanPhone,
        };

        // Copy all other parameters (excluding phone)
        Object.keys(contact).forEach((key) => {
          if (key !== "phone" && contact[key]) {
            colmeiaContact[key] = contact[key] as string;
          }
        });

        return colmeiaContact;
      });

      // Build campaign config if hospital/campaign IDs are provided
      const hospitalConfig = getHospitalConfig(hospitalId);
      const campaignConfig: CampaignConfig | undefined =
        hospitalId && campaignActionId
          ? {
              socialNetworkId: hospitalConfig.socialNetworkId,
              campaignActionId,
              tokenId: hospitalConfig.tokenId,
            }
          : undefined;

      console.log(
        "[Colmeia] Sending bulk messages to",
        colmeiaContacts.length,
        "contacts",
        "config:",
        campaignConfig
      );

      const result = await sendCampaign(colmeiaContacts, campaignConfig);

      if (result.success) {
        result.message = `${contacts.length} mensagens enviadas com sucesso`;
      }

      return result;
    } catch (error) {
      console.error("[Colmeia] Error sending bulk messages:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao enviar mensagens",
      };
    }
  },

  /**
   * Format phone number to Brazilian format
   */
  formatPhone(phone: string): string {
    const clean = phone.replace(/\D/g, "");

    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    } else if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }

    return phone;
  },

  /**
   * Validate phone number
   */
  isValidPhone(phone: string): boolean {
    const clean = phone.replace(/\D/g, "");
    return clean.length >= 10 && clean.length <= 13;
  },

  /**
   * Force token refresh (useful for debugging)
   */
  async refreshToken(hospitalId?: string): Promise<void> {
    const hospitalConfig = getHospitalConfig(hospitalId);
    tokenCache.delete(hospitalConfig.socialNetworkId);
    await getAuthToken(hospitalConfig.socialNetworkId, hospitalConfig.tokenId);
  },

  /**
   * Get the social network ID for a hospital
   */
  getSocialNetworkIdForHospital(hospitalId: string): string {
    return getSocialNetworkId(hospitalId);
  },
};
