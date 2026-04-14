/**
 * User Service
 * Handles user authentication and management
 */

import { supabase } from './supabase';

export type UserRole = 'admin' | 'unit_admin' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  hospitals?: string[]; // Array of hospital IDs the user has access to
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  hospitals?: string[]; // Hospital IDs to assign
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: UserRole;
  is_active?: boolean;
  password?: string;
  hospitals?: string[]; // Hospital IDs to assign (replaces existing)
}

/**
 * Hash password using SHA-256
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.toUpperCase();
}

export const userService = {
  /**
   * Get hospitals for a user
   */
  async getUserHospitals(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_hospitals')
      .select('hospital_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user hospitals:', error);
      return [];
    }

    return data?.map(h => h.hospital_id) || [];
  },

  /**
   * Set hospitals for a user (replaces existing assignments)
   */
  async setUserHospitals(userId: string, hospitalIds: string[]): Promise<boolean> {
    // Delete existing hospital assignments
    const { error: deleteError } = await supabase
      .from('user_hospitals')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting user hospitals:', deleteError);
      return false;
    }

    // Insert new hospital assignments
    if (hospitalIds.length > 0) {
      const { error: insertError } = await supabase
        .from('user_hospitals')
        .insert(hospitalIds.map(hospitalId => ({
          user_id: userId,
          hospital_id: hospitalId,
        })));

      if (insertError) {
        console.error('Error inserting user hospitals:', insertError);
        return false;
      }
    }

    return true;
  },

  /**
   * Authenticate user with email and password
   */
  async login(email: string, password: string): Promise<User | null> {
    const passwordHash = await hashPassword(password);

    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('password_hash', passwordHash)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error('Login error:', error);
      return null;
    }

    // Fetch user's hospitals
    const hospitals = await this.getUserHospitals(data.id);

    return { ...data, hospitals } as User;
  },

  /**
   * Get all users with their hospital assignments
   */
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    // Fetch hospitals for all users
    const { data: hospitalData } = await supabase
      .from('user_hospitals')
      .select('user_id, hospital_id');

    // Map hospitals to users
    const hospitalsByUser = new Map<string, string[]>();
    hospitalData?.forEach(h => {
      const existing = hospitalsByUser.get(h.user_id) || [];
      existing.push(h.hospital_id);
      hospitalsByUser.set(h.user_id, existing);
    });

    return (data as User[]).map(user => ({
      ...user,
      hospitals: hospitalsByUser.get(user.id) || [],
    }));
  },

  /**
   * Get user by ID with hospital assignments
   */
  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching user:', error);
      return null;
    }

    // Fetch user's hospitals
    const hospitals = await this.getUserHospitals(id);

    return { ...data, hospitals } as User;
  },

  /**
   * Create new user with hospital assignments
   */
  async create(userData: CreateUserData): Promise<User | null> {
    const passwordHash = await hashPassword(userData.password);

    const { data, error } = await supabase
      .from('app_users')
      .insert({
        email: userData.email.toLowerCase(),
        password_hash: passwordHash,
        name: userData.name,
        role: userData.role,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw new Error(
        error.code === '23505'
          ? 'Este email já está cadastrado'
          : 'Erro ao criar usuário'
      );
    }

    // Assign hospitals if provided (only for non-admin users)
    if (userData.hospitals && userData.hospitals.length > 0 && userData.role !== 'admin') {
      await this.setUserHospitals(data.id, userData.hospitals);
    }

    return { ...data, hospitals: userData.hospitals || [] } as User;
  },

  /**
   * Update user with hospital assignments
   */
  async update(id: string, userData: UpdateUserData): Promise<User | null> {
    const updateData: Record<string, unknown> = {};

    if (userData.email) updateData.email = userData.email.toLowerCase();
    if (userData.name) updateData.name = userData.name;
    if (userData.role) updateData.role = userData.role;
    if (typeof userData.is_active === 'boolean') updateData.is_active = userData.is_active;
    if (userData.password) {
      updateData.password_hash = await hashPassword(userData.password);
    }

    const { data, error } = await supabase
      .from('app_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw new Error(
        error.code === '23505'
          ? 'Este email já está cadastrado'
          : 'Erro ao atualizar usuário'
      );
    }

    // Update hospital assignments if provided
    if (userData.hospitals !== undefined) {
      // Only full admins bypass hospital assignments (they access everything)
      const hospitalIds = userData.role === 'admin' ? [] : userData.hospitals;
      await this.setUserHospitals(id, hospitalIds);
    }

    // Fetch updated hospitals
    const hospitals = await this.getUserHospitals(id);

    return { ...data, hospitals } as User;
  },

  /**
   * Delete user
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }

    return true;
  },

  /**
   * Verify user's current password
   */
  async verifyPassword(id: string, password: string): Promise<boolean> {
    const passwordHash = await hashPassword(password);

    const { data, error } = await supabase
      .from('app_users')
      .select('id')
      .eq('id', id)
      .eq('password_hash', passwordHash)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  },

  /**
   * Change user password (with current password verification)
   */
  async changePassword(id: string, newPassword: string): Promise<boolean> {
    const passwordHash = await hashPassword(newPassword);

    const { error } = await supabase
      .from('app_users')
      .update({ password_hash: passwordHash })
      .eq('id', id);

    if (error) {
      console.error('Error changing password:', error);
      return false;
    }

    return true;
  },

  /**
   * Update user's own profile (name only - for self-service)
   */
  async updateProfile(id: string, name: string): Promise<boolean> {
    const { error } = await supabase
      .from('app_users')
      .update({ name })
      .eq('id', id);

    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }

    return true;
  },
};
