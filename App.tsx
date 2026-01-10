
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ResultsTable from './components/ResultsTable';
import FiscalHeader from './components/FiscalHeader';
import ProductsView from './components/ProductsView';
import OverheadView from './components/OverheadView';
import ResumoFiscalView from './components/ResumoFiscalView';
import ConfiguracaoView from './components/ConfiguracaoView';
import AdminView from './components/AdminView';
import Login from './components/Login';
import ComingSoonView from './components/ComingSoonView';
import AIView from './components/AIView';
import { SimulationInputs, CostItem, VariableCostItem } from './types';
import { calculateCosts, generatePriceMatrix } from './utils/calculations';
import { supabase } from './lib/supabase';

const MASTER_EMAIL = 'tagwaytw@gmail.com';

const defaultInputs: SimulationInputs = {
  nomeProduto: 'Exemplo Planilha Ref',
  valorCompra: 100.00,
  ipiPerc: 0.65,
  freteValor: 5.88,
  mva: 81.32,
  mvaOriginal: 81.32,
  icmsInternoDestino: 20.50,
  icmsInterestadual: 7.00,
  icmsCreditoMercadoria: 7.00,
  icmsCreditoFrete: 7.00,
  ufOrigem: 'SP',
  ufDestino: 'SP',
  ncmCodigo: '6907',
  pisCofinsRate: 9.25,
  excluirIcmsPis: true,
  pisCofinsVenda: 9.25,
  comissaoVenda: 0.0,
  icmsVenda: 20.50,
  outrosCustosVariaveis: 0.00,
  custosFixos: 26.00, // Ajustado para os 26% solicitados
  resultadoDesejado: 8.00,
  mode: 'substituido',
  percReducaoBase: 0,
  simulationMode: 'buyToSell',
  precoVendaDesejado: 0
};

type Tab = 'calculadora' | 'catalogo' | 'meus-produtos' | 'overhead' | 'resumo-fiscal' | 'configuracao' | 'master' | 
           'logistica' | 'estoque' | 'metas' | 'dre' | 'caixa' | 'ia';

export const stringifyError = (err: any): string => {
  if (!err) return 'Erro desconhecido';
  if (typeof err === 'string') return err;
  const msg = err.message || err.error_description || err.error || err.msg;
  return msg || JSON.stringify(err);
};

