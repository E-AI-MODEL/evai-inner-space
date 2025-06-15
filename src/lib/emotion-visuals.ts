
export const EMOTION_VISUALS: { [key: string]: { icon: string; colorClass: string } } = {
  stress: { icon: "😰", colorClass: "bg-stress" },
  verdriet: { icon: "😢", colorClass: "bg-blue-200" },
  blij: { icon: "🙂", colorClass: "bg-yellow-100" },
  error: { icon: "⚠️", colorClass: "bg-red-200" },
};

export const getEmotionVisuals = (emotion: string | null) => {
  if (!emotion) {
    return { icon: "💬", colorClass: "bg-zinc-100" };
  }
  const lowerCaseEmotion = emotion.toLowerCase();
  return EMOTION_VISUALS[lowerCaseEmotion] || { icon: "🤔", colorClass: "bg-gray-200" };
};

export const LABEL_VISUALS: { [key: string]: { accentColor: string } } = {
  Valideren: { accentColor: "#DBEAFE" }, // tailwind blue-100
  Reflectievraag: { accentColor: "#D1FAE5" }, // tailwind green-100
  Suggestie: { accentColor: "#F3E8FF" }, // tailwind purple-100
  Fout: { accentColor: "#FEE2E2" }, // tailwind red-100
};

export const getLabelVisuals = (label: string | null) => {
  const defaultVisual = { accentColor: "#EFF6FF" }; // tailwind blue-50 as a neutral default
  if (!label || !(label in LABEL_VISUALS)) {
    return defaultVisual;
  }
  return LABEL_VISUALS[label as keyof typeof LABEL_VISUALS];
};
