
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserPreferences, TeacherPersona, Roadmap, GameContent, Message } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models - Using Gemini 3 Flash for speed and intelligence
const MODEL_FAST = 'gemini-3-flash-preview';

/**
 * Check User Content for Safety
 * Returns true if safe, false if prohibited.
 */
export const checkContentSafety = async (text: string): Promise<{ isSafe: boolean; reason?: string }> => {
  const prompt = `Analyze the following user text for strict safety violations based on this blacklist of prohibited topics:
  
  PROHIBITED TOPICS:
  - Politics, Government, Regimes (Insults, criticism, or sensitive political discussions)
  - Religion (Insults, blasphemy, or controversial religious debate)
  - Racism, Hate Speech, Discrimination
  - Dating, Romance, Flirting, Sexual content, Sexualities
  - Drugs, Alcohol, Illegal acts
  - Violence, Terrorism, Extremism
  - Profanity, Insults, Bad words
  - "Haram" topics (General Islamic prohibitions e.g. Pork, Gambling, Alcohol, Zina)

  Text to Analyze: "${text}"

  Determine if the text violates any of these. 
  If it is a simple greeting or language learning question, it is SAFE.
  
  Return JSON: 
  { 
    "isSafe": boolean, 
    "reason": string (Short explanation if unsafe, empty if safe) 
  }`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      isSafe: { type: Type.BOOLEAN },
      reason: { type: Type.STRING }
    },
    required: ["isSafe", "reason"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ]
      }
    });

    if (!response.text) {
        throw new Error("Empty response from safety check");
    }

    return JSON.parse(response.text) as { isSafe: boolean; reason?: string };
  } catch (e) {
    console.warn("Safety check failed, defaulting to safe:", e);
    return { isSafe: true };
  }
};

/**
 * Chat for the Onboarding phase
 */
export const sendOnboardingMessage = async (history: {role: string, parts: {text: string}[]}[], message: string, knownInterests?: string) => {
  const chat = ai.chats.create({ 
    model: MODEL_FAST,
    config: {
      systemInstruction: `You are a friendly language onboarding assistant. 
      Your goal is to gather the remaining info needed to build a plan.
      
      KNOWN INFO:
      User's Interests: ${knownInterests || 'Unknown'} (Do not ask about these again, but acknowledge them warmly).
      
      MISSING INFO (Ask about these 1 by 1):
      1. Motivation/Specific Goals (Work, Travel, etc).
      2. Time availability (How many minutes/day).
      
      INSTRUCTIONS:
      - If you don't have the motivation/goals yet, ask for it.
      - If you don't have the time availability yet, ask for it.
      - Once you have BOTH, your response MUST end with the question: "Do you have anything else to add?"
      
      Keep it conversational, short, and encouraging. Do not generate the plan yet, just gather info.`
    },
    history: history as any,
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};

/**
 * Generate Teacher Persona based on gathered data
 */
export const generateTeacherPersona = async (prefs: UserPreferences): Promise<TeacherPersona> => {
  const prompt = `Create a language teacher persona for a student learning ${prefs.targetLanguage}. 
  Student Interests: ${prefs.interests}. 
  Student Goal: ${prefs.goals}.
  Learning Style: ${prefs.learningStyle}.
  
  SAFETY OVERRIDE: 
  If 'Student Interests' or 'Student Goal' contains ANY prohibited topics (Politics, Romance, Drugs, etc.), IGNORE THEM completely and default to 'Travel' and 'Culture'.
  Ensure the persona is neutral, professional, and respectful.
  
  The teacher should have a name, age, personality, and teaching style geared towards this student.`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      age: { type: Type.INTEGER },
      personality: { type: Type.STRING },
      teachingStyle: { type: Type.STRING },
      catchphrase: { type: Type.STRING },
      avatarSeed: { type: Type.INTEGER, description: "A random number between 1 and 1000 for image generation" }
    },
    required: ["name", "age", "personality", "teachingStyle", "catchphrase", "avatarSeed"]
  };

  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
      ]
    }
  });

  return JSON.parse(response.text!) as TeacherPersona;
};

/**
 * Generate 4-Week Roadmap
 */
export const generateRoadmap = async (prefs: UserPreferences): Promise<Roadmap> => {
  const prompt = `Create a 4-week learning roadmap for ${prefs.targetLanguage} (Level: ${prefs.level}).
  Focus: ${prefs.goals}.
  Interests: ${prefs.interests}.
  
  SAFETY OVERRIDE:
  Ignore any prohibited topics in Interests/Goals. Focus on general language skills.

  Return a list of 4 weekly goals.`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      weeks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            week: { type: Type.INTEGER },
            theme: { type: Type.STRING },
            focus: { type: Type.STRING },
            activity: { type: Type.STRING },
            completed: { type: Type.BOOLEAN }
          },
          required: ["week", "theme", "focus", "activity", "completed"]
        }
      }
    },
    required: ["weeks"]
  };

  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return JSON.parse(response.text!) as Roadmap;
};

