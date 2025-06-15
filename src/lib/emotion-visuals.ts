
export const EMOTION_VISUALS: { [key: string]: { icon: keyof typeof import('lucide-react/dynamicIconImports'); colorClass: string } } = {
  stress: { icon: "cloud-lightning", colorClass: "bg-yellow-200" },
  verdriet: { icon: "frown", colorClass: "bg-blue-200" },
  blij: { icon: "smile", colorClass: "bg-green-200" },
  error: { icon: "alert-triangle", colorClass: "bg-red-200" },
  angst: { icon: "shield-alert", colorClass: "bg-orange-200" },
  faalangst: { icon: "shield-alert", colorClass: "bg-orange-200" },
  onmacht: { icon: "battery-warning", colorClass: "bg-amber-200" },
  boosheid: { icon: "cloud-off", colorClass: "bg-slate-300" },
  dankbaarheid: { icon: "heart-handshake", colorClass: "bg-pink-200" },
  paniek: { icon: "siren", colorClass: "bg-red-300" },
  onzekerheid: { icon: "glasses", colorClass: "bg-indigo-200" },
};

export const getEmotionVisuals = (emotion: string | null) => {
  if (!emotion) {
    return { icon: "message-square", colorClass: "bg-zinc-100" };
  }
  const lowerCaseEmotion = emotion.toLowerCase();
  const foundKey = Object.keys(EMOTION_VISUALS).find(key => lowerCaseEmotion.includes(key));
  
  if (foundKey) {
    return EMOTION_VISUALS[foundKey];
  }

  return { icon: "help-circle", colorClass: "bg-gray-200" };
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
