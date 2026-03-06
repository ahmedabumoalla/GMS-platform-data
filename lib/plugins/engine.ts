import { supabase } from '@/lib/supabase';

export async function canTogglePlugin(pluginKey: string) {
  const { data: rules } = await supabase
    .from('system_plugin_rules')
    .select('*')
    .eq('plugin_key', pluginKey);

  for (const rule of rules || []) {
    if (rule.rule_type === 'dependency') {
      const required = rule.rule_value.requires || [];
      const { data: deps } = await supabase
        .from('system_plugins')
        .select('plugin_key, is_active')
        .in('plugin_key', required);

      if (deps?.some(d => !d.is_active)) {
        return { ok: false };
      }
    }
  }

  return { ok: true };
}