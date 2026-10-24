/**
 * FactoryVerse Expert XR - Optional Supabase Adapter
 * Clean abstraction layer allowing seamless migration from LocalStorage to Supabase
 * when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present in .env.
 */

import type { IStorageRepository } from './storage-repository';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export class SupabaseAdapter {
  private config: SupabaseConfig | null = null;
  private isConnected = false;

  constructor() {
    const url = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : undefined;
    const key = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : undefined;

    if (url && key && !url.includes('placeholder')) {
      this.config = { url, anonKey: key };
      this.isConnected = true;
    }
  }

  public isConfigured(): boolean {
    return this.isConnected;
  }

  public getStatus(): { enabled: boolean; url: string | null; mode: 'cloud' | 'local_storage' } {
    return {
      enabled: this.isConnected,
      url: this.config?.url || null,
      mode: this.isConnected ? 'cloud' : 'local_storage',
    };
  }
}

export const supabaseAdapter = new SupabaseAdapter();
