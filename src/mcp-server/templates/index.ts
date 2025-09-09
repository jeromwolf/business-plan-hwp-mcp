import governmentTemplate from './government.json';
import vcTemplate from './vc.json';
import bankTemplate from './bank.json';

export interface Template {
  id: string;
  name: string;
  description: string;
  sections: Section[];
}

export interface Section {
  id: string;
  title: string;
  subsections?: string[];
  requiredData?: string[];
  maxPages?: number;
}

const templates: Record<string, Template> = {
  government: governmentTemplate as Template,
  vc: vcTemplate as Template,
  bank: bankTemplate as Template,
};

export function getTemplate(format: 'government' | 'vc' | 'bank'): Template {
  const template = templates[format];
  if (!template) {
    throw new Error(`Unknown template format: ${format}`);
  }
  return template;
}

export function getAllTemplates(): Template[] {
  return Object.values(templates);
}