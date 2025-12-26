import { GoogleGenAI } from "@google/genai";

export const getBusinessInsights = async (servicesData: any) => {
  try {
    // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Using gemini-3-flash-preview for basic text analysis and recommendation tasks.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise estes dados de um lava-jato: ${JSON.stringify(servicesData)}. 
      Forneça 3 dicas curtas e práticas de marketing ou operação para aumentar o lucro hoje. 
      Responda em português de forma profissional e concisa.`,
      config: {
        temperature: 0.7,
      },
    });
    // Accessing the .text property directly as per the latest SDK guidelines.
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Não foi possível gerar insights no momento. Continue o bom trabalho!";
  }
};