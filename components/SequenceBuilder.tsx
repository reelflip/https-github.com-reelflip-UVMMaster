import React, { useState, useEffect } from 'react';
import { TransactionKind, SequenceStep } from '../types';

const SequenceBuilder: React.FC = () => {
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [currentStep, setCurrentStep] = useState<Partial<SequenceStep>>({
    kind: TransactionKind.WRITE,
    addr: "'h1000",
    data: "'hFF",
    delay: 0
  });
  const [generatedCode, setGeneratedCode] = useState('');

  const addStep = () => {
    const newStep: SequenceStep = {
      id: Date.now().toString(),
      kind: currentStep.kind || TransactionKind.WRITE,
      addr: currentStep.addr || '0',
      data: currentStep.data || '0',
      delay: currentStep.delay || 0
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const generateCode = () => {
    let code = `class my_custom_seq extends uvm_sequence #(my_transaction);\n`;
    code += `  \`uvm_object_utils(my_custom_seq)\n\n`;
    code += `  function new(string name = "my_custom_seq");\n    super.new(name);\n  endfunction\n\n`;
    code += `  virtual task body();\n    my_transaction req;\n\n`;

    if (steps.length === 0) {
      code += `    // Add transactions to see code here\n`;
    }

    steps.forEach((step, index) => {
      code += `    // Step ${index + 1}: ${step.kind}\n`;
      if (step.kind === TransactionKind.IDLE) {
        code += `    #${step.delay || 10};\n\n`;
      } else {
        code += `    req = my_transaction::type_id::create("req");\n`;
        code += `    start_item(req);\n`;
        code += `    if (!req.randomize() with {\n`;
        code += `      addr == ${step.addr};\n`;
        code += `      kind == ${step.kind};\n`;
        if (step.kind === TransactionKind.WRITE) {
          code += `      data == ${step.data};\n`;
        }
        code += `    }) \`uvm_error("SEQ", "Randomization failed")\n`;
        code += `    finish_item(req);\n`;
        if (step.delay > 0) {
          code += `    #${step.delay};\n`;
        }
        code += `\n`;
      }
    });

    code += `  endtask\nendclass`;
    return code;
  };

  useEffect(() => {
    setGeneratedCode(generateCode());
  }, [steps]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
  };

  return (
    <div className="flex flex-col h-full bg-uvm-bg text-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
        <div>
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-amber-400">❖</span> Sequence Builder
          </h2>
          <p className="text-xs text-gray-400">Construct a UVM sequence interactively</p>
        </div>
        <button 
          onClick={() => setSteps([])}
          className="text-xs text-red-400 hover:text-red-300 border border-red-900/50 bg-red-900/20 px-3 py-1 rounded transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Controls */}
        <div className="w-80 border-r border-gray-700 bg-gray-800/30 flex flex-col p-4 overflow-y-auto shrink-0">
          <h3 className="font-semibold text-uvm-accent mb-4 text-sm uppercase tracking-wider">New Transaction</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Operation</label>
              <div className="grid grid-cols-3 gap-2">
                {[TransactionKind.WRITE, TransactionKind.READ, TransactionKind.IDLE].map(k => (
                  <button
                    key={k}
                    onClick={() => setCurrentStep({...currentStep, kind: k})}
                    className={`text-xs py-2 rounded border ${currentStep.kind === k 
                      ? 'bg-uvm-accent text-gray-900 border-uvm-accent font-bold' 
                      : 'border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {currentStep.kind !== TransactionKind.IDLE && (
              <>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Address (Hex/Dec)</label>
                  <input
                    type="text"
                    value={currentStep.addr}
                    onChange={(e) => setCurrentStep({...currentStep, addr: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-uvm-accent focus:outline-none font-mono text-green-400"
                  />
                </div>

                {currentStep.kind === TransactionKind.WRITE && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Data (Hex/Dec)</label>
                    <input
                      type="text"
                      value={currentStep.data}
                      onChange={(e) => setCurrentStep({...currentStep, data: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-uvm-accent focus:outline-none font-mono text-green-400"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1">Post-Delay (#)</label>
              <input
                type="number"
                value={currentStep.delay}
                onChange={(e) => setCurrentStep({...currentStep, delay: parseInt(e.target.value) || 0})}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-uvm-accent focus:outline-none font-mono text-blue-300"
              />
            </div>

            <button
              onClick={addStep}
              className="w-full py-2 mt-2 bg-gradient-to-r from-uvm-accent to-blue-600 text-white font-semibold rounded hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-blue-900/20"
            >
              Add Step
            </button>
          </div>

          <div className="mt-8 border-t border-gray-700 pt-6">
            <h3 className="font-semibold text-gray-300 mb-4 text-sm">Sequence Steps ({steps.length})</h3>
            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div key={step.id} className="group flex items-center gap-2 p-2 rounded bg-gray-800 border border-gray-700 hover:border-gray-500 transition-colors">
                  <span className="text-xs text-gray-500 font-mono w-4">{idx + 1}.</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-1.5 rounded ${
                        step.kind === TransactionKind.WRITE ? 'bg-pink-900/50 text-pink-300' :
                        step.kind === TransactionKind.READ ? 'bg-teal-900/50 text-teal-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {step.kind}
                      </span>
                      {step.kind !== TransactionKind.IDLE && (
                         <span className="text-xs font-mono text-gray-300">@{step.addr}</span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => removeStep(step.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              ))}
              {steps.length === 0 && (
                <div className="text-xs text-gray-600 text-center py-4 italic">
                  No steps yet. Add one above.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Code Preview */}
        <div className="flex-1 bg-[#1e1e1e] flex flex-col min-w-0">
          <div className="bg-[#252526] px-4 py-2 flex justify-between items-center border-b border-[#3e3e42]">
            <span className="text-xs text-gray-400 font-mono">generated_sequence.sv</span>
            <button 
              onClick={copyToClipboard}
              className="text-xs flex items-center gap-1 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              Copy
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 custom-scrollbar">
            <pre className="font-mono text-sm leading-relaxed">
              <code className="text-gray-300">
                {generatedCode}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SequenceBuilder;
