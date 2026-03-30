import { useState, useEffect } from 'react';
import { Send, Download, Upload, AlertCircle, X, AlertTriangle, Building2, XCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Template, CSVRow, HOSPITALS } from '../types';
import { templateService } from '../services/templateService';
import { whatsappService } from '../services/whatsappService';
import { historyService } from '../services/historyService';
import { useAuth } from '../contexts/AuthContext';
import { parseCSV, downloadSampleCSV } from '../utils/csvParser';
import { Button, Select, FileUpload, Table } from '../components/ui';
import Layout from '../components/layout/Layout';

interface SendResult {
  success: number;
  failed: number;
  errors: Array<{
    phone: string;
    message: string;
    errorType?: string;
    expectedParams?: string[];
    receivedParams?: string[];
  }>;
}

// Helper function to get hospital name from ID
const getHospitalName = (hospitalId?: string | null): string | null => {
  if (!hospitalId) return null;
  const hospital = HOSPITALS.find(h => h.id === hospitalId);
  return hospital?.name || null;
};

export default function BulkSendingPage() {
  const { filterByUserHospitals } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0 });
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const data = await templateService.getAll();
      // Filter templates by user's assigned hospitals
      const filteredData = filterByUserHospitals(data);
      setTemplates(filteredData);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setTemplatesLoading(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setCsvFile(null);
    setCsvData([]);
    setCsvErrors([]);
    setSendResult(null);
  };

  const handleFileChange = async (file: File | null) => {
    setCsvFile(file);
    setCsvData([]);
    setCsvErrors([]);

    if (!file || !selectedTemplate) return;

    try {
      setLoading(true);
      const result = await parseCSV(file, selectedTemplate);

      if (result.errors.length > 0) {
        setCsvErrors(result.errors);
      }

      if (result.data.length > 0) {
        setCsvData(result.data);
      }
    } catch (error) {
      console.error('Erro ao processar CSV:', error);
      toast.error('Erro ao processar arquivo CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = () => {
    if (!selectedTemplate) {
      toast.error('Selecione um template primeiro');
      return;
    }
    downloadSampleCSV(selectedTemplate);
  };

  const handleSubmit = async () => {
    if (!selectedTemplate || csvData.length === 0) return;

    try {
      setSending(true);
      setSendProgress({ sent: 0, total: csvData.length });
      setSendResult(null);

      const result: SendResult = {
        success: 0,
        failed: 0,
        errors: [],
      };

      const successfulPhones: string[] = [];

      // Send messages via WhatsApp API with template's hospital and campaign configuration
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const phoneDigits = row.phone.replace(/\D/g, '');

        // Build parameters object using the actual template parameter names (case-sensitive for Colmeia)
        const parameters: Record<string, string> = {};
        if (selectedTemplate.parameter_1 && row.param_1) parameters[selectedTemplate.parameter_1] = row.param_1;
        if (selectedTemplate.parameter_2 && row.param_2) parameters[selectedTemplate.parameter_2] = row.param_2;
        if (selectedTemplate.parameter_3 && row.param_3) parameters[selectedTemplate.parameter_3] = row.param_3;
        if (selectedTemplate.parameter_4 && row.param_4) parameters[selectedTemplate.parameter_4] = row.param_4;
        if (selectedTemplate.parameter_5 && row.param_5) parameters[selectedTemplate.parameter_5] = row.param_5;
        if (selectedTemplate.parameter_6 && row.param_6) parameters[selectedTemplate.parameter_6] = row.param_6;
        if (selectedTemplate.parameter_7 && row.param_7) parameters[selectedTemplate.parameter_7] = row.param_7;
        if (selectedTemplate.parameter_8 && row.param_8) parameters[selectedTemplate.parameter_8] = row.param_8;
        if (selectedTemplate.parameter_9 && row.param_9) parameters[selectedTemplate.parameter_9] = row.param_9;
        if (selectedTemplate.parameter_10 && row.param_10) parameters[selectedTemplate.parameter_10] = row.param_10;
        if (selectedTemplate.parameter_11 && row.param_11) parameters[selectedTemplate.parameter_11] = row.param_11;
        if (selectedTemplate.parameter_12 && row.param_12) parameters[selectedTemplate.parameter_12] = row.param_12;

        const sendResponse = await whatsappService.sendIndividual({
          phone: phoneDigits,
          templateId: selectedTemplateId,
          parameters,
          hospitalId: selectedTemplate.hospital_id || undefined,
          campaignActionId: selectedTemplate.campaign_action_id || undefined,
        });

        if (sendResponse.success) {
          result.success++;
          let phone = phoneDigits;
          if (phone.length === 10 || phone.length === 11) {
            phone = '55' + phone;
          }
          successfulPhones.push(phone);
        } else {
          result.failed++;
          result.errors.push({
            phone: row.phone,
            message: sendResponse.message,
            errorType: sendResponse.errorType,
            expectedParams: sendResponse.errorDetails?.expectedParams,
            receivedParams: sendResponse.errorDetails?.receivedParams,
          });

          // If it's a configuration error, stop sending (all will fail)
          if (sendResponse.errorType === 'invalid_campaign' || sendResponse.errorType === 'parameter_mismatch' || sendResponse.errorType === 'missing_parameter') {
            // Mark remaining as failed with same error
            for (let j = i + 1; j < csvData.length; j++) {
              result.failed++;
            }
            break;
          }
        }

        setSendProgress({ sent: i + 1, total: csvData.length });
      }

      setSendResult(result);

      // Log bulk sending to history only if there were successes
      if (result.success > 0) {
        await historyService.createBulk({
          template_id: selectedTemplateId,
          template_name: selectedTemplate.name,
          total_sent: result.success,
          description: csvFile?.name || 'Disparo em massa',
          phone_list: successfulPhones,
        });
      }

      // Show appropriate message
      if (result.failed === 0) {
        toast.success(`${result.success} mensagens enviadas com sucesso!`);
        // Reset form only on complete success
        setCsvFile(null);
        setCsvData([]);
        setCsvErrors([]);
      } else if (result.success === 0) {
        toast.error(`Falha ao enviar todas as ${result.failed} mensagens`);
      } else {
        toast.error(`${result.success} enviadas, ${result.failed} falharam`);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagens:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar mensagens';
      toast.error(errorMessage);
    } finally {
      setSending(false);
      setSendProgress({ sent: 0, total: 0 });
    }
  };

  const templateOptions = templates.map((t) => ({
    value: t.id,
    label: t.name,
  }));

  const previewColumns = [
    { key: 'phone', header: 'Telefone' },
    ...(selectedTemplate?.parameter_1 ? [{ key: 'param_1', header: selectedTemplate.parameter_1 }] : []),
    ...(selectedTemplate?.parameter_2 ? [{ key: 'param_2', header: selectedTemplate.parameter_2 }] : []),
    ...(selectedTemplate?.parameter_3 ? [{ key: 'param_3', header: selectedTemplate.parameter_3 }] : []),
    ...(selectedTemplate?.parameter_4 ? [{ key: 'param_4', header: selectedTemplate.parameter_4 }] : []),
    ...(selectedTemplate?.parameter_5 ? [{ key: 'param_5', header: selectedTemplate.parameter_5 }] : []),
    ...(selectedTemplate?.parameter_6 ? [{ key: 'param_6', header: selectedTemplate.parameter_6 }] : []),
    ...(selectedTemplate?.parameter_7 ? [{ key: 'param_7', header: selectedTemplate.parameter_7 }] : []),
    ...(selectedTemplate?.parameter_8 ? [{ key: 'param_8', header: selectedTemplate.parameter_8 }] : []),
    ...(selectedTemplate?.parameter_9 ? [{ key: 'param_9', header: selectedTemplate.parameter_9 }] : []),
    ...(selectedTemplate?.parameter_10 ? [{ key: 'param_10', header: selectedTemplate.parameter_10 }] : []),
    ...(selectedTemplate?.parameter_11 ? [{ key: 'param_11', header: selectedTemplate.parameter_11 }] : []),
    ...(selectedTemplate?.parameter_12 ? [{ key: 'param_12', header: selectedTemplate.parameter_12 }] : []),
  ];

  // Check if template has proper Colmeia configuration
  const hasColmeiaConfig = selectedTemplate?.hospital_id && selectedTemplate?.campaign_action_id;
  const hospitalName = selectedTemplate ? getHospitalName(selectedTemplate.hospital_id) : null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Disparo em Massa</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Envie mensagens para múltiplos contatos usando um arquivo CSV
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Template"
              options={templateOptions}
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              placeholder={templatesLoading ? 'Carregando...' : 'Selecione um template'}
              disabled={templatesLoading || sending}
              required
            />

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleDownloadSample}
                disabled={!selectedTemplateId || sending}
              >
                <Download className="w-4 h-4" />
                Baixar CSV de Exemplo
              </Button>
            </div>
          </div>

          {/* Template configuration indicator */}
          {selectedTemplate && (
            hasColmeiaConfig ? (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <span className="text-sm text-blue-800 dark:text-blue-300">
                    Hospital: <strong>{hospitalName}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Configuração incompleta
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Este template não possui hospital/campanha configurados.
                    Edite o template para definir essas configurações.
                  </p>
                </div>
              </div>
            )
          )}

          {selectedTemplateId && (
            <FileUpload
              label="Arquivo CSV"
              value={csvFile}
              onChange={handleFileChange}
              accept={{ 'text/csv': ['.csv'] }}
              maxSize={10 * 1024 * 1024}
              disabled={sending}
            />
          )}

          {/* Errors */}
          {csvErrors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-medium text-red-800 dark:text-red-400">
                    Erros encontrados no CSV
                  </h4>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    {csvErrors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {csvErrors.length > 5 && (
                      <li className="font-medium">
                        ... e mais {csvErrors.length - 5} erros
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {csvData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Prévia dos Dados ({csvData.length} registros)
                </h3>
                <button
                  onClick={() => {
                    setCsvFile(null);
                    setCsvData([]);
                    setCsvErrors([]);
                  }}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Limpar
                </button>
              </div>

              <div className="max-h-64 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <Table
                  columns={previewColumns}
                  data={csvData.slice(0, 10)}
                  keyExtractor={(_row, index) => String(index)}
                />
              </div>

              {csvData.length > 10 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Mostrando 10 de {csvData.length} registros
                </p>
              )}
            </div>
          )}

          {/* Progress */}
          {sending && (
            <div className="bg-whatsapp-light/10 dark:bg-whatsapp-light/20 border border-whatsapp-light/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-whatsapp-dark dark:border-whatsapp-light"></div>
                <div>
                  <p className="font-medium text-whatsapp-dark dark:text-whatsapp-light">
                    Enviando mensagens...
                  </p>
                  <p className="text-sm text-whatsapp-dark/70 dark:text-whatsapp-light/70">
                    {sendProgress.sent} de {sendProgress.total} enviadas
                  </p>
                </div>
              </div>
              <div className="mt-3 bg-white dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-whatsapp-light transition-all duration-300"
                  style={{
                    width: `${(sendProgress.sent / sendProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Send Results */}
          {sendResult && !sending && (
            <div className="space-y-4">
              {/* Summary */}
              <div className={`p-4 rounded-lg border ${
                sendResult.failed === 0
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : sendResult.success === 0
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              }`}>
                <div className="flex items-center gap-4">
                  {sendResult.failed === 0 ? (
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  )}
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      sendResult.failed === 0
                        ? 'text-green-800 dark:text-green-300'
                        : 'text-red-800 dark:text-red-300'
                    }`}>
                      {sendResult.failed === 0
                        ? 'Todas as mensagens enviadas com sucesso!'
                        : sendResult.success === 0
                          ? 'Falha ao enviar mensagens'
                          : 'Envio parcialmente concluído'}
                    </p>
                    <div className="flex gap-4 mt-1 text-sm">
                      <span className="text-green-700 dark:text-green-400">
                        {sendResult.success} enviadas
                      </span>
                      {sendResult.failed > 0 && (
                        <span className="text-red-700 dark:text-red-400">
                          {sendResult.failed} falharam
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSendResult(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Error Details */}
              {sendResult.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-3">
                      <h4 className="font-medium text-red-800 dark:text-red-300">
                        Detalhes dos erros
                      </h4>

                      {/* First error details */}
                      <div className="text-sm text-red-700 dark:text-red-400 space-y-2">
                        <p><strong>Motivo:</strong> {sendResult.errors[0].message}</p>
                        {sendResult.errors[0].expectedParams && sendResult.errors[0].expectedParams.length > 0 && (
                          <div className="pt-2 border-t border-red-200 dark:border-red-700 space-y-1">
                            <p>
                              <strong>Parâmetros esperados pelo template:</strong>{' '}
                              {sendResult.errors[0].expectedParams.join(', ')}
                            </p>
                            {sendResult.errors[0].receivedParams && (
                              <p>
                                <strong>Parâmetros enviados:</strong>{' '}
                                {sendResult.errors[0].receivedParams.join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Failed phones list */}
                      {sendResult.errors.length > 1 && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-red-700 dark:text-red-400 font-medium">
                            Ver todos os {sendResult.errors.length} telefones com erro
                          </summary>
                          <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                            {sendResult.errors.map((error, index) => (
                              <li key={index} className="text-red-600 dark:text-red-400 font-mono text-xs">
                                {error.phone}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleSubmit}
              disabled={csvData.length === 0 || sending}
              loading={sending}
            >
              <Send className="w-4 h-4" />
              Enviar {csvData.length > 0 ? `${csvData.length} Mensagens` : 'Mensagens'}
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Upload className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800 dark:text-blue-400">
                Como usar o disparo em massa
              </h4>
              <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>Selecione o template que deseja usar</li>
                <li>Baixe o CSV de exemplo para ver o formato correto</li>
                <li>Preencha o CSV com os dados dos contatos (máximo 200 linhas)</li>
                <li>Faça o upload do arquivo preenchido</li>
                <li>Revise os dados e clique em enviar</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
