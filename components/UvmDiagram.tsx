import React from 'react';
import { UvmComponentType } from '../types';

interface UvmDiagramProps {
  activeComponent: UvmComponentType;
  onSelectComponent: (component: UvmComponentType) => void;
  simulationStepIndex: number;
  onStartSimulation: () => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onStopSimulation: () => void;
  totalSteps: number;
}

const UvmDiagram: React.FC<UvmDiagramProps> = ({ 
  activeComponent, 
  onSelectComponent, 
  simulationStepIndex,
  onStartSimulation,
  onNextStep,
  onPrevStep,
  onStopSimulation,
  totalSteps
}) => {
  const isSimulating = simulationStepIndex >= 0;

  const getClasses = (type: UvmComponentType) => {
    const isActive = activeComponent === type;
    const base = "uvm-block cursor-pointer border-2 rounded-lg flex items-center justify-center font-bold text-sm md:text-base text-center p-2 relative select-none transition-all duration-300";
    
    let colorClass = "";
    switch (type) {
      case UvmComponentType.TOP: colorClass = "border-gray-500 bg-gray-800/50 text-gray-300"; break;
      case UvmComponentType.TEST: colorClass = "border-blue-700 bg-blue-900/30 text-blue-200"; break;
      case UvmComponentType.ENV: colorClass = "border-teal-700 bg-teal-900/30 text-teal-200"; break;
      case UvmComponentType.AGENT: colorClass = "border-indigo-700 bg-indigo-900/30 text-indigo-200"; break;
      case UvmComponentType.SEQUENCER: colorClass = "border-amber-600 bg-amber-900/40 text-amber-200"; break;
      case UvmComponentType.DRIVER: colorClass = "border-pink-600 bg-pink-900/40 text-pink-200"; break;
      case UvmComponentType.MONITOR: colorClass = "border-purple-600 bg-purple-900/40 text-purple-200"; break;
      case UvmComponentType.SCOREBOARD: colorClass = "border-emerald-600 bg-emerald-900/40 text-emerald-200"; break;
      case UvmComponentType.DUT: colorClass = "border-slate-500 bg-slate-700 text-slate-100"; break;
      case UvmComponentType.INTERFACE: colorClass = "border-yellow-200/50 border-dashed bg-transparent text-yellow-100/70"; break;
      case UvmComponentType.SEQUENCE: colorClass = "border-amber-400 border-dotted bg-transparent text-amber-400"; break;
      default: colorClass = "border-gray-600";
    }

    if (isActive) {
      return `${base} ${colorClass} ring-4 ${isSimulating ? 'ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-110' : 'ring-white/20 shadow-lg scale-105'} z-10`;
    }
    
    if (isSimulating) {
        return `${base} ${colorClass} opacity-40 grayscale`;
    }

    return `${base} ${colorClass} opacity-80 hover:opacity-100`;
  };

  return (
    <div className="w-full h-full p-4 bg-uvm-bg flex flex-col items-center overflow-auto relative">
      <div className="w-full max-w-[800px] flex justify-between items-center mb-4 z-20">
        <h2 className="text-xl font-mono text-gray-400">Architecture</h2>
        
        {!isSimulating ? (
             <button 
                onClick={onStartSimulation}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-indigo-900/50"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                Walkthrough Flow
             </button>
        ) : (
            <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg border border-gray-600">
                <button onClick={onStopSimulation} className="p-1.5 hover:bg-red-900/50 rounded text-red-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div className="h-4 w-[1px] bg-gray-600 mx-1"></div>
                <button onClick={onPrevStep} disabled={simulationStepIndex === 0} className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <span className="text-xs font-mono px-2 text-indigo-300">
                    Step {simulationStepIndex + 1} / {totalSteps}
                </span>
                <button onClick={onNextStep} disabled={simulationStepIndex === totalSteps - 1} className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-30">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            </div>
        )}
      </div>
      
      {/* Container for the specific Grid Layout */}
      <div className="relative grid gap-4 p-6 rounded-xl border border-gray-700 bg-gray-900/50 shadow-2xl" 
           style={{
             display: 'grid',
             gridTemplateAreas: `
               "top top top top top"
               "test test test test test"
               "env env env env env"
               "agent agent agent sb sb"
               "seq drv mon mon sb"
               "seq drv if  if  sb"
               ".   dut dut dut ."
             `,
             gridTemplateColumns: '1fr 1fr 0.5fr 1fr 1fr',
             gridTemplateRows: 'auto auto auto auto auto auto auto',
             maxWidth: '800px',
             width: '100%'
           }}>

        {/* Top */}
        <div className={getClasses(UvmComponentType.TOP)} style={{ gridArea: 'top' }} onClick={() => !isSimulating && onSelectComponent(UvmComponentType.TOP)}>
          TB TOP
        </div>

        {/* Test */}
        <div className={getClasses(UvmComponentType.TEST)} style={{ gridArea: 'test' }} onClick={() => !isSimulating && onSelectComponent(UvmComponentType.TEST)}>
          uvm_test
        </div>

        {/* Env */}
        <div className={getClasses(UvmComponentType.ENV)} style={{ gridArea: 'env' }} onClick={() => !isSimulating && onSelectComponent(UvmComponentType.ENV)}>
          uvm_env
        </div>

        {/* Agent */}
        <div className={getClasses(UvmComponentType.AGENT)} style={{ gridArea: 'agent' }} onClick={() => !isSimulating && onSelectComponent(UvmComponentType.AGENT)}>
          uvm_agent
        </div>

        {/* Sequencer */}
        <div className={getClasses(UvmComponentType.SEQUENCER)} style={{ gridArea: 'seq' }} onClick={() => !isSimulating && onSelectComponent(UvmComponentType.SEQUENCER)}>
          uvm_sequencer
          <div className="absolute -top-12 left-0 w-full flex justify-center">
             <div className={`${getClasses(UvmComponentType.SEQUENCE)} text-xs h-8 w-20 flex items-center justify-center`} onClick={(e) => { e.stopPropagation(); !isSimulating && onSelectComponent(UvmComponentType.SEQUENCE); }}>Seq Item</div>
          </div>
        </div>

        {/* Driver */}
        <div className={getClasses(UvmComponentType.DRIVER)} style={{ gridArea: 'drv' }} onClick={() => !isSimulating && onSelectComponent(UvmComponentType.DRIVER)}>
          uvm_driver
        </div>

        {/* Monitor */}
        <div className={getClasses(UvmComponentType.MONITOR)} style={{ gridArea: 'mon' }} onClick={() => !isSimulating && onSelectComponent(UvmComponentType.MONITOR)}>
          uvm_monitor
        </div>

        {/* Scoreboard */}
        <div className={getClasses(UvmComponentType.SCOREBOARD)} style={{ gridArea: 'sb' }} onClick={() => !isSimulating && onSelectComponent(UvmComponentType.SCOREBOARD)}>
          uvm_scoreboard
        </div>

        {/* Interface */}
        <div className={getClasses(UvmComponentType.INTERFACE)} style={{ gridArea: 'if' }} onClick={() => !isSimulating && onSelectComponent(UvmComponentType.INTERFACE)}>
          Virtual Interface
        </div>

        {/* DUT */}
        <div className={getClasses(UvmComponentType.DUT)} style={{ gridArea: 'dut' }} onClick={() => !isSimulating && onSelectComponent(UvmComponentType.DUT)}>
          DUT (Design Under Test)
        </div>

        {/* Arrows for Walkthrough - SVG Overlay */}
        {isSimulating && (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                    </marker>
                </defs>
                {/* 
                   Coordinates are approximate percentages based on the grid layout.
                   Adjusting logic to draw based on current step would be ideal, 
                   but strictly hardcoding lines for the specific tutorial steps is robust here.
                */}
                
                {/* Step 1: Sequence -> Sequencer */}
                {simulationStepIndex === 1 && (
                    <line x1="15%" y1="52%" x2="15%" y2="58%" stroke="#6366f1" strokeWidth="3" markerEnd="url(#arrowhead)" className="animate-pulse" />
                )}

                {/* Step 2: Sequencer -> Driver */}
                {simulationStepIndex === 2 && (
                    <line x1="15%" y1="65%" x2="35%" y2="65%" stroke="#6366f1" strokeWidth="3" markerEnd="url(#arrowhead)" className="animate-pulse" />
                )}

                {/* Step 3: Driver -> Interface */}
                {simulationStepIndex === 3 && (
                    <line x1="35%" y1="70%" x2="45%" y2="82%" stroke="#6366f1" strokeWidth="3" markerEnd="url(#arrowhead)" className="animate-pulse" />
                )}

                {/* Step 4: Interface -> DUT */}
                {simulationStepIndex === 4 && (
                    <line x1="50%" y1="88%" x2="50%" y2="92%" stroke="#6366f1" strokeWidth="3" markerEnd="url(#arrowhead)" className="animate-pulse" />
                )}

                {/* Step 5: Interface -> Monitor */}
                {simulationStepIndex === 5 && (
                    <line x1="55%" y1="82%" x2="65%" y2="70%" stroke="#6366f1" strokeWidth="3" markerEnd="url(#arrowhead)" className="animate-pulse" />
                )}
                 
                 {/* Step 6: Monitor -> Scoreboard */}
                 {simulationStepIndex === 6 && (
                    <line x1="75%" y1="65%" x2="85%" y2="65%" stroke="#6366f1" strokeWidth="3" markerEnd="url(#arrowhead)" className="animate-pulse" />
                )}

            </svg>
        )}
      </div>
      
      {!isSimulating && (
        <div className="mt-8 flex gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-pink-900/40 border border-pink-600"></div>Active Path</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-900/40 border border-purple-600"></div>Passive Path</div>
        </div>
      )}
      {isSimulating && (
        <div className="mt-8 text-center">
            <p className="text-indigo-400 text-sm font-medium animate-pulse">Walkthrough Active: Follow the flow of the transaction</p>
        </div>
      )}
    </div>
  );
};

export default UvmDiagram;