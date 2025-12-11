import React, { useState, useEffect } from 'react';
import UvmDiagram from './components/UvmDiagram';
import InfoPanel from './components/InfoPanel';
import ChatInterface from './components/ChatInterface';
import SequenceBuilder from './components/SequenceBuilder';
import { UvmComponentType, AiResponse, SimulationStep } from './types';
import { getComponentExplanation } from './services/geminiService';

type ViewMode = 'architecture' | 'builder';

// Educational Data for the Walkthrough
const WALKTHROUGH_STEPS: SimulationStep[] = [
    {
        id: 0,
        label: "Sequence Creation",
        component: UvmComponentType.SEQUENCE,
        description: "The journey begins in the Sequence. The body() task creates a transaction object (req) and initiates the handshake with the Sequencer using start_item().",
        codeSnippet: `// Inside sequence body()
req = my_transaction::type_id::create("req");

start_item(req); // Request grant from sequencer

if(!req.randomize()) \`uvm_error("SEQ", "Randomize failed");

finish_item(req); // Execute item (blocks until driver is done)`
    },
    {
        id: 1,
        label: "Sequencer Arbitration",
        component: UvmComponentType.SEQUENCER,
        description: "The Sequencer receives the request. If multiple sequences are running, it arbitrates between them. Once granted, it passes the transaction handle to the Driver.",
        codeSnippet: `// The sequencer code is usually implicit in UVM
// Conceptually:
wait_for_grant(sequence_ptr);
selected_sequence.mid_do(item);
driver_port.put(item);
selected_sequence.post_do(item);`
    },
    {
        id: 2,
        label: "Driver Fetches Item",
        component: UvmComponentType.DRIVER,
        description: "The Driver pulls the transaction from the Sequencer using get_next_item(). It effectively 'pulls' data when it is ready to drive the bus.",
        codeSnippet: `// Inside driver run_phase
forever begin
  seq_item_port.get_next_item(req); // Blocking call
  
  drive_transfer(req); // Custom task to wiggle pins
  
  seq_item_port.item_done(); // Tell sequence we are finished
end`
    },
    {
        id: 3,
        label: "Driving Signals (Pin Level)",
        component: UvmComponentType.INTERFACE,
        description: "This is where UVM meets hardware. The Driver wiggles the pins on the Virtual Interface handle. This converts the high-level 'Transaction' object into raw 1s and 0s.",
        codeSnippet: `// Inside driver task drive_transfer(my_transaction t);
@(posedge vif.clk);
vif.psel    <= 1'b1;
vif.paddr   <= t.addr;
vif.pwdata  <= t.data;
vif.pwrite  <= (t.kind == WRITE);
@(posedge vif.clk);
vif.psel    <= 1'b0;`
    },
    {
        id: 4,
        label: "DUT Execution",
        component: UvmComponentType.DUT,
        description: "The Design Under Test (Verilog/VHDL) responds to the signal changes on the interface. The hardware logic executes.",
        codeSnippet: `// Verilog DUT Code
always @(posedge clk) begin
  if (psel && pwrite) begin
    mem[paddr] <= pwdata;
    prdata <= 32'h0;
  end else if (psel && !pwrite) begin
    prdata <= mem[paddr];
  end
end`
    },
    {
        id: 5,
        label: "Monitor Sampling",
        component: UvmComponentType.MONITOR,
        description: "The Monitor passively observes the interface. When it detects a valid protocol cycle, it samples the signal values and packs them back into a new Transaction object.",
        codeSnippet: `// Inside monitor run_phase
forever begin
  @(posedge vif.clk);
  if (vif.psel === 1'b1) begin
    tr = my_transaction::type_id::create("tr");
    tr.addr = vif.paddr;
    tr.data = (vif.pwrite) ? vif.pwdata : vif.prdata;
    tr.kind = (vif.pwrite) ? WRITE : READ;
    
    // Send to scoreboard
    ap.write(tr); 
  end
end`
    },
    {
        id: 6,
        label: "Scoreboard Check",
        component: UvmComponentType.SCOREBOARD,
        description: "The Scoreboard receives the transaction from the Monitor via an Analysis Port. It compares the observed result against the Expected Result (Reference Model).",
        codeSnippet: `// Inside scoreboard write() implementation
function void write(my_transaction t);
  my_transaction expected;
  
  expected = predictor.predict(t.addr, t.kind);
  
  if (t.data !== expected.data) begin
    \`uvm_error("SB", $sformatf("Mismatch! Exp: %0h, Got: %0h", expected.data, t.data))
  end else begin
    \`uvm_info("SB", "Match successful", UVM_LOW)
  end
endfunction`
    }
];

