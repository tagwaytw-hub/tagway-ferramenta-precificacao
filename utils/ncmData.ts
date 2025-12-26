
import { NCMEntry } from '../types';

/**
 * Banco de Dados NCM 2025 focado em Materiais de Construção, Acabamento e Pisos.
 * Valores de MVA baseados nos convênios e protocolos vigentes (representativos).
 */
export const NCM_DATABASE: NCMEntry[] = [
  // --- SEÇÃO 5.0 CIMENTOS ---
  { codigo: '2523', descricao: 'Cimento (Geral)', mvaOriginal: 20 },
  { codigo: '2523.29.10', descricao: 'Cimento Portland', mvaOriginal: 20 },

  // --- SEÇÃO 8.0 MATERIAIS DE CONSTRUÇÃO E CONGÊNERES (ATUALIZADO 2025) ---
  { codigo: '2522', descricao: 'Cal (Construção)', mvaOriginal: 45 },
  { codigo: '3824.5', descricao: 'Argamassas', mvaOriginal: 45 },
  { codigo: '3910', descricao: 'Silicones em formas primárias', mvaOriginal: 55 },
  { codigo: '3916', descricao: 'Revestimentos de PVC / Forro / Sancas', mvaOriginal: 55 },
  { codigo: '3917', descricao: 'Tubos e acessórios de plástico', mvaOriginal: 35 },
  { codigo: '3918', descricao: 'Revestimento de pavimento (PVC/Plástico)', mvaOriginal: 55 },
  { codigo: '3921', descricao: 'Telha de plástico / Cumeeira', mvaOriginal: 55 },
  { codigo: '3922', descricao: 'Pia, Lavatório, Banheira, Box (Plástico)', mvaOriginal: 45 },
  { codigo: '3924', descricao: 'Artefatos de higiene / Toucador (Plástico)', mvaOriginal: 85 },
  { codigo: '3925.1', descricao: 'Caixa-d’água de plástico', mvaOriginal: 45 },
  { codigo: '3925.2', descricao: 'Portas, janelas e seus caixilhos (Plástico)', mvaOriginal: 45 },
  { codigo: '3925.3', descricao: 'Postigos, estores e venezianas', mvaOriginal: 75 },
  { codigo: '4814', descricao: 'Papel de parede / Revestimentos', mvaOriginal: 75 },
  { codigo: '6810.19', descricao: 'Telhas de concreto', mvaOriginal: 55 },
  { codigo: '6811', descricao: 'Telhas de fibrocimento', mvaOriginal: 45 },
  { codigo: '6907', descricao: 'Pisos, Ladrilhos e Placas de Cerâmica / Porcelanato', mvaOriginal: 55 },
  { codigo: '6910', descricao: 'Pias, lavatórios, colunas e sanitários (Cerâmica)', mvaOriginal: 45 },
  { codigo: '7003', descricao: 'Vidro vazado ou laminado', mvaOriginal: 45 },
  { codigo: '7007.19', descricao: 'Vidros temperados', mvaOriginal: 45 },
  { codigo: '7007.29', descricao: 'Vidros laminados', mvaOriginal: 45 },
  { codigo: '7009', descricao: 'Espelhos de vidro (Exceto automotivo)', mvaOriginal: 45 },
  { codigo: '7214.2', descricao: 'Vergalhões', mvaOriginal: 45 },
  { codigo: '7307', descricao: 'Acessórios para tubos (Ferro/Aço)', mvaOriginal: 35 },
  { codigo: '7308.3', descricao: 'Portas e janelas de ferro ou aço', mvaOriginal: 45 },
  { codigo: '7324', descricao: 'Pias e artefatos de higiene (Ferro/Aço)', mvaOriginal: 65 },
  { codigo: '7418.2', descricao: 'Artefatos de higiene / Toucador (Cobre)', mvaOriginal: 45 },
  { codigo: '7610', descricao: 'Portas, janelas e caixilhos (Alumínio)', mvaOriginal: 35 },
  { codigo: '7615.20.00', descricao: 'Pias e artefatos de higiene (Alumínio)', mvaOriginal: 75 },
  { codigo: '8301', descricao: 'Fechaduras e ferrolhos', mvaOriginal: 55 },
  { codigo: '8302.41.00', descricao: 'Puxadores e guarnições para construção', mvaOriginal: 45 },
  { codigo: '8481', descricao: 'Torneiras e válvulas (Geral)', mvaOriginal: 45 },
  { codigo: '9406', descricao: 'Construções pré-fabricadas', mvaOriginal: 45 },

  // --- OUTROS ---
  { codigo: '2202.10', descricao: 'Refrigerantes em geral', mvaOriginal: 114 },
  { codigo: '8517.13', descricao: 'Smartphones / Celulares', mvaOriginal: 9 },
  { codigo: '3003', descricao: 'Medicamentos referência (Positiva)', mvaOriginal: 38.24 },
  { codigo: '3004', descricao: 'Medicamentos genéricos (Positiva)', mvaOriginal: 38.24 },
];

/**
 * Tabela de Alíquotas Internas (Modal) vigentes em 2025.
 * Diversos estados elevaram suas alíquotas básicas para equilibrar perdas de arrecadação.
 */
export const UF_LIST = [
  { sigla: 'AC', nome: 'Acre', icms: 19 },
  { sigla: 'AL', nome: 'Alagoas', icms: 19 },
  { sigla: 'AM', nome: 'Amazonas', icms: 20 },
  { sigla: 'AP', nome: 'Amapá', icms: 18 },
  { sigla: 'BA', nome: 'Bahia', icms: 20.5 },
  { sigla: 'CE', nome: 'Ceará', icms: 20 },
  { sigla: 'DF', nome: 'Distrito Federal', icms: 20 },
  { sigla: 'ES', nome: 'Espírito Santo', icms: 17 },
  { sigla: 'GO', nome: 'Goiás', icms: 19 },
  { sigla: 'MA', nome: 'Maranhão', icms: 22 },
  { sigla: 'MG', nome: 'Minas Gerais', icms: 18 },
  { sigla: 'MS', nome: 'Mato Grosso do Sul', icms: 17 },
  { sigla: 'MT', nome: 'Mato Grosso', icms: 17 },
  { sigla: 'PA', nome: 'Pará', icms: 19 },
  { sigla: 'PB', nome: 'Paraíba', icms: 20 },
  { sigla: 'PE', nome: 'Pernambuco', icms: 20.5 },
  { sigla: 'PI', nome: 'Piauí', icms: 21 },
  { sigla: 'PR', nome: 'Paraná', icms: 19.5 },
  { sigla: 'RJ', nome: 'Rio de Janeiro', icms: 20 }, // Incluindo FECP médio
  { sigla: 'RN', nome: 'Rio Grande do Norte', icms: 20 },
  { sigla: 'RO', nome: 'Rondônia', icms: 19.5 },
  { sigla: 'RR', nome: 'Roraima', icms: 20 },
  { sigla: 'RS', nome: 'Rio Grande do Sul', icms: 17 },
  { sigla: 'SC', nome: 'Santa Catarina', icms: 17 },
  { sigla: 'SE', nome: 'Sergipe', icms: 19 },
  { sigla: 'SP', nome: 'São Paulo', icms: 18 },
  { sigla: 'TO', nome: 'Tocantins', icms: 20 },
];
