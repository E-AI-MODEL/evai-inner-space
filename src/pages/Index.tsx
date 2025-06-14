
import React, { useState } from "react";
import TopBar from "../components/TopBar";
import SidebarEmotionHistory from "../components/SidebarEmotionHistory";
import ChatBubble from "../components/ChatBubble";
import InputBar from "../components/InputBar";
import { useSeedEngine } from "../hooks/useSeedEngine";
import { toast } from "@/hooks/use-toast";
import SeedConfetti from "../components/SeedConfetti";

// Voorbeeld chat
const EXAMPLE_AI = [
  {
    id: "ai-1",
    from: "ai",
    label: "Valideren",
    accentColor: "#BFD7FF",
    content: "Ik hoor veel stress en onrust in je woorden.",
    showExplain: false,
    explainText:
      "Seed ‘Stress’. TTL: 30m. Prioriteit: Hoog. Trigger: ‘stress en paniek’.",
    emotionSeed: "stress",
    animate: true,
    meta: "30m – Hoog",
    brilliant: true,
  },
  {
    id: "ai-2",
    from: "ai",
    label: "Reflectievraag",
    accentColor: "#BFD7FF",
    content: "Wat is op dit moment de grootste trigger voor dat gevoel?",
    showExplain: false,
    explainText: "Reflection: vraag uit seed ‘Stress’.",
    emotionSeed: "stress",
    animate: false,
    meta: "30m – Hoog",
    brilliant: false,
  },
  {
    id: "ai-3",
    from: "ai",
    label: "Suggestie",
    accentColor: "#BFD7FF",
    content:
      "Probeer één minuut lang bewust en langzaam adem te halen — 4 tellen in, 4 tellen uit — om je lichaam eerst wat rust te geven.",
    showExplain: false,
    explainText: "Coping-suggestie ‘Stress’.",
    emotionSeed: "stress",
    animate: false,
    meta: "30m – Hoog",
    brilliant: false,
  },
];

const Index = () => {
  // Demo-chat met userprompt + seed-detectie; alles mock
  const [messages, setMessages] = useState([
    {
      id: "user-1",
      from: "user",
      label: null,
      content: "Ik voel stress en paniek, alles wordt me te veel.",
      emotionSeed: null,
      animate: false,
    },
    ...EXAMPLE_AI,
  ]);
  const [input, setInput] = useState("");
  const [showExplain, setShowExplain] = useState(false);
  const [seedConfetti, setSeedConfetti] = useState(false); // Nieuw
  const { checkInput } = useSeedEngine(); // Seed-engine hook

  // Demo: bij verzenden voeg nieuwe user-bubbel en AI-sequence toe
  const onSend = () => {
    if (!input.trim()) return;
    const nextId = `user-${messages.length + 1}`;
    // Stap 1: check seed
    const matchedSeed = checkInput(input.trim());

    // --- BRILJANTFEELING ---
    let aiResp;
    if (matchedSeed) {
      // Trigger een briljant-effect
      setSeedConfetti(true);
      toast({
        title: "Seed gevonden!",
        description: `De emotie ‘${matchedSeed.emotion}’ werd herkend. 🤩`,
      });
      aiResp = {
        id: `ai-seed-${messages.length + 1}`,
        from: "ai",
        label: "Valideren",
        accentColor: "#BFD7FF",
        content: matchedSeed.response,
        showExplain: showExplain,
        explainText: `Seed ‘${matchedSeed.emotion}’. Trigger gevonden: "${matchedSeed.triggers.find(t => input.trim().toLowerCase().includes(t))}"`,
        emotionSeed: matchedSeed.emotion,
        animate: true,
        meta: matchedSeed.meta,
        brilliant: true, // highlight & icoon
      };
    } else {
      aiResp = {
        id: `ai-new-${messages.length + 1}`,
        from: "ai",
        label: "Valideren",
        accentColor: "#BFD7FF",
        content: "Ik hoor iets bijzonders in je bericht, vertel gerust meer.",
        showExplain: showExplain,
        explainText: "Demo logica: geen seed gevonden.",
        emotionSeed: null,
        animate: true,
        meta: "",
        brilliant: false,
      };
    }

    setMessages([
      ...messages,
      { id: nextId, from: "user", label: null, content: input.trim(), emotionSeed: null, animate: false },
      aiResp,
    ]);
    setInput("");
  };

  return (
    <div className="w-full min-h-screen bg-background font-inter">
      <SeedConfetti show={seedConfetti} /> {/* Confetti layer */}
      <TopBar />
      <div className="flex">
        {/* Sidebar emotie-historie alleen op desktop */}
        <SidebarEmotionHistory />
        {/* Hoofd chat */}
        <main className="flex-1 flex flex-col justify-between min-h-[calc(100vh-56px)] px-0 md:px-12 py-8 transition-all">
          <div className="flex-1 flex flex-col justify-end max-w-2xl mx-auto w-full">
            <div className="mb-2">
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  from={msg.from as "user" | "ai"}
                  label={msg.label as any}
                  accentColor={(msg as any).accentColor}
                  meta={(msg as any).meta}
                  emotionSeed={msg.emotionSeed}
                  animate={!!msg.animate}
                  showExplain={showExplain && msg.from === "ai"}
                  explainText={(msg as any).explainText}
                  brilliant={!!(msg as any).brilliant}
                >
                  {msg.content}
                </ChatBubble>
              ))}
            </div>
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setShowExplain((s) => !s)}
                className="flex items-center gap-2 text-sm px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-all font-medium"
                aria-pressed={showExplain}
                aria-label="Toon redenatie"
              >
                <span>Toon redenatie</span>
                <span
                  className={`transition-transform ${
                    showExplain ? "rotate-180" : ""
                  }`}
                  aria-hidden
                >▼</span>
              </button>
            </div>
            <InputBar
              value={input}
              onChange={setInput}
              onSend={onSend}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
