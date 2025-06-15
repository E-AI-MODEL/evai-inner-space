
import React from 'react';

interface ChatActionsProps {
    showExplain: boolean;
    setShowExplain: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatActions: React.FC<ChatActionsProps> = ({ showExplain, setShowExplain }) => {
    return (
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
    );
};

export default ChatActions;
