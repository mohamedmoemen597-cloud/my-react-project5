import { GoogleGenAI, Type } from "@google/genai";

// Use process.env.API_KEY as per requirements.
// Note: In a pure static file setup without a bundler replacing this, 
// this requires the environment to provide 'process'.
const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

let ai;
if (apiKey) {
    ai = new GoogleGenAI({ apiKey: apiKey });
}

export const generateExam = async (config) => {
  if (!ai) {
      console.error("API Key missing");
      throw new Error("API Key is missing. Check configuration.");
  }

  const prompt = `
    أنت خبير متخصص في وضع امتحانات العلوم للمرحلة الإعدادية في مصر، ومُلم تمامًا بمنهج الصف الأول الإعدادي للعام الدراسي 2025/2026. مهمتك هي إنشاء مجموعة فريدة ومتنوعة من أسئلة الاختيار من متعدد عالية الجودة.

    **المواصفات المطلوبة:**
    1.  **موضوع الامتحان:** ${config.title}
    2.  **إجمالي عدد الأسئلة:** ${config.questionCount}
    3.  **توزيع مستويات الصعوبة (مهم جدًا):**
        *   **أسئلة صعبة (${config.hardQuestions} سؤالًا):** يجب أن تكون هذه الأسئلة عميقة وتتطلب تطبيق المفاهيم، الربط بين المفاهيم، وتحليل البيانات.
        *   **أسئلة سهلة ومتوسطة (${config.questionCount - config.hardQuestions} سؤالًا):** تغطي أساسيات المنهج والتذكر والفهم المباشر.

    4.  **تنوع الأسئلة:**
        *   تجنب تكرار نفس الفكرة.
        *   غطِّ جميع جوانب الموضوع المحدد في العنوان (${config.title}).

    5.  **شروط التنسيق والإخراج:**
        *   كل سؤال يجب أن يحتوي على أربعة خيارات.
        *   خيار واحد فقط صحيح.
        *   يجب أن تكون الخيارات الأخرى (المشتتات) منطقية علميًا ولكنها خاطئة.
  `;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        questionText: { type: Type.STRING, description: "نص السؤال باللغة العربية." },
        options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "مصفوفة من أربعة خيارات نصية." },
        correctAnswerIndex: { type: Type.INTEGER, description: "الفهرس الصفري للإجابة الصحيحة." },
      },
      required: ["questionText", "options", "correctAnswerIndex"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Optimized for speed/cost as per guidelines for basic text tasks
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7, 
      },
    });

    const jsonString = response.text.trim();
    const questions = JSON.parse(jsonString);
    
    if (!Array.isArray(questions)) {
      throw new Error("API did not return an array of questions.");
    }

    return questions;
  } catch (error) {
    console.error("Error generating exam with Gemini:", error);
    throw new Error("Failed to generate the exam. Please try again later.");
  }
};