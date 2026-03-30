import { supabase, STORAGE_BUCKET } from './supabase';
import type { Template, TemplateFormData } from '@/types';

export const templateService = {
  // Fetch all templates
  async getAll(): Promise<Template[]> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Fetch single template by ID
  async getById(id: string): Promise<Template | null> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Create new template
  async create(formData: TemplateFormData): Promise<Template> {
    let imageUrl: string | null = null;

    // Upload image if provided as File
    if (formData.image instanceof File) {
      const fileExt = formData.image.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, formData.image);

      if (uploadError) throw new Error(`Erro ao fazer upload da imagem: ${uploadError.message}`);

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);

      imageUrl = urlData.publicUrl;
    } else if (typeof formData.image === 'string') {
      imageUrl = formData.image;
    }

    const { data, error } = await supabase
      .from('templates')
      .insert({
        name: formData.name,
        hospital_id: formData.hospital_id || null,
        campaign_action_id: formData.campaign_action_id || null,
        parameter_1: formData.parameter_1 || null,
        parameter_2: formData.parameter_2 || null,
        parameter_3: formData.parameter_3 || null,
        parameter_4: formData.parameter_4 || null,
        parameter_5: formData.parameter_5 || null,
        parameter_6: formData.parameter_6 || null,
        parameter_7: formData.parameter_7 || null,
        parameter_8: formData.parameter_8 || null,
        parameter_9: formData.parameter_9 || null,
        parameter_10: formData.parameter_10 || null,
        parameter_11: formData.parameter_11 || null,
        parameter_12: formData.parameter_12 || null,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Update template
  async update(id: string, formData: TemplateFormData): Promise<Template> {
    let imageUrl: string | null = null;
    let imageUpdated = false;

    // Upload new image if provided as File
    if (formData.image instanceof File) {
      const fileExt = formData.image.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, formData.image);

      if (uploadError) throw new Error(`Erro ao fazer upload da imagem: ${uploadError.message}`);

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);

      imageUrl = urlData.publicUrl;
      imageUpdated = true;
    } else if (typeof formData.image === 'string') {
      imageUrl = formData.image;
      imageUpdated = true;
    } else if (formData.image === null) {
      imageUrl = null;
      imageUpdated = true;
    }

    const updateData: Partial<Template> = {
      name: formData.name,
      hospital_id: formData.hospital_id || null,
      campaign_action_id: formData.campaign_action_id || null,
      parameter_1: formData.parameter_1 || null,
      parameter_2: formData.parameter_2 || null,
      parameter_3: formData.parameter_3 || null,
      parameter_4: formData.parameter_4 || null,
      parameter_5: formData.parameter_5 || null,
      parameter_6: formData.parameter_6 || null,
      parameter_7: formData.parameter_7 || null,
      parameter_8: formData.parameter_8 || null,
      parameter_9: formData.parameter_9 || null,
      parameter_10: formData.parameter_10 || null,
      parameter_11: formData.parameter_11 || null,
      parameter_12: formData.parameter_12 || null,
    };

    if (imageUpdated) {
      updateData.image_url = imageUrl;
    }

    const { data, error } = await supabase
      .from('templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Delete template
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // Get template parameters as array
  getParameters(template: Template): string[] {
    const params: string[] = [];
    if (template.parameter_1) params.push(template.parameter_1);
    if (template.parameter_2) params.push(template.parameter_2);
    if (template.parameter_3) params.push(template.parameter_3);
    if (template.parameter_4) params.push(template.parameter_4);
    if (template.parameter_5) params.push(template.parameter_5);
    if (template.parameter_6) params.push(template.parameter_6);
    if (template.parameter_7) params.push(template.parameter_7);
    if (template.parameter_8) params.push(template.parameter_8);
    if (template.parameter_9) params.push(template.parameter_9);
    if (template.parameter_10) params.push(template.parameter_10);
    if (template.parameter_11) params.push(template.parameter_11);
    if (template.parameter_12) params.push(template.parameter_12);
    return params;
  },

  // Get parameter count
  getParameterCount(template: Template): number {
    return this.getParameters(template).length;
  },
};
