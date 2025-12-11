export enum UvmComponentType {
  TOP = 'Top',
  TEST = 'Test',
  ENV = 'Environment',
  AGENT = 'Agent',
  SEQUENCER = 'Sequencer',
  DRIVER = 'Driver',
  MONITOR = 'Monitor',
  SCOREBOARD = 'Scoreboard',
  DUT = 'DUT',
  INTERFACE = 'Interface',
  SEQUENCE = 'Sequence',
  CONFIG_DB = 'Config DB'
}

export interface UvmNode {
  id: UvmComponentType;
  label: string;
  description: string;
  color: string;
  gridArea?: string; // For CSS Grid layout in the diagram
}

export interface AiResponse {
  explanation: string;
  codeSnippet: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  isLoading?: boolean;
}

export enum TransactionKind {
  READ = 'READ',
  WRITE = 'WRITE',
  IDLE = 'IDLE'
}

export interface SequenceStep {
  id: string;
  kind: TransactionKind;
  addr: string;
  data: string;
  delay: number;
}

export interface SimulationStep {
  id: number;
  label: string;
  component: UvmComponentType;
  description: string;
  codeSnippet: string;
  highlightConnections?: string[]; // IDs of connections to highlight
}