const App: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState<UvmComponentType>(UvmComponentType.DRIVER);
  const [aiData, setAiData] = useState<AiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('architecture');
  
  // Walkthrough State
  const [simulationStepIndex, setSimulationStepIndex] = useState<number>(-1);

  // Fetch explanation when active component changes, but only if we are in architecture mode and NOT simulating
  useEffect(() => {
    const fetchData = async () => {
      // Don't fetch AI data if simulating; we use hardcoded tutorial data
      if (viewMode === 'architecture' && simulationStepIndex === -1) {
        setIsLoading(true);
        const data = await getComponentExplanation(activeComponent);
        setAiData(data);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeComponent, viewMode, simulationStepIndex]);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSimulationStepIndex(-1); // Reset simulation on view change
    if (mode === 'builder') {
        setActiveComponent(UvmComponentType.SEQUENCE);
    } else {
        if (activeComponent === UvmComponentType.SEQUENCE) {
            setActiveComponent(UvmComponentType.DRIVER);
        }
    }
  };

  // Walkthrough Controls
  const startSimulation = () => {
      setSimulationStepIndex(0);
      setActiveComponent(WALKTHROUGH_STEPS[0].component);
  };

  const nextStep = () => {
      if (simulationStepIndex < WALKTHROUGH_STEPS.length - 1) {
          const next = simulationStepIndex + 1;
          setSimulationStepIndex(next);
          setActiveComponent(WALKTHROUGH_STEPS[next].component);
      }
  };

  const prevStep = () => {
      if (simulationStepIndex > 0) {
          const prev = simulationStepIndex - 1;
          setSimulationStepIndex(prev);
          setActiveComponent(WALKTHROUGH_STEPS[prev].component);
      }
  };

  const stopSimulation = () => {
      setSimulationStepIndex(-1);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-uvm-bg text-white overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-gray-700 flex items-center justify-between px-6 bg-gray-900 shrink-0 shadow-md z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-uvm-accent rounded-md flex items-center justify-center text-gray-900 font-bold font-mono shadow-[0_0_10px_rgba(56,189,248,0.5)]">
              UVM
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block">Master <span className="font-light text-gray-400">Class</span></h1>
          </div>
          
          <nav className="flex space-x-1 bg-gray-800 rounded-lg p-1">
             <button
               onClick={() => handleViewChange('architecture')}
               className={`px-4 py-1.5 text-xs sm:text-sm rounded-md font-medium transition-all ${
                 viewMode === 'architecture' 
                   ? 'bg-gray-700 text-white shadow-sm' 
                   : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
               }`}
             >
               Architecture
             </button>
             <button
               onClick={() => handleViewChange('builder')}
               className={`px-4 py-1.5 text-xs sm:text-sm rounded-md font-medium transition-all ${
                 viewMode === 'builder' 
                   ? 'bg-gray-700 text-white shadow-sm' 
                   : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
               }`}
             >
               Sequence Builder
             </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
            <button 
                onClick={() => setShowChat(!showChat)}
                className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                  showChat 
                  ? 'bg-uvm-accent text-gray-900 border-uvm-accent font-medium hover:bg-sky-400' 
                  : 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500'
                }`}
            >
                {showChat ? 'Hide Tutor' : 'Ask Tutor'}
            </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Center Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-uvm-bg">
            {viewMode === 'architecture' ? (
                <>
                    <div className="h-1/2 min-h-[400px] border-b border-gray-700 relative shadow-inner">
                        <UvmDiagram 
                            activeComponent={activeComponent} 
                            onSelectComponent={setActiveComponent}
                            simulationStepIndex={simulationStepIndex}
                            onStartSimulation={startSimulation}
                            onNextStep={nextStep}
                            onPrevStep={prevStep}
                            onStopSimulation={stopSimulation}
                            totalSteps={WALKTHROUGH_STEPS.length}
                        />
                    </div>
                    <div className="h-1/2 min-h-0 bg-uvm-bg">
                        <InfoPanel 
                            component={activeComponent} 
                            data={aiData} 
                            loading={isLoading} 
                            simulationStep={simulationStepIndex >= 0 ? WALKTHROUGH_STEPS[simulationStepIndex] : null}
                        />
                    </div>
                </>
            ) : (
                <SequenceBuilder />
            )}
        </div>

        {/* Right: Chat / Tutor */}
        {showChat && (
             <ChatInterface activeComponent={activeComponent} />
        )}
      </main>
    </div>
  );
};

export default App;