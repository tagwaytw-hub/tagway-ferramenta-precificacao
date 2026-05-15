
import { NCMEntry } from '../types';

/**
 * Banco de Dados NCM 2025 Expandido
 * Focado em Materiais de Construção, Acabamento, Elétricos e Hidráulicos.
 * Baseado em Decretos Estaduais de ST (Ex: Convênio ICMS 142/18 e Decretos Estaduais Setoriais).
 */
export const NCM_DATABASE: NCMEntry[] = [
  // --- INFRAESTRUTURA E CIMENTO ---
  { codigo: '2523', descricao: 'Cimento (Geral)', mvaOriginal: 20 },
  { codigo: '2523.29.10', descricao: 'Cimento Portland', mvaOriginal: 20 },
  { codigo: '2522', descricao: 'Cal (Construção)', mvaOriginal: 45 },
  { codigo: '2505', descricao: 'Areias naturais de qualquer espécie', mvaOriginal: 40 },
  { codigo: '2517', descricao: 'Pedras quebradas, cascalho, brita', mvaOriginal: 40 },
  
  // --- ARGAMASSAS E QUÍMICOS ---
  { codigo: '3824.5', descricao: 'Argamassas e Concretos não refratários', mvaOriginal: 45 },
  { codigo: '3824.40.00', descricao: 'Aditivos preparados para cimentos ou argamassas', mvaOriginal: 45 },
  { codigo: '3214.10.10', descricao: 'Massa de vedação / Massa corrida', mvaOriginal: 45 },
  { codigo: '3506', descricao: 'Adesivos e Colas preparadas', mvaOriginal: 55 },
  { codigo: '3910', descricao: 'Silicones em formas primárias (Selantes)', mvaOriginal: 55 },

  // --- TINTAS E VERNIZES ---
  { codigo: '3208', descricao: 'Tintas e Vernizes (Base Solvente)', mvaOriginal: 35 },
  { codigo: '3209', descricao: 'Tintas e Vernizes (Base Água)', mvaOriginal: 35 },
  { codigo: '3210', descricao: 'Outras tintas e vernizes / Pigmentos', mvaOriginal: 35 },
  { codigo: '3213.1', descricao: 'Tinta Guache', mvaOriginal: 81.34 },
  
  // --- PEÇAS AUTOMOTIVAS ---
  { codigo: '8708', descricao: 'Peças e acessórios para veículos', mvaOriginal: 71.78 },
  
  // --- BEBIDAS ---
  { codigo: '2201.1', descricao: 'Água mineral/naturais', mvaOriginal: 114 },
  { codigo: '2202', descricao: 'Águas adicionadas de açúcar/aromatizantes', mvaOriginal: 114 },
  { codigo: '2202.10', descricao: 'Refrigerantes', mvaOriginal: 114 },
  { codigo: '2203', descricao: 'Cervejas e Chopp', mvaOriginal: 140 },
  { codigo: '2106.90.1', descricao: 'Xarope para refrigerante', mvaOriginal: 114 },

  // --- CIGARROS E FUMO ---
  { codigo: '2402', descricao: 'Charutos e cigarrilhas', mvaOriginal: 50 },
  { codigo: '2403.1', descricao: 'Tabaco para fumar', mvaOriginal: 50 },

  // --- MEDICAMENTOS E HIGIENE ---
  { codigo: '3003', descricao: 'Medicamentos (Geral)', mvaOriginal: 38.24 },
  { codigo: '3004', descricao: 'Medicamentos (Referência)', mvaOriginal: 38.24 },
  { codigo: '3002', descricao: 'Vacinas / Antissoros', mvaOriginal: 38.24 },
  { codigo: '3005.10.1', descricao: 'Curativos adesivos', mvaOriginal: 38.24 },
  { codigo: '3006.6', descricao: 'Preparações contraceptivas', mvaOriginal: 38.24 },

  // --- PNEUMÁTICOS ---
  { codigo: '4011', descricao: 'Pneus novos (Carros/Caminhões)', mvaOriginal: 42 },
  { codigo: '4011.5', descricao: 'Pneus novos (Bicicletas)', mvaOriginal: 64.67 },
  { codigo: '4013', descricao: 'Câmaras de ar de borracha', mvaOriginal: 45 },

  // --- ALIMENTÍCIOS ---
  { codigo: '1101.00.1', descricao: 'Farinha de trigo', mvaOriginal: 77.37 },
  { codigo: '1901.2', descricao: 'Misturas para pães (<80% trigo)', mvaOriginal: 102 },
  { codigo: '1902.3', descricao: 'Massas instantâneas', mvaOriginal: 20 },
  { codigo: '1905.2', descricao: 'Pães industrializados / Panetones', mvaOriginal: 20 },
  { codigo: '1905.4', descricao: 'Torradas e pão torrado', mvaOriginal: 30 },
  { codigo: '0210.2', descricao: 'Carne bovina salgada/seca', mvaOriginal: 25 },

  // --- PAPELARIA ---
  { codigo: '3916.2', descricao: 'Espiral para encadernação', mvaOriginal: 82.24 },
  { codigo: '4202.1', descricao: 'Maletas e pastas escolares', mvaOriginal: 60.91 },
  { codigo: '4802.56', descricao: 'Papel A4 / Cutsize', mvaOriginal: 36.32 },
  { codigo: '4820.2', descricao: 'Cadernos', mvaOriginal: 65.93 },
  { codigo: '9608.1', descricao: 'Canetas esferográficas', mvaOriginal: 64.21 },

  // --- ELETRÔNICOS ---
  { codigo: '8517.13', descricao: 'Smartphones', mvaOriginal: 9 },
  { codigo: '8523.52', descricao: 'Cartões inteligentes (Simcards)', mvaOriginal: 9 },

  // --- SORVETES ---
  { codigo: '2105', descricao: 'Sorvetes de qualquer espécie', mvaOriginal: 70 },
  
  // --- PLÁSTICOS E TUBULAÇÕES ---
  { codigo: '3916', descricao: 'Revestimentos de PVC / Forro / Sancas', mvaOriginal: 55 },
  { codigo: '3917', descricao: 'Tubos e acessórios de plástico (PVC/PPR/CPVC)', mvaOriginal: 35 },
  { codigo: '3918', descricao: 'Revestimento de pavimento (Vinílico/PVC)', mvaOriginal: 55 },
  { codigo: '3921', descricao: 'Telha de plástico / Cumeeira', mvaOriginal: 55 },
  { codigo: '3922', descricao: 'Pia, Lavatório, Banheira, Box (Plástico)', mvaOriginal: 45 },
  { codigo: '3924', descricao: 'Artefatos de higiene / Toucador (Plástico)', mvaOriginal: 85 },
  { codigo: '3925.1', descricao: 'Caixa-d’água / Reservatórios de plástico', mvaOriginal: 45 },
  { codigo: '3925.2', descricao: 'Portas, janelas e seus caixilhos (Plástico)', mvaOriginal: 45 },
  { codigo: '3925.3', descricao: 'Postigos, estores e venezianas (Plástico)', mvaOriginal: 75 },
  
  // --- MADEIRA E REVESTIMENTOS ---
  { codigo: '4411', descricao: 'MDF e HDF - Painéis de fibra de madeira', mvaOriginal: 45 },
  { codigo: '4412', descricao: 'Madeira compensada / Contraplacada', mvaOriginal: 45 },
  { codigo: '4418', descricao: 'Obras de marcenaria / Portas de Madeira', mvaOriginal: 40 },
  { codigo: '4814', descricao: 'Papel de parede / Revestimentos', mvaOriginal: 75 },
  
  // --- CERÂMICAS E VIDROS ---
  { codigo: '6802', descricao: 'Mármores, granitos e pedras naturais trabalhadas', mvaOriginal: 40 },
  { codigo: '6810.19', descricao: 'Telhas e artefatos de concreto', mvaOriginal: 55 },
  { codigo: '6811', descricao: 'Telhas e chapas de fibrocimento', mvaOriginal: 45 },
  { codigo: '6907', descricao: 'Pisos, Ladrilhos e Placas de Cerâmica / Porcelanato', mvaOriginal: 55 },
  { codigo: '6910', descricao: 'Pias, lavatórios, bacias sanitárias (Cerâmica)', mvaOriginal: 45 },
  { codigo: '7003', descricao: 'Vidro vazado ou laminado', mvaOriginal: 45 },
  { codigo: '7007.19', descricao: 'Vidros temperados', mvaOriginal: 45 },
  { codigo: '7007.29', descricao: 'Vidros laminados', mvaOriginal: 45 },
  { codigo: '7009', descricao: 'Espelhos de vidro', mvaOriginal: 45 },
  
  // --- METAIS E FERRAGENS ---
  { codigo: '7214.2', descricao: 'Vergalhões de ferro ou aço (CA-50/60)', mvaOriginal: 45 },
  { codigo: '7307', descricao: 'Acessórios para tubos (Ferro/Aço)', mvaOriginal: 35 },
  { codigo: '7308.3', descricao: 'Portas e janelas de ferro ou aço', mvaOriginal: 45 },
  { codigo: '7313', descricao: 'Aramas farpados / Cercas', mvaOriginal: 45 },
  { codigo: '7314', descricao: 'Telas metálicas / Grades / Redes', mvaOriginal: 45 },
  { codigo: '7317', descricao: 'Pregos, tachas e percevejos', mvaOriginal: 45 },
  { codigo: '7318', descricao: 'Parafusos, pinos, porcas e arruelas', mvaOriginal: 45 },
  { codigo: '7324', descricao: 'Pias e artefatos de higiene (Ferro/Aço)', mvaOriginal: 65 },
  { codigo: '7418.2', descricao: 'Artefatos de higiene / Toucador (Cobre/Latão)', mvaOriginal: 45 },
  { codigo: '7610', descricao: 'Portas, janelas e caixilhos (Alumínio)', mvaOriginal: 35 },
  { codigo: '7615.20.00', descricao: 'Pias e artefatos de higiene (Alumínio)', mvaOriginal: 75 },
  { codigo: '8301', descricao: 'Fechaduras e ferrolhos', mvaOriginal: 55 },
  { codigo: '8302.41.00', descricao: 'Puxadores, guarnições e ferragens para móveis', mvaOriginal: 45 },
  
  // --- HIDRÁULICA E METAIS SANITÁRIOS ---
  { codigo: '8481', descricao: 'Torneiras, válvulas e misturadores (Geral)', mvaOriginal: 45 },
  { codigo: '8481.80.1', descricao: 'Válvulas de descarga e redutoras', mvaOriginal: 45 },
  { codigo: '8481.80.9', descricao: 'Registros e metais sanitários de luxo', mvaOriginal: 45 },

  // --- ELÉTRICA E ILUMINAÇÃO ---
  { codigo: '8544', descricao: 'Fios e cabos elétricos isolados', mvaOriginal: 45 },
  { codigo: '8536', descricao: 'Interruptores, tomadas, plugues e disjuntores', mvaOriginal: 50 },
  { codigo: '8538', descricao: 'Quadros de distribuição / Painéis elétricos', mvaOriginal: 45 },
  { codigo: '9405', descricao: 'Luminárias, painéis de LED e lustres', mvaOriginal: 55 },
  { codigo: '8539.5', descricao: 'Lâmpadas LED', mvaOriginal: 55 },

  // --- DIVERSOS CONSTRUÇÃO ---
  { codigo: '9406', descricao: 'Construções pré-fabricadas / Galpões', mvaOriginal: 45 },
  { codigo: '3919', descricao: 'Fitas adesivas / Isolantes', mvaOriginal: 55 },
  { codigo: '6807', descricao: 'Manta asfáltica / Impermeabilizantes', mvaOriginal: 45 },
];

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
  { sigla: 'RJ', nome: 'Rio de Janeiro', icms: 20 },
  { sigla: 'RN', nome: 'Rio Grande do Norte', icms: 20 },
  { sigla: 'RO', nome: 'Rondônia', icms: 19.5 },
  { sigla: 'RR', nome: 'Roraima', icms: 20 },
  { sigla: 'RS', nome: 'Rio Grande do Sul', icms: 17 },
  { sigla: 'SC', nome: 'Santa Catarina', icms: 17 },
  { sigla: 'SE', nome: 'Sergipe', icms: 19 },
  { sigla: 'SP', nome: 'São Paulo', icms: 18 },
  { sigla: 'TO', nome: 'Tocantins', icms: 20 },
];
