/**
 * AI Provider Configuration
 *
 * LLM-agnostic provider setup using Vercel AI SDK.
 * Supports OpenAI, Google Gemini, and Azure OpenAI.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAzure } from '@ai-sdk/azure';
import type { LanguageModel } from 'ai';

export type AIProvider = 'openai' | 'google' | 'azure';

interface ProviderConfig {
  provider: AIProvider;
  model: string;
}

/**
 * Get the configured AI provider from environment
 */
function getProviderConfig(): ProviderConfig {
  const provider = (import.meta.env.AI_PROVIDER || 'google') as AIProvider;
  const model = import.meta.env.AI_MODEL || 'gemini-2.0-flash-exp';
  return { provider, model };
}

/**
 * Create the appropriate AI model instance based on configuration
 */
export function getAIModel(): LanguageModel {
  const { provider, model } = getProviderConfig();

  switch (provider) {
    case 'openai': {
      const apiKey = import.meta.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai');
      }
      const openai = createOpenAI({ apiKey });
      return openai(model);
    }

    case 'google': {
      const apiKey = import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is required when AI_PROVIDER=google');
      }
      const google = createGoogleGenerativeAI({ apiKey });
      return google(model);
    }

    case 'azure': {
      const resourceName = import.meta.env.AZURE_RESOURCE_NAME;
      const apiKey = import.meta.env.AZURE_API_KEY;
      if (!resourceName || !apiKey) {
        throw new Error('AZURE_RESOURCE_NAME and AZURE_API_KEY are required when AI_PROVIDER=azure');
      }
      const azure = createAzure({ resourceName, apiKey });
      return azure(model);
    }

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Check if AI refinement is configured
 */
export function isAIConfigured(): boolean {
  const provider = import.meta.env.AI_PROVIDER || 'google';

  switch (provider) {
    case 'openai':
      return Boolean(import.meta.env.OPENAI_API_KEY);
    case 'google':
      return Boolean(import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY);
    case 'azure':
      return Boolean(import.meta.env.AZURE_RESOURCE_NAME && import.meta.env.AZURE_API_KEY);
    default:
      return false;
  }
}
