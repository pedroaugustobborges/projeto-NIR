import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { Template, TemplateFormData, HOSPITALS } from '../../types';
import { Button, Input, FileUpload, Select } from '../ui';

interface TemplateFormProps {
  template?: Template | null;
  onSubmit: (data: TemplateFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const PARAMETER_LABELS = [
  'Parâmetro 1',
  'Parâmetro 2',
  'Parâmetro 3',
  'Parâmetro 4',
  'Parâmetro 5',
  'Parâmetro 6',
  'Parâmetro 7',
  'Parâmetro 8',
  'Parâmetro 9',
  'Parâmetro 10',
  'Parâmetro 11',
  'Parâmetro 12',
];

export default function TemplateForm({
  template,
  onSubmit,
  onCancel,
  loading = false,
}: TemplateFormProps) {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    hospital_id: '',
    campaign_action_id: '',
    parameter_1: '',
    parameter_2: '',
    parameter_3: '',
    parameter_4: '',
    parameter_5: '',
    parameter_6: '',
    parameter_7: '',
    parameter_8: '',
    parameter_9: '',
    parameter_10: '',
    parameter_11: '',
    parameter_12: '',
    image: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        hospital_id: template.hospital_id || '',
        campaign_action_id: template.campaign_action_id || '',
        parameter_1: template.parameter_1 || '',
        parameter_2: template.parameter_2 || '',
        parameter_3: template.parameter_3 || '',
        parameter_4: template.parameter_4 || '',
        parameter_5: template.parameter_5 || '',
        parameter_6: template.parameter_6 || '',
        parameter_7: template.parameter_7 || '',
        parameter_8: template.parameter_8 || '',
        parameter_9: template.parameter_9 || '',
        parameter_10: template.parameter_10 || '',
        parameter_11: template.parameter_11 || '',
        parameter_12: template.parameter_12 || '',
        image: template.image_url || null,
      });
    }
  }, [template]);

  const handleChange = (field: keyof TemplateFormData, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getVisibleParameters = (): number => {
    // Show parameters progressively based on which ones are filled
    let count = 1; // Always show at least parameter 1

    if (formData.parameter_1?.trim()) count = 2;
    if (formData.parameter_2?.trim()) count = 3;
    if (formData.parameter_3?.trim()) count = 4;
    if (formData.parameter_4?.trim()) count = 5;
    if (formData.parameter_5?.trim()) count = 6;
    if (formData.parameter_6?.trim()) count = 7;
    if (formData.parameter_7?.trim()) count = 8;
    if (formData.parameter_8?.trim()) count = 9;
    if (formData.parameter_9?.trim()) count = 10;
    if (formData.parameter_10?.trim()) count = 11;
    if (formData.parameter_11?.trim()) count = 12;

    return count;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do template é obrigatório';
    }

    if (!formData.hospital_id) {
      newErrors.hospital_id = 'Selecione um hospital';
    }

    if (!formData.campaign_action_id?.trim()) {
      newErrors.campaign_action_id = 'ID da campanha é obrigatório';
    } else if (formData.campaign_action_id.trim().length < 28 || formData.campaign_action_id.trim().length > 32) {
      newErrors.campaign_action_id = 'ID da campanha deve ter entre 28 e 32 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hospitalOptions = HOSPITALS.map((h) => ({
    value: h.id,
    label: h.name,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit(formData);
  };

  const visibleParameters = getVisibleParameters();
  const parameterFields = [
    { key: 'parameter_1', value: formData.parameter_1 },
    { key: 'parameter_2', value: formData.parameter_2 },
    { key: 'parameter_3', value: formData.parameter_3 },
    { key: 'parameter_4', value: formData.parameter_4 },
    { key: 'parameter_5', value: formData.parameter_5 },
    { key: 'parameter_6', value: formData.parameter_6 },
    { key: 'parameter_7', value: formData.parameter_7 },
    { key: 'parameter_8', value: formData.parameter_8 },
    { key: 'parameter_9', value: formData.parameter_9 },
    { key: 'parameter_10', value: formData.parameter_10 },
    { key: 'parameter_11', value: formData.parameter_11 },
    { key: 'parameter_12', value: formData.parameter_12 },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Configuração Colmeia */}
      <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
            Configuração da Campanha Colmeia
          </h3>
        </div>

        <Select
          label="Hospital"
          options={hospitalOptions}
          value={formData.hospital_id || ''}
          onChange={(e) => handleChange('hospital_id', e.target.value)}
          placeholder="Selecione o hospital"
          error={errors.hospital_id}
          required
          disabled={loading}
        />

        <Input
          label="ID da Campanha"
          value={formData.campaign_action_id || ''}
          onChange={(e) => handleChange('campaign_action_id', e.target.value)}
          placeholder="Ex: DGQDLxrnXeOblrzzCLeLrnld4juX8h"
          error={errors.campaign_action_id}
          hint="ID de 28-32 caracteres fornecido pela Colmeia para esta campanha"
          required
          disabled={loading}
        />
      </div>

      <Input
        label="Nome do Template"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="Ex: Confirmação de Consulta"
        error={errors.name}
        required
        disabled={loading}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Parâmetros Dinâmicos
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Preencha o nome de cada variável do template
          </span>
        </div>

        <div className="space-y-3">
          {parameterFields.slice(0, visibleParameters).map((field, index) => (
            <Input
              key={field.key}
              label={PARAMETER_LABELS[index]}
              value={field.value}
              onChange={(e) =>
                handleChange(field.key as keyof TemplateFormData, e.target.value)
              }
              placeholder={`Ex: ${['nome', 'data', 'hora', 'local', 'telefone', 'email', 'cpf', 'endereco', 'cidade', 'estado', 'cep', 'observacao'][index]}`}
              hint={index === visibleParameters - 1 && index < 11 ? 'Preencha para habilitar o próximo parâmetro' : undefined}
              disabled={loading}
            />
          ))}
        </div>

        {visibleParameters < 12 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            Você pode adicionar até 12 parâmetros. Preencha o parâmetro atual para ver o próximo.
          </p>
        )}
      </div>

      <FileUpload
        label="Imagem de Referência (opcional)"
        value={formData.image}
        onChange={(file) => handleChange('image', file)}
        error={errors.image}
        disabled={loading}
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {template ? 'Salvar Alterações' : 'Criar Template'}
        </Button>
      </div>
    </form>
  );
}