/**
 * Generate a Mini-Game Question
 */
export const generateVocabularyGame = async (
  targetLang: string, 
  nativeLang: string,
  level: string,
  theme: string, 
  focusConcept?: string
): Promise<GameContent> => {
   
   const isBeginner = level.includes('A1') || level.includes('A2') || level.toLowerCase().includes('beginner');

   let promptText = "";

   if (focusConcept) {
      promptText = `Generate a multiple-choice vocabulary question.
      Target Language: ${targetLang}
      User's Native Language: ${nativeLang}
      User Level: ${level}
      Concept to practice: "${focusConcept}"

      IMPORTANT INSTRUCTIONS:
      ${isBeginner 
        ? `Since the user is a beginner (${level}), write the Question text in ${nativeLang} asking for the translation or meaning of the ${targetLang} word, or vice versa (e.g. "What does '${focusConcept}' mean?" or "How do you say..."). The Options should be in ${targetLang}.` 
        : `Write the question in ${targetLang} but keep it simple.`
      }
      
      Return JSON with: 
      - question
      - options (4 strings)
      - correctAnswer
      - explanation (in ${nativeLang})
      - concept (repeat "${focusConcept}")
      - category (A broad topic name in ${nativeLang}, e.g., 'Greetings', 'Food', 'Travel'. Do NOT put the answer word here.)`;
   } else {
      promptText = `Generate a single multiple-choice vocabulary question related to "${theme}".
      Target Language: ${targetLang}
      User's Native Language: ${nativeLang}
      User Level: ${level}

      IMPORTANT INSTRUCTIONS:
      ${isBeginner 
        ? `Since the user is a beginner (${level}), write the Question text in ${nativeLang} (e.g., "How do you say 'Apple' in ${targetLang}?" or "Which word means 'To run'?"). The Options should be in ${targetLang}.` 
        : `Write the question in ${targetLang}.`
      }

      Return JSON with: 
      - question
      - options (4 strings)
      - correctAnswer
      - explanation (in ${nativeLang})
      - concept (the specific word being tested, hidden from user initially)
      - category (A broad topic name in ${nativeLang}, e.g., 'Greetings', 'Food', 'Travel'. Do NOT put the answer word here.)`;
   }

   const schema: Schema = {
     type: Type.OBJECT,
     properties: {
       question: { type: Type.STRING },
       options: { type: Type.ARRAY, items: { type: Type.STRING } },
       correctAnswer: { type: Type.STRING },
       explanation: { type: Type.STRING },
       concept: { type: Type.STRING },
       category: { type: Type.STRING, description: "A generalized topic name (e.g. 'Greetings') not the specific word." }
     },
     required: ["question", "options", "correctAnswer", "explanation", "concept", "category"]
   };

   const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: promptText,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return JSON.parse(response.text!) as GameContent;
};

/**
 * Chat with the Tutor
 */
export const chatWithTutor = async (
  currentHistory: Message[], 
  newMessage: string, 
  persona: TeacherPersona, 
  targetLang: string,
  nativeLang: string,
  level: string,
  context?: string
): Promise<string> => {
  
  const isBeginner = level.includes('A1') || level.includes('A2') || level.toLowerCase().includes('beginner');

  // Convert custom Message type to API history format
  const apiHistory = currentHistory.map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));

  const systemInstruction = `You are ${persona.name}, a ${persona.age}-year-old language teacher. 
  Personality: ${persona.personality}. 
  Teaching Style: ${persona.teachingStyle}.
  Target Language: ${targetLang}.
  Student's Native Language: ${nativeLang}.
  Student's Level: ${level}.
  ${context ? `CONTEXT FROM LAST SESSION: The student last discussed "${context}". Pick up from there if relevant or ask how they are doing with it.` : ''}
  
  Interact with the student. Be helpful, correct mistakes gently, and stay in character.
  
  LEVEL ADJUSTMENT:
  ${isBeginner 
    ? `CRITICAL: The student is a beginner (${level}). EXPLAIN things in ${nativeLang}. ASK questions in ${nativeLang} when setting up exercises, but ask them to say specific phrases in ${targetLang}. For example: "How would you say 'Good Morning' in ${targetLang}?" (in ${nativeLang}). Only use ${targetLang} for the actual practice words/sentences.` 
    : `You can use mostly ${targetLang}, but explain complex errors in ${nativeLang}.`
  }
  
  If the student speaks in their native language, help them translate to ${targetLang}.

  FEEDBACK CHECK:
  Occasionally (not every time), ask the student: "How are you finding the app/lessons so far?".
  If the student replies with ANY feedback (bugs, compliments, complaints), thank them warmly and append the exact tag [FEEDBACK_ACTION] to the end of your response. 
  Example: "Thanks for telling me! I'll pass that on to the developers. [FEEDBACK_ACTION]"`;

  const chat = ai.chats.create({ 
    model: MODEL_FAST,
    config: {
      systemInstruction: systemInstruction
    },
    history: apiHistory as any,
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text || "";
};