export const TagwayIcon = ({ size = "w-10 h-10" }: { size?: string }) => (
  <svg className={size} viewBox="0 0 1080.48 979.51" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#8200AD" d="M720.75 939.52c-63.17,0 -128.66,-80.82l0 -144.42 107.39 0 42.44 73.51c-3.8,6.11 -6,13.32 -6,21.05 0,22.04 17.87,39.91 39.91,39.91 22.04,0 39.91,-17.87 39.91,-39.91 0,-22.04 -17.87,-39.91 -39.91,-39.91 -2.14,0 -4.24,0.17 -6.29,0.49l-50.95 -88.25 -126.5 0 0 -83.93 -33.11 0 0 265.73c6.35,65.19 76.35,116.54 161.77,116.54 73.21,0 135.1,-37.73 155.29,-89.55 63.33,3.57 124.42,-50.92 140.89,-129.09 7.75,-36.79 4.35,-72.76 -7.62,-102.87 45.14,-41.1 73.6,-110.69 71,-188.52 -3.39,-101.69 -58.74,-185.36 -131.04,-208.38 6.12,-15.29 9.49,-31.99 9.49,-49.47 0,-73.56 -59.64,-133.2 -133.2,-133.2 -7.51,0 -14.87,0.62 -22.04,1.81 -16.06,-46.41 -66.05,-80.25 -125.22,-80.25 -52.95,0 -98.55,27.1 -119.06,66.06l0 324.33 33.11 0 0 -71.05 83.87 0 58.22 -105.5 0.68 -1.23c1.42,-0.22 2.82,-0.51 4.19,-0.88 5.69,-2.59 11.12,-5.53 16.27,-8.78 8.19,-7.31 13.35,-17.95 13.35,-29.79 0,-22.04 -17.87,-39.91 -39.91,-39.91 -22.04,0 -39.91,17.87 -39.91,39.91 0,11.9 5.2,22.58 13.46,29.89l-45.9 83.17 -64.33 0 0 -204.91c19.64,-23.45 51.04,-38.64 86.42,-38.64 51.6,0 94.73,32.31 105.27,75.44 10.39,-3.2 21.42,-4.92 32.86,-4.92 61.59,0 111.51,49.93 111.51,111.51 0,20.5 -5.54,39.71 -15.19,56.22 71.05,22.01 125.14,97.54 128.5,189.11 2.84,77.55 -31.46,146.13 -84.1,181.6 13.07,20.74 20.67,45.51 20.67,72.11 0,73.07 -57.31,132.3 -128,132.3 -0.07,0 -0.13,0 -0.2,0 -11.4,47.5 -64.97,83.46 -129.34,83.46z"/>
    <path fill="#8200AD" d="M790.43 613.44l55.55 22.49c3.98,17.85 19.91,31.19 38.95,31.19 22.04,0 39.91,-17.87 39.91,-39.91 0,-22.04 -17.87,-39.91 -39.91,-39.91 -12.98,0 -24.52,6.2 -31.81,15.8l-56.25 -22.77 -112.98 0 0 33.11 106.53 0z"/>
    <path fill="#8200AD" d="M828.21 489.16l97.72 0c6.16,14.09 20.22,23.94 36.59,23.94 22.04,0 39.91,-17.87 39.91,-39.91 0,-22.04 -17.87,-39.91 -39.91,-39.91 -15.9,0 -29.63,9.3 -36.05,22.76l-107.01 0 -52.42 29.78 -83.63 0 0 33.11 92.38 0 2.25 -1.28 50.16 -28.5z"/>
    <path fill="#8200AD" d="M737.27 419.99l99.17 -87.82c7.19,7 17.01,11.31 27.84,11.31 22.04,0 39.91,-17.87 39.91,-39.91 0,-22.04 -17.87,-39.91 -39.91,-39.91 -20.26,0 -37,15.1 -39.57,34.66l-100.81 89.28 -41.09 0 0 33.11 54.46 0 0 -0.72z"/>
    <path fill="#FF6600" d="M152.6 445.32l-112.67 8.14c8.85,-84.01 60.61,-151.86 127.32,-172.52 -0.81,-1.38 -1.59,-2.79 -2.34,-4.21l73.44 30.69c1.19,10.14 7.39,18.75 16.05,23.28l-33.03 62.19c-4,-0.9 -8.16,-1.37 -12.44,-1.37 -30.28,0 -54.99,23.86 -56.34,53.81z"/>
    <path fill="#FF6600" d="M238.4 399.81l35.1 -66.08 1.1 -2.06 1.56 1.49 72.02 68.93c-0.36,0.97 -0.66,1.96 -0.89,2.98l-93.67 8.41c-4.19,-5.43 -9.35,-10.07 -15.21,-13.67z"/>
    <path fill="#FF6600" d="M488.4 728.92l0 129.79c-4.59,16.68 -14.41,31.85 -28.05,44.42l-143.08 -104.15c1.8,-4.46 2.8,-9.33 2.8,-14.43 0,-2.42 -0.22,-4.8 -0.65,-7.1l66.43 -8.92c5.55,7.47 14.44,12.31 24.47,12.31 16.82,0 30.46,-13.64 30.46,-30.46 0,-2.38 -0.27,-4.69 -0.79,-6.91l48.41 -14.55z"/>
    <path fill="#FF6600" d="M360.82 388.88l-68.87 -65.91c4.25,-5.21 6.79,-11.87 6.79,-19.12 0,-16.73 -13.56,-30.3 -30.3,-30.3 -11.38,0 -21.3,6.28 -26.48,15.56l-86.26 -36.05c-2.37,-9.05 -3.64,-18.56 -3.64,-28.35 0,-61.59 49.93,-111.51 111.51,-111.51 11.44,0 22.47,1.72 32.86,4.92 10.54,-43.13 53.67,-75.44 105.27,-75.44 35.38,0 66.78,15.19 86.42,38.64l0 216.23 -58.06 -0.59 -35.89 -67.58c10.94,-7.03 18.19,-19.31 18.19,-33.28 0,-17.49 -11.36,-32.33 -27.1,-37.54l-4.29 -50.64 -18.26 0.97 4.08 48.14c-18.97,2.91 -33.5,19.3 -33.5,39.08 0,21.84 17.7,39.54 39.54,39.54 1.31,0 2.6,-0.06 3.87,-0.19l42.32 79.68 69.11 0.7 0 3.5 0 70.89 33.11 0 0 -324.17c-20.51,-38.96 -66.11,-66.06 -119.06,-66.06 -59.17,0 -109.16,33.84 -125.22,80.25 -7.17,-1.19 -14.53,-1.81 -22.04,-1.81 -73.56,0 -133.2,59.64 -133.2,133.2 0,17.48 3.37,34.17 9.49,49.47 -72.3,23.02 -127.64,106.69 -131.04,208.38 -2.6,77.83 25.86,147.42 71,188.52 -11.97,30.1 -15.37,66.08 -7.62,102.87 16.47,78.17 77.56,132.66 140.89,129.09 20.19,51.83 82.08,89.55 155.29,89.55 77.37,0 142.09,-42.13 158.32,-98.51 1.69,-5.87 2.85,-11.89 3.45,-18.03l0 -267.01 -32.59 0 0 121.5 -0.52 0.16 -52.74 15.86c-5.46,-8.17 -14.77,-13.56 -25.34,-13.56 -16.82,0 -30.46,13.64 -30.46,30.46 0,0.16 0,0.33 0,0.49l-68.57 9.21c-1.8,-2.19 -3.85,-4.17 -6.09,-5.91l49.19 -108.04c13.31,-3.89 22.21,-16.2 21.9,-30.04 -1.54,-8.23 -1.14,-9.82 -5.65,-16.9l0 0c-5.52,-7.73 -14.57,-12.76 -24.8,-12.76 -2.11,0 -4.17,0.22 -6.16,0.62l-85.1 -105.97c6.77,-9.31 10.77,-20.77 10.77,-33.16 0,-5.89 -0.9,-11.57 -2.58,-16.91l87.93 -7.89c4.15,6.12 11.17,10.14 19.13,10.14 12.76,0 23.1,-10.34 23.1,-23.1 0,-12.76 -10.34,-23.1 -23.1,-23.1 -3.2,0 -6.24,0.65 -9.01,1.82zM84.97 616.6c-30.08,-37.29 -47.89,-88.58 -46.26,-144.7l116.03,-8.38c4.36,15.17 14.91,27.71 28.74,34.73l-62.14,105.45c-1.69,-0.2 -3.4,-0.3 -5.14,-0.3 -12.25,0 -23.32,5.06 -31.22,13.21zM208.95 504.32c12.11,0 23.34,-3.82 32.53,-10.32l82.04 102.15c-4.53,4.88 -7.49,11.25 -8.05,18.29l-155.77 32.6c0,-0.05 0,-0.09 0,-0.14 0,-15.68 -8.29,-29.42 -20.73,-37.07l62.47,-106.01c2.46,0.33 4.96,0.5 7.51,0.5zM102.2 723.76c0,-11.91 1.52,-23.45 4.37,-34.42 3.09,0.7 6.31,1.07 9.61,1.07 10.52,0 20.17,-3.73 27.69,-9.95l102.8 87.94c-2.27,4.91 -3.54,10.38 -3.54,16.15 0,1.87 0.13,3.71 0.39,5.5l-84.73 43.52c-34.14,-23.76 -56.59,-64.08 -56.59,-109.81zM177.69 844.45l72.73,-37.36c6.99,9.65 18.35,15.93 31.18,15.93 9.53,0 18.24,-3.46 24.96,-9.2l138.82 101.05c-23.02,15.36 -52.94,24.65 -85.64,24.65 -64.37,0 -117.94,-35.96 -129.34,-83.46 -0.06,0 -0.13,0 -0.2,0 -18.71,0 -36.49,-4.15 -52.51,-11.61zM155.79 666.56l163.77,-34.27c3.43,5.84 8.76,10.44 15.13,12.95l-46.19 101.46c-2.23,-0.4 -4.53,-0.61 -6.88,-0.61 -8.85,0 -17,2.99 -23.5,8.01l-102.32,-87.53zM154.92 666.74c0.11,-0.22 0.22,-0.43 0.33,-0.65l0.54 0.47 -0.87 0.18z"/>
    <path fill="#FF6600" d="M473.09 562.37l0 -114.56 40.22 0 0 -19.44 -99.88 0 0 19.44 40.41 0 0 114.56 19.25 0zm134.2 0.57l14.3 0 44.41 -134.38 -20.21 0c-9.91,30.31 -21.54,64.24 -32.02,96.07l-21.73 -62.14 -15.44 0 -21.92 62.33 -31.83 -96.26 -20.01 0 44.41 134.38 14.3 0c6.86,-20.21 15.06,-42.89 22.68,-64.62l23.06 64.62z"/>
  </svg>
);

