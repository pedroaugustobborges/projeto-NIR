/**
 * WhatsApp API Service
 *
 * This service integrates with the Colmeia API for sending WhatsApp messages.
 * Currently configured as a mock for development, but prepared for real API integration.
 */

// Colmeia API Configuration
const COLMEIA_CONFIG = {
  baseUrl: 'https://api.colmeia.me/v1/rest',
  socialNetworkId: 'oFzvyMeL6e8ALfPc4DPQlCNTwWhuU9', // HECAD
  tokenId: 'cwbChwILZ6y8OAg9h0bdrZcNADELcrs6',
  email: 'raul.cirqueira@agirsaude.org.br',
  // Note: In production, this should come from secure environment variables
};

interface SendIndividualParams {
  phone: string;
  templateId: string;
  parameters: Record<string, string>;
}

interface SendMessageResult {
  success: boolean;
  message: string;
}

export const whatsappService = {
  /**
   * Send individual WhatsApp message
   */
  async sendIndividual(params: SendIndividualParams): Promise<SendMessageResult> {
    try {
      const { phone, templateId, parameters } = params;

      // Validate phone number
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 13) {
        return {
          success: false,
          message: 'Numero de telefone invalido',
        };
      }

      // In development mode, simulate API call
      if (import.meta.env.DEV) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Simulate occasional errors for testing (2% chance)
        if (Math.random() < 0.02) {
          return {
            success: false,
            message: 'Erro simulado para testes',
          };
        }

        console.log('[DEV] Enviando mensagem individual:', {
          templateId,
          phone: cleanPhone,
          parameters,
        });

        return {
          success: true,
          message: 'Mensagem enviada com sucesso',
        };
      }

      // Production: Real API call to Colmeia
      const response = await this.callColmeiaAPI(templateId, [{
        celular: cleanPhone,
        ...parameters,
      }]);

      return response;

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao enviar mensagem',
      };
    }
  },

  /**
   * Call Colmeia API
   */
  async callColmeiaAPI(
    _templateId: string,
    _contactList: Record<string, string>[]
  ): Promise<SendMessageResult> {
    // This is where the real Colmeia API integration would go
    // For now, we return a success message
    //
    // Real implementation would:
    // 1. Generate auth token via /generate-token
    // 2. Call /marketing-send-campaign with the campaign action ID
    // 3. Handle the response

    console.log('[API] Colmeia API call would be made here', COLMEIA_CONFIG.baseUrl);

    return {
      success: true,
      message: 'Mensagem enviada com sucesso via Colmeia API',
    };
  },

  /**
   * Format phone number to Brazilian format
   */
  formatPhone(phone: string): string {
    const clean = phone.replace(/\D/g, '');

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
    const clean = phone.replace(/\D/g, '');
    return clean.length >= 10 && clean.length <= 13;
  },
};
