
import { GoogleGenAI, Type } from "@google/genai";

const MAX_FILE_SIZE_MB = 50;

export interface AiPrompts {
    veo: string;
    sora: string;
    kling: string;
}

/**
 * Converts a File object to a base64 string.
 * @param file The file to convert.
 * @returns A promise that resolves to the base64 encoded string (without data URI prefix).
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URI prefix (e.g., "data:video/mp4;base64,")
            const base64String = result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => {
            reject(new Error("Gagal membaca file: " + error));
        };
    });
};


/**
 * Generates descriptive prompts for a video file, tailored for different AI models.
 * @param videoFile The video file to analyze.
 * @returns A promise that resolves to an object containing the generated text prompts.
 */
export const generatePromptFromVideo = async (videoFile: File): Promise<AiPrompts> => {
    if (!process.env.API_KEY) {
        throw new Error("API key tidak dikonfigurasi.");
    }

    if (videoFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`Ukuran file melebihi batas ${MAX_FILE_SIZE_MB}MB.`);
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const videoBase64 = await fileToBase64(videoFile);
    
    const videoPart = {
        inlineData: {
            data: videoBase64,
            mimeType: videoFile.type,
        },
    };
    
    const promptText = `Analyze this video, including its audio track, and generate three distinct, detailed, and descriptive prompts that could be used to recreate a similar video. Each prompt should be tailored to the specific strengths of a different text-to-video AI model: Veo, Sora, and Kling.

    **Crucially, if there is any spoken dialogue in the video, you must include it verbatim in the generated prompts.**

    For each model, describe the following elements in a cohesive paragraph:
    - Subject(s) and their appearance.
    - Key actions or events taking place.
    - The setting and environment.
    - Spoken dialogue, if present.
    - Visual style (e.g., cinematic, photorealistic, anime).
    - Camera work (e.g., static shot, panning, handheld).
    - Lighting and color palette.
    - Overall mood.

    Tailor each prompt as follows:
    1.  **Veo Prompt:** Emphasize cinematic quality, high-definition realism, nuanced details, and specific camera movements (e.g., "dolly zoom," "aerial shot").
    2.  **Sora Prompt:** Focus on creating a narrative, imaginative scene with a strong grasp of physics and object interaction. Prompts can be longer and more descriptive.
    3.  **Kling Prompt:** Highlight realistic motion, detailed character descriptions, and actions unfolding over time, suitable for generating slightly longer, coherent clips.

    Return the result as a JSON object.`;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            veo: {
                type: Type.STRING,
                description: 'A detailed prompt tailored for the Veo text-to-video model, including any dialogue.'
            },
            sora: {
                type: Type.STRING,
                description: 'A detailed prompt tailored for the Sora text-to-video model, including any dialogue.'
            },
            kling: {
                type: Type.STRING,
                description: 'A detailed prompt tailored for the Kling text-to-video model, including any dialogue.'
            }
        },
        required: ['veo', 'sora', 'kling']
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: promptText }, videoPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });

    try {
        const jsonText = response.text.trim();
        const prompts: AiPrompts = JSON.parse(jsonText);
        return prompts;
    } catch (e) {
        console.error("Failed to parse JSON response:", response.text);
        throw new Error("Gagal mem-parsing respons dari AI. Coba lagi.");
    }
};
