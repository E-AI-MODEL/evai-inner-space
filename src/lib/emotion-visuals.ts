
export const EMOTION_VISUALS: { [key: string]: { icon: string; colorClass: string } } = {
  stress: { icon: "😰", colorClass: "bg-stress" },
  verdriet: { icon: "😢", colorClass: "bg-blue-200" },
  blij: { icon: "🙂", colorClass: "bg-yellow-100" },
};

export const getEmotionVisuals = (emotion: string | null) => {
  if (!emotion) {
    return { icon: "💬", colorClass: "bg-zinc-100" };
  }
  const lowerCaseEmotion = emotion.toLowerCase();
  return EMOTION_VISUALS[lowerCaseEmotion] || { icon: "🤔", colorClass: "bg-gray-200" };
};