export const TagwayHorizontalLogo = ({ className = "w-auto h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 14918.7 3266.79" fill="none" xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve">
    <g id="Camada_x0020_1">
      <g id="_1949254011840">
        <path fill="#8200AD" d="M2403.79 3133.39c-210.68,0 -386.67,-115.49 -429.1,-269.53l0 -481.67 358.15 0 141.55 245.17c-12.68,20.37 -20,44.43 -20,70.2 0,73.5 59.59,133.1 133.1,133.1 73.5,0 133.1,-59.59 133.1,-133.1 0,-73.51 -59.59,-133.1 -133.1,-133.1 -7.13,0 -14.14,0.56 -20.97,1.64l-169.94 -294.34 -421.9 0 0 -279.9 -110.42 0 0 886.24c21.19,217.4 254.65,388.68 539.52,388.68 244.16,0 450.56,-125.82 517.9,-298.66 211.22,11.92 414.96,-169.81 469.9,-430.53 25.85,-122.69 14.49,-242.67 -25.42,-343.07 150.55,-137.08 245.47,-369.17 236.8,-628.73 -11.32,-339.15 -195.89,-618.2 -437.02,-694.97 20.42,-51 31.64,-106.68 31.64,-164.98 0,-245.35 -198.9,-444.24 -444.25,-444.24 -25.03,0 -49.59,2.07 -73.49,6.05 -53.57,-154.78 -220.28,-267.64 -417.62,-267.64 -176.61,0 -328.67,90.38 -397.08,220.3l0 1081.68 110.42 0 0 -236.96 279.71 0 194.17 -351.84 2.26 -4.1c4.75,-0.73 9.41,-1.71 13.98,-2.92 18.96,-8.63 37.09,-18.43 54.26,-29.29 27.33,-24.37 44.53,-59.85 44.53,-99.35 0,-73.51 -59.59,-133.1 -133.1,-133.1 -73.5,0 -133.1,59.59 -133.1,133.1 0,39.67 17.36,75.29 44.89,99.67l-153.09 277.4 -214.53 0 0 -683.38c65.5,-78.21 170.22,-128.86 288.22,-128.86 172.11,0 315.95,107.74 351.09,251.59 34.64,-10.66 71.44,-16.41 109.58,-16.41 205.4,0 371.92,166.51 371.92,371.91 0,68.38 -18.46,132.45 -50.66,187.5 236.97,73.4 417.37,325.32 428.56,630.72 9.47,258.64 -104.92,487.35 -280.49,605.64 43.59,69.18 68.93,151.78 68.93,240.5 0,243.69 -191.13,441.23 -426.89,441.23 -0.22,0 -0.44,0 -0.65,0 -38.03,158.43 -216.7,278.36 -431.38,278.36z"/>
        <path fill="#8200AD" d="M2636.16 2045.88l185.27 75c13.26,59.52 66.39,104.02 129.91,104.02 73.5,0 133.1,-59.59 133.1,-133.1 0,-73.5 -59.59,-133.1 -133.1,-133.1 -43.3,0 -81.77,20.68 -106.08,52.7l-187.6 -75.94 -376.8 0 0 110.42 355.3 0z"/>
        <path fill="#8200AD" d="M2762.17 1631.41l325.9 0c20.54,47 67.44,79.86 122.02,79.86 73.5,0 133.1,-59.59 133.1,-133.1 0,-73.51 -59.59,-133.1 -133.1,-133.1 -53.04,0 -98.83,31.02 -120.23,75.91l-356.87 0 -174.81 99.33 -278.93 0 0 110.42 308.11 0 7.51 -4.27 167.3 -95.06z"/>
        <path fill="#8200AD" d="M2458.86 1400.72l330.74 -292.9c23.98,23.35 56.73,37.74 92.85,37.74 73.5,0 133.1,-59.59 133.1,-133.1 0,-73.51 -59.59,-133.1 -133.1,-133.1 -67.58,0 -123.4,50.36 -131.96,115.6l-336.21 297.74 -137.05 0 0 110.42 181.63 0 0 -2.41z"/>
        <path fill="#FF6600" d="M508.93 1485.19l-375.76 27.15c29.51,-280.18 202.14,-506.47 424.63,-575.39 -2.7,-4.62 -5.3,-9.3 -7.81,-14.04l244.93 102.35c3.96,33.82 24.63,62.52 53.53,77.66l-110.16 207.4c-13.34,-3 -27.22,-4.59 -41.47,-4.59 -100.99,0 -183.39,79.59 -187.91,179.46zm286.15 -151.79l117.07 -220.4 3.65 -6.89 5.2 4.98 240.19 229.9c-1.19,3.22 -2.19,6.54 -2.95,9.95l-312.42 28.05c-13.98,-18.1 -31.17,-33.58 -50.74,-45.59zm833.76 1097.61l0 432.86c-15.32,55.62 -48.05,106.21 -93.54,148.16l-477.19 -347.35c6.02,-14.86 9.33,-31.11 9.33,-48.13 0,-8.09 -0.75,-16 -2.18,-23.66l221.57 -29.75c18.51,24.92 48.16,41.06 81.59,41.06 56.11,0 101.59,-45.48 101.59,-101.6 0,-7.93 -0.9,-15.65 -2.63,-23.06l161.44 -48.54zm-425.5 -1134.06l-229.67 -219.83c14.16,-17.39 22.64,-39.58 22.64,-63.75 0,-55.8 -45.23,-101.04 -101.03,-101.04 -37.97,0 -71.04,20.94 -88.31,51.9l-287.7 -120.21c-7.91,-30.2 -12.13,-61.89 -12.13,-94.57 0,-205.4 166.51,-371.91 371.91,-371.91 38.14,0 74.94,5.74 109.58,16.41 35.14,-143.86 178.98,-251.59 351.09,-251.59 118,0 222.72,50.65 288.22,128.86l0 721.16 -193.64 -1.95 -119.71 -225.38c36.49,-23.45 60.67,-64.4 60.67,-111 0,-58.34 -37.89,-107.83 -90.4,-125.21l-14.3 -168.9 -60.91 3.23 13.59 160.55c-63.26,9.7 -111.71,64.35 -111.71,130.33 0,72.82 59.04,131.86 131.86,131.86 4.36,0 8.66,-0.21 12.91,-0.62l141.15 265.74 230.48 2.32 0 11.68 0 236.42 110.42 0 0 -1081.13c-68.4,-129.92 -220.47,-220.3 -397.07,-220.3 -197.36,0 -364.07,112.86 -417.62,267.64 -23.91,-3.98 -48.47,-6.05 -73.5,-6.05 -245.35,0 -444.25,198.89 -444.25,444.24 0,58.3 11.24,113.98 31.64,164.98 -241.13,76.77 -425.71,355.83 -437.02,694.97 -8.67,259.56 86.25,491.65 236.8,628.73 -39.91,100.4 -51.27,220.38 -25.42,343.07 54.93,260.72 258.68,442.45 469.9,430.53 67.35,172.84 273.74,298.66 517.9,298.66 258.03,0 473.87,-140.51 528.01,-328.54 5.64,-19.56 9.51,-39.65 11.51,-60.13l0 -890.52 -108.69 0 0 405.22 -1.74 0.52 -175.88 52.89c-18.22,-27.26 -49.28,-45.21 -84.52,-45.21 -56.11,0 -101.6,45.48 -101.6,101.59 0,0.54 0.01,1.09 0.01,1.63l-228.7 30.7c-6.02,-7.29 -12.83,-13.91 -20.31,-19.72l164.05 -360.33c44.4,-12.96 74.08,-54.04 73.03,-100.19 -5.15,-27.45 -3.82,-32.76 -18.86,-56.37l0 0c-18.43,-25.77 -48.6,-42.57 -82.7,-42.57 -7.04,0 -13.91,0.72 -20.54,2.08l-283.81 -353.42c22.59,-31.04 35.93,-69.26 35.93,-110.59 0,-19.64 -3.02,-38.58 -8.6,-56.39l293.27 -26.32c13.85,20.42 37.26,33.83 63.8,33.83 42.55,0 77.04,-34.5 77.04,-77.04 0,-42.55 -34.5,-77.05 -77.04,-77.05 -10.66,0 -20.83,2.17 -30.06,6.08zm-920 759.46c-100.33,-124.35 -159.72,-295.42 -154.28,-482.57l386.97 -27.95c14.53,50.59 49.72,92.42 95.85,115.81l-207.26 351.67c-5.62,-0.66 -11.34,-1.01 -17.15,-1.01 -40.85,0 -77.76,16.89 -104.13,44.04zm413.5 -374.48c40.4,0 77.83,-12.74 108.48,-34.42l273.6 340.69c-15.12,16.28 -24.97,37.52 -26.83,61l-519.53 108.73c0,-0.16 0,-0.32 0,-0.48 0,-52.29 -27.65,-98.11 -69.13,-123.65l208.36 -353.53c8.19,1.09 16.55,1.65 25.05,1.65zm-356.02 731.87c0,-39.71 5.08,-78.19 14.59,-114.8 10.32,2.32 21.04,3.55 32.06,3.55 35.08,0 67.25,-12.44 92.34,-33.16l342.85 293.3c-7.58,16.37 -11.81,34.62 -11.81,53.86 0,6.23 0.45,12.36 1.3,18.35l-282.57 145.16c-113.85,-79.25 -188.75,-213.71 -188.75,-366.25zm251.76 402.51l242.57 -124.6c23.31,32.19 61.21,53.15 104,53.15 31.77,0 60.84,-11.55 83.25,-30.68l462.98 337c-76.77,51.24 -176.55,82.21 -285.63,82.21 -214.68,0 -393.35,-119.92 -431.38,-278.36 -0.21,0 -0.43,0 -0.65,0 -62.41,0 -121.7,-13.84 -175.13,-38.72zm-73.05 -593.28l546.18 -114.3c11.44,19.48 29.2,34.81 50.45,43.18l-154.06 338.38c-7.45,-1.35 -15.13,-2.05 -22.96,-2.05 -29.52,0 -56.71,9.97 -78.38,26.72l-341.23 -291.93zm-2.91 0.61c0.37,-0.72 0.73,-1.43 1.09,-2.16l1.82 1.55 -2.91 0.61z"/>
        <path fill="#FF6600" fill-rule="nonzero" d="M1577.8 1875.57l0 -382.06 134.13 0 0 -64.84 -333.1 0 0 64.84 134.77 0 0 382.06 64.2 0zm447.57 1.9l47.68 0 148.12 -448.17 -67.38 0c-33.06,101.08 -71.83,214.23 -106.8,320.4l-72.47 -207.24 -51.49 0 -73.11 207.88 -106.16 -321.03 -66.75 0 148.12 448.17 47.68 0c22.89,-67.38 50.22,-143.03 75.65,-215.5l76.92 215.5z"/>
      </g>
      <path fill="white" fill-rule="nonzero" d="M4777.68 2721.46l0 -1844.66 647.62 0 0 -313.08 -1608.32 0 0 313.08 650.7 0 0 1844.66 310 0zm1332.08 -1691.2l263.97 758.12 -534.06 0 270.09 -758.12zm641.49 1681.99l331.49 0 -862.48 -2176.15 -227.13 0 -862.48 2176.15 334.56 0c67.53,-178.02 174.96,-435.84 257.82,-632.28l770.4 0 257.82 632.28zm2341.89 -1378.12c-113.57,-570.89 -610.8,-782.68 -1022.09,-782.68 -592.38,0 -1055.84,454.26 -1055.84,1089.61 0,632.29 454.25,1086.54 1055.84,1086.54 389.81,0 831.78,-263.96 979.11,-675.25l0 3.07c27.62,-70.6 42.97,-190.29 58.32,-371.39l-1157.14 0 0 310 794.96 0c-128.92,313.07 -411.29,435.84 -675.25,435.84 -420.5,0 -745.84,-334.56 -745.84,-788.82 0,-451.19 325.35,-779.61 745.84,-779.61 273.17,0 604.66,125.85 690.6,472.68l331.49 0zm1728.02 1396.53l230.2 0 715.15 -2163.86 -325.35 0c-159.61,488.02 -346.83,1034.36 -515.65,1546.94l-349.9 -1000.6 -248.61 0 -352.97 1003.67 -512.57 -1550 -322.28 0 715.14 2163.86 230.2 0c110.5,-325.35 242.48,-690.59 365.24,-1040.5l371.39 1040.5zm1645.15 -1700.4l263.97 758.12 -534.06 0 270.09 -758.12zm641.49 1681.99l331.49 0 -862.48 -2176.15 -227.13 0 -862.48 2176.15 334.56 0c67.53,-178.02 174.96,-435.84 257.82,-632.28l770.4 0 257.82 632.28zm-95.14 -2145.45l794.95 1270.69 0 874.76 313.07 0 0 -874.76 798.03 -1270.69 -368.32 0 -586.24 942.28 -586.24 -942.28 -365.24 0z"/>
    </g>
  </svg>
);

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [inputs, setInputs] = useState<SimulationInputs>(defaultInputs);
  const [activeTab, setActiveTab] = useState<Tab>('calculadora');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSimulations, setSavedSimulations] = useState<any[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [faturamento, setFaturamento] = useState<number>(100000);
  const [fixedCosts, setFixedCosts] = useState<CostItem[]>([]);
  const [variableCosts, setVariableCosts] = useState<VariableCostItem[]>([]);
  const [isAutoSync, setIsAutoSync] = useState(false);
  
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const isMaster = useMemo(() => session?.user?.email === MASTER_EMAIL, [session]);
  const hasAdminAccess = useMemo(() => !!userProfile?.is_admin || isMaster, [userProfile, isMaster]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError && sessionError.message.includes('refresh_token')) await supabase.auth.signOut();
        if (mounted) {
          setSession(currentSession);
          if (currentSession) {
            await fetchUserProfile(currentSession);
            await Promise.all([fetchMyProducts(currentSession), fetchOverheadConfig(currentSession)]).catch(() => {});
          }
          setIsInitialized(true);
        }
      } catch (e) {
        if (mounted) setIsInitialized(true);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        if (newSession) {
          await fetchUserProfile(newSession);
          await fetchMyProducts(newSession);
          await fetchOverheadConfig(newSession);
        } else {
          setUserProfile(null);
          setProfileError(null);
        }
      }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const fetchUserProfile = async (userSession: any) => {
    if (!userSession?.user?.id) return;
    try {
      const { data, error } = await supabase.from('user_configs').select('*').eq('user_id', userSession.user.id).maybeSingle();
      if (error) throw error;
      if (data) setUserProfile(data);
      else if (!isMaster) setProfileError(`Conta não configurada.`);
    } catch (err: any) {
      if (err.status !== 401) setProfileError(stringifyError(err));
    }
  };

  const fetchOverheadConfig = async (userSession: any) => {
    try {
      const { data } = await supabase.from('overhead_configs').select('*').eq('user_id', userSession.user.id).maybeSingle();
      if (data) {
        if (data.faturamento) setFaturamento(Number(data.faturamento));
        if (data.fixed_costs) setFixedCosts(data.fixed_costs);
        if (data.variable_costs) setVariableCosts(data.variable_costs);
        if (data.is_auto_sync !== undefined) setIsAutoSync(!!data.is_auto_sync);
      }
    } catch (e) {}
  };

  const fetchMyProducts = async (currentSession = session) => {
    if (!currentSession?.user?.id) return;
    try {
      const { data } = await supabase.from('simulacoes').select('*').eq('user_id', currentSession.user.id).order('created_at', { ascending: false });
      if (data) setSavedSimulations(data);
    } catch (e) {}
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('simulacoes').insert([{ user_id: session.user.id, nome_produto: inputs.nomeProduto || 'Produto Sem Nome', dados: inputs }]);
      if (error) throw error;
      alert('Simulação salva!');
      await fetchMyProducts();
      setActiveTab('meus-produtos');
      setIsMobileSheetOpen(false);
    } catch (err: any) { 
      alert('Erro: ' + stringifyError(err)); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const results = calculateCosts(inputs);
  const priceMatrix = generatePriceMatrix(results.custoFinal, inputs);

  if (!isInitialized) return null;
  if (!session) return <Login onLoginSuccess={setSession} />;

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-[#000000] overflow-hidden text-slate-900 relative">
      
      {/* Desktop Sidebar Restored with Roadmap */}
      <aside className={`hidden lg:flex bg-[#000000] flex-col transition-all duration-500 z-[100] border-r border-white/5 shadow-2xl ${sidebarCollapsed ? 'w-[90px]' : 'w-[280px]'} h-screen overflow-y-auto no-scrollbar`}>
        <div className="p-6 mb-4 items-center justify-between flex border-b border-white/5">
          <div className="flex items-center gap-4 overflow-hidden h-10">
            {sidebarCollapsed ? <TagwayIcon /> : <TagwayHorizontalLogo className="h-7 w-auto" />}
          </div>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-white/10 rounded-lg text-white/40">
             <svg className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 19l-7-7 7-7"/></svg>
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <div className={`text-[8px] font-black text-white/20 uppercase tracking-[0.2em] px-4 py-2 transition-opacity ${sidebarCollapsed ? 'opacity-0 h-0 p-0' : 'opacity-100'}`}>Operacional</div>
          <MenuButton active={activeTab === 'calculadora'} onClick={() => setActiveTab('calculadora')} label="Calculadora" collapsed={sidebarCollapsed} icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          <MenuButton active={activeTab === 'resumo-fiscal'} onClick={() => setActiveTab('resumo-fiscal')} label="Análise Fisco" collapsed={sidebarCollapsed} icon="M9 17v-2m3 2v-4m3 2v-6m-8-2h8a2 2 0 012 2v9a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"/>
          <MenuButton active={activeTab === 'catalogo'} onClick={() => setActiveTab('catalogo')} label="NCM 2025" collapsed={sidebarCollapsed} icon="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          <MenuButton active={activeTab === 'meus-produtos'} onClick={() => setActiveTab('meus-produtos')} label="Simulações" collapsed={sidebarCollapsed} icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          <MenuButton active={activeTab === 'ia'} onClick={() => setActiveTab('ia')} label="IA Insight" collapsed={sidebarCollapsed} icon="M13 10V3L4 14h7v7l9-11h-7z" isAi />
          
          <div className={`text-[8px] font-black text-white/20 uppercase tracking-[0.2em] px-4 py-4 border-t border-white/5 mt-2 transition-opacity ${sidebarCollapsed ? 'opacity-0 h-0 p-0' : 'opacity-100'}`}>Roadmap 2026</div>
          <MenuButton active={activeTab === 'logistica'} onClick={() => setActiveTab('logistica')} label="Logística" collapsed={sidebarCollapsed} icon="M8 17a2 2 0 100 4 2 2 0 000-4zM18 17a2 2 0 100 4 2 2 0 000-4zM6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h12l4 5v3a2 2 0 01-2 2h-1" isDev />
          <MenuButton active={activeTab === 'estoque'} onClick={() => setActiveTab('estoque')} label="Estoque" collapsed={sidebarCollapsed} icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" isDev />
          <MenuButton active={activeTab === 'metas'} onClick={() => setActiveTab('metas')} label="Metas" collapsed={sidebarCollapsed} icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" isDev />
          <MenuButton active={activeTab === 'dre'} onClick={() => setActiveTab('dre')} label="DRE" collapsed={sidebarCollapsed} icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" isDev />
          <MenuButton active={activeTab === 'caixa'} onClick={() => setActiveTab('caixa')} label="Caixa" collapsed={sidebarCollapsed} icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" isDev />

          <div className={`text-[8px] font-black text-white/20 uppercase tracking-[0.2em] px-4 py-4 border-t border-white/5 mt-2 transition-opacity ${sidebarCollapsed ? 'opacity-0 h-0 p-0' : 'opacity-100'}`}>Configuração</div>
          <MenuButton active={activeTab === 'overhead'} onClick={() => setActiveTab('overhead')} label="Meu Overhead" collapsed={sidebarCollapsed} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2"/>
          <MenuButton active={activeTab === 'configuracao'} onClick={() => setActiveTab('configuracao')} label="Ajustes" collapsed={sidebarCollapsed} icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          {hasAdminAccess && <MenuButton active={activeTab === 'master'} onClick={() => setActiveTab('master')} label="Master" collapsed={sidebarCollapsed} icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944"/>}
        </nav>

        <div className="p-4 border-t border-white/5">
           <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-4 w-full p-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m4 4H7"/></svg>
             {!sidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Sair</span>}
           </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col bg-[#f8fafc] lg:rounded-l-[3rem] shadow-[-20px_0_40px_rgba(0,0,0,0.1)] overflow-hidden relative">
        
        {/* Persistent Logo Header - Mobile only */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 z-[90]">
           <TagwayHorizontalLogo className="h-6 w-auto" />
           <div className="flex items-center gap-4">
              <button onClick={() => setIsMobileSheetOpen(true)} className="bg-black text-white p-2.5 rounded-xl shadow-lg btn-touch">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
              </button>
           </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar no-scrollbar">
          {activeTab === 'calculadora' && (
            <div className="p-4 lg:p-12 max-w-5xl mx-auto">
              <ResultsTable results={results} priceMatrix={priceMatrix} inputs={inputs} />
            </div>
          )}
          {activeTab === 'resumo-fiscal' && <div className="p-6 lg:p-12"><ResumoFiscalView results={results} inputs={inputs} /></div>}
          {activeTab === 'catalogo' && <div className="p-6 lg:p-12"><ProductsView onSelectNcm={(n) => { setInputs(p => ({...p, ...n, nomeProduto: n.descricao})); setActiveTab('calculadora'); }} /></div>}
          {activeTab === 'meus-produtos' && <div className="p-6 lg:p-12 space-y-4">
             {savedSimulations.map(sim => (
               <div key={sim.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex justify-between items-center group">
                 <div>
                   <h4 className="font-black text-slate-800 text-lg tracking-tight">{sim.nome_produto}</h4>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(sim.created_at).toLocaleDateString()}</span>
                 </div>
                 <button onClick={() => {setInputs(sim.dados); setActiveTab('calculadora');}} className="bg-black text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Abrir</button>
               </div>
             ))}
          </div>}
          {activeTab === 'ia' && <AIView results={results} inputs={inputs} />}
          {activeTab === 'overhead' && <div className="p-6"><OverheadView faturamento={faturamento} setFaturamento={setFaturamento} fixedCosts={fixedCosts} setFixedCosts={setFixedCosts} variableCosts={variableCosts} setVariableCosts={setVariableCosts} userId={session?.user?.id} isAutoSync={isAutoSync} setIsAutoSync={setIsAutoSync} /></div>}
          {activeTab === 'configuracao' && <div className="p-6"><ConfiguracaoView userId={session?.user?.id} /></div>}
          {activeTab === 'master' && hasAdminAccess && <div className="p-6"><AdminView /></div>}
          
          {/* Roadmap Views */}
          {activeTab === 'logistica' && <ComingSoonView title="Logística Inteligente" desc="Cálculo automático de fretes, cubagem e integração com transportadoras." icon="M8 17a2 2 0 100 4 2 2 0 000-4zM18 17a2 2 0 100 4 2 2 0 000-4zM6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h12l4 5v3a2 2 0 01-2 2h-1" />}
          {activeTab === 'estoque' && <ComingSoonView title="Gestão de Estoque" desc="Giro de estoque, curva ABC valorizada e avisos de reposição automática." icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />}
          {activeTab === 'metas' && <ComingSoonView title="Metas de Venda" desc="Acompanhamento em tempo real das metas por vendedor e categoria." icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />}
          {activeTab === 'dre' && <ComingSoonView title="DRE Gerencial" desc="DRE automático gerado a partir de suas vendas e overhead configurado." icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
          {activeTab === 'caixa' && <ComingSoonView title="Fluxo de Caixa" desc="Projeção de recebíveis e pagamentos fiscais centralizados." icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />}
        </div>

        {/* Mobile Bottom Dock Premium */}
        <nav className="lg:hidden mobile-dock fixed bottom-6 left-6 right-6 h-[72px] rounded-[2rem] flex items-center justify-around px-4 z-[100]">
           <DockItem active={activeTab === 'calculadora'} onClick={() => setActiveTab('calculadora')} icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3" label="Home" />
           <DockItem active={activeTab === 'resumo-fiscal'} onClick={() => setActiveTab('resumo-fiscal')} icon="M9 17v-2m3 2v-4m3 2v-6m-8-2h8a2 2 0 012 2v9a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" label="Tax" />
           <DockItem active={activeTab === 'ia'} onClick={() => setActiveTab('ia')} icon="M13 10V3L4 14h7v7l9-11h-7z" label="AI" isAi />
           <DockItem active={activeTab === 'overhead'} onClick={() => setActiveTab('overhead')} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" label="Fixos" />
           <DockItem active={activeTab === 'configuracao'} onClick={() => setActiveTab('configuracao')} icon="M4 6h16M4 12h16m-7 6h7" label="Menu" />
        </nav>
      </main>
    </div>
  );
};

const DockItem = ({ active, onClick, icon, label, isAi }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 transition-all btn-touch ${active ? 'text-white' : 'text-white/30'}`}>
     <div className={`p-2 rounded-2xl transition-all ${active ? 'bg-white/10 scale-110 shadow-lg' : ''} ${isAi && active ? 'text-indigo-400' : ''}`}>
       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon}/></svg>
     </div>
     <span className="text-[7px] font-black uppercase tracking-[0.2em]">{label}</span>
  </button>
);

interface MenuButtonProps { active: boolean; onClick: () => void; icon: string; label: string; collapsed: boolean; isDev?: boolean; isAi?: boolean; }
const MenuButton: React.FC<MenuButtonProps> = ({ active, onClick, icon, label, collapsed, isDev, isAi }) => (
  <button onClick={onClick} className={`flex items-center w-full gap-4 p-4 rounded-2xl transition-all ${active ? 'bg-white/10 text-white shadow-xl shadow-black/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
    <svg className={`w-5 h-5 shrink-0 ${isAi ? 'text-indigo-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon}/></svg>
    {!collapsed && (
      <div className="flex items-center justify-between flex-1 overflow-hidden">
        <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
        {isDev && <span className="bg-indigo-500/20 text-indigo-300 text-[6px] font-black px-1.5 py-0.5 rounded leading-none uppercase ml-2">2026</span>}
      </div>
    )}
  </button>
);

export default App;
