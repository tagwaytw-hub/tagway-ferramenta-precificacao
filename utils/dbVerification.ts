
import { NCM_DATABASE } from './ncmData';

export interface DBHealthReport {
  totalEntries: number;
  duplicates: string[];
  malformedCodes: string[];
  status: 'healthy' | 'warning' | 'critical';
}

export const verifyMvaDatabase = (): DBHealthReport => {
  const codes = NCM_DATABASE.map(item => item.codigo);
  const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
  
  const malformedCodes = NCM_DATABASE
    .filter(item => !/^[0-9.]+$/.test(item.codigo))
    .map(item => item.codigo);

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (duplicates.length > 0) status = 'warning';
  if (malformedCodes.length > 3) status = 'critical';

  return {
    totalEntries: NCM_DATABASE.length,
    duplicates,
    malformedCodes,
    status
  };
};
