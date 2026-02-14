import translate from 'google-translate-api-x';
import type { TranslationConfig } from '../../shared/types';

const DEFAULT_SYSTEM_PROMPT =
  'Translate the following text to {targetLanguage}. Output only the translated text, nothing else.';

export async function translateText(text: string, config: TranslationConfig): Promise<string> {
  if (!config.enabled || !text.trim()) return text;

  switch (config.provider) {
    case 'google':
      return translateGoogle(text, config.targetLanguage);
    case 'openai':
      return translateOpenAICompatible(
        text,
        config,
        'https://api.openai.com/v1/chat/completions',
        'gpt-4o-mini'
      );
    case 'groq':
      return translateOpenAICompatible(
        text,
        config,
        'https://api.groq.com/openai/v1/chat/completions',
        'llama-3.3-70b-versatile'
      );
    case 'anthropic':
      return translateAnthropic(text, config);
    case 'custom':
      return translateOpenAICompatible(text, config, config.customEndpoint, config.customModel);
  }
}

async function translateGoogle(text: string, targetLanguage: string): Promise<string> {
  const result = await translate(text, { to: targetLanguage });
  return result.text;
}

async function translateOpenAICompatible(
  text: string,
  config: TranslationConfig,
  endpoint: string,
  model: string
): Promise<string> {
  const prompt = (config.systemPrompt || DEFAULT_SYSTEM_PROMPT).replace(
    '{targetLanguage}',
    config.targetLanguage
  );

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: text },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Translation API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };
  const choice = data.choices[0];
  if (!choice) throw new Error('No response from translation API');
  return choice.message.content.trim();
}

async function translateAnthropic(text: string, config: TranslationConfig): Promise<string> {
  const prompt = (config.systemPrompt || DEFAULT_SYSTEM_PROMPT).replace(
    '{targetLanguage}',
    config.targetLanguage
  );

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: prompt,
      messages: [{ role: 'user', content: text }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    content: { text: string }[];
  };
  const block = data.content[0];
  if (!block) throw new Error('No response from Anthropic API');
  return block.text.trim();
}

export async function testTranslationConnection(
  config: TranslationConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await translateText('Hello', config);
    if (result && result.length > 0) {
      return { success: true };
    }
    return { success: false, error: 'Empty translation result' };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
