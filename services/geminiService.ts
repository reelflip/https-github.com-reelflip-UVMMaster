import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UvmComponentType, AiResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert Senior Verification Engineer specializing in SystemVerilog and UVM (Universal Verification Methodology). 
Your goal is to teach UVM concepts clearly, concisely, and with excellent code examples.

When asked to explain a component:
1. Provide a high-level conceptual explanation (Analogy if helpful).
2. Explain its role in the TLM (Transaction Level Modeling) flow.
3. Provide a syntactically correct SystemVerilog code snippet inheriting from the correct uvm_class (e.g., uvm_driver, uvm_monitor).
4. Keep the code snippet focused on the core logic (e.g., run_phase for drivers).
`;

export const getComponentExplanation = async (component: UvmComponentType): Promise<AiResponse> => {
  try {
    const prompt = `Explain the ${component} in a UVM Testbench. Include a standard SystemVerilog class template for it. Format the output with clear headings.`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, // Lower temperature for more deterministic code
      }
    });

    const text = response.text || "No explanation available.";
    
    // Simple parsing to separate code and text if the model follows standard markdown code blocks
    const codeBlockRegex = /```systemverilog([\s\S]*?)```|```verilog([\s\S]*?)```|```([\s\S]*?)```/;
    const match = text.match(codeBlockRegex);
    
    let codeSnippet = "// No code example generated.";
    let explanation = text;

    if (match) {
      codeSnippet = match[1] || match[2] || match[3] || "";
      explanation = text.replace(match[0], "").trim();
    }

    return {
      explanation,
      codeSnippet: codeSnippet.trim()
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      explanation: "Failed to fetch explanation. Please check your API key or try again.",
      codeSnippet: "// Error generating code"
    };
  }
};

export const streamChatResponse = async (
  history: { role: 'user' | 'model'; content: string }[],
  currentMessage: string,
  activeComponent: UvmComponentType
): Promise<AsyncIterable<string>> => {
  const contextPrompt = `Context: The user is currently studying the ${activeComponent} component. Focus answers on this context if ambiguous.`;
  
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: [
      { role: 'user', parts: [{ text: SYSTEM_INSTRUCTION }] },
      { role: 'model', parts: [{ text: "Understood. I am ready to explain UVM concepts." }] },
      ...history.map(h => ({ role: h.role, parts: [{ text: h.content }] }))
    ],
  });

  const result = await chat.sendMessageStream({ message: `${contextPrompt}\n\nUser Question: ${currentMessage}` });
  
  // Return an async iterable that yields text chunks
  return (async function* () {
    for await (const chunk of result) {
       yield chunk.text || '';
    }
  })();
};