
import React from 'react';

interface ComingSoonViewProps {
  title: string;
  desc: string;
  icon: string;
}

const ComingSoonView: React.FC<ComingSoonViewProps> = ({ title, desc, icon }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-20 text-center animate-slide-up">
    <div className="max-w-xl w-full space-y-10">
      <div className="relative mx-auto w-32 h-32">
        <div className="absolute inset-0 bg-indigo-500/20 rounded-[3rem] blur-3xl animate-pulse"></div>
        <div className="relative w-full h-full bg-slate-900 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-white/10">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}/></svg>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="inline-block bg-indigo-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.3em] mb-4">ROADMAP 2026</div>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{title}</h2>
        <p className="text-slate-500 font-medium text-sm md:text-base leading-relaxed">{desc}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-10">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
           <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</span>
           <span className="text-xs font-black text-slate-900 uppercase">Arquitetura de Dados</span>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
           <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Lançamento</span>
           <span className="text-xs font-black text-indigo-600 uppercase">Q1 2026</span>
        </div>
      </div>

      <div className="pt-10">
        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">Tagway Pro Intelligence — Acelerando sua visão financeira</p>
      </div>
    </div>
  </div>
);

export default ComingSoonView;
