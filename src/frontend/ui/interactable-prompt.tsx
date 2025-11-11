import React from "react";

interface InteractablePromptProps {
  name?: string;
}

export const InteractablePrompt: React.FC<InteractablePromptProps> = ({ name }) => {
  const styles = {
    container: {
      position: "absolute" as const,
      bottom: "20%",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      color: "white",
      padding: "12px 24px",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      textAlign: "center" as const,
      zIndex: 100,
      border: "1px solid rgba(255, 255, 255, 0.3)",
      animation: "pulse 1.5s ease-in-out infinite",
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
      Press F to talk{name ? ` to ${name}` : ""}
    </div>
  );
};
