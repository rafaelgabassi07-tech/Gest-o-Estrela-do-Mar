import { GoogleGenAI } from "@google/genai";

/**
 * Calls the Gemini API to get an analysis of monthly financial data.
 * @param data A string representation of the monthly expenses and income.
 * @returns A promise that resolves to the AI's analysis in markdown format.
 * @throws Error if the API call fails.
 */
export async function getMonthlyAnalysis(data: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Você é um assistente financeiro especializado em pequenos comércios (quiosque de praia).
    Analise os seguintes dados financeiros do mês.
    
    Os dados incluem:
    - Receita e Despesas Totais
    - Saldo em Caixa (dinheiro físico estimado)
    - Despesas por categoria
    - Um resumo do fluxo diário (dias com movimentação)

    Forneça uma análise estratégica curta e direta (máximo 3 parágrafos e alguns bullet points):
    1.  **Saúde Financeira:** O quiosque teve lucro? O saldo de caixa está saudável para repor estoque?
    2.  **Análise de Gastos:** Identifique onde está indo a maior parte do dinheiro (ex: muito gasto com funcionário ou reposição?).
    3.  **Dica de Ouro:** Sugira uma ação prática para o próximo mês baseada nos dados (ex: "Reduzir conta de energia", "Aumentar estoque antes do dia X que teve muita venda").

    Dados Financeiros:
    ${data}

    Responda em Markdown. Use negrito para destacar valores importantes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest', // Optimized for speed and cost
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });
    return response.text ?? 'Nenhuma análise disponível.';
  } catch (error) {
    console.error('Erro ao buscar análise Gemini:', error);
    throw new Error('Falha ao obter análise mensal da IA. Verifique sua conexão ou a chave de API.');
  }
}