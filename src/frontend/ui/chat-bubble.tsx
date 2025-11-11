import React, { useState, useEffect } from "react";

interface ChatBubbleProps {
  name: string;
  text: string[];
  on_close: () => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ name, text, on_close }) => {
  const [displayed_text, set_displayed_text] = useState("");
  const [text_index, set_text_index] = useState(0);
  const [selected_text, set_selected_text] = useState("");

  const typewriter_speed = 20; // milliseconds per character

  // Pick a random text from the array on mount
  useEffect(() => {
    const random_text = text[Math.floor(Math.random() * text.length)];
    set_selected_text(random_text);
    set_displayed_text("");
    set_text_index(0);
  }, [text]);

  useEffect(() => {
    if (text_index < selected_text.length) {
      const timer = setTimeout(() => {
        set_displayed_text(selected_text.substring(0, text_index + 1));
        set_text_index(text_index + 1);
      }, typewriter_speed);

      return () => clearTimeout(timer);
    }
  }, [text_index, selected_text]);

  const styles = {
    container: {
      position: "absolute" as const,
      bottom: "20%",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      color: "white",
      padding: "20px",
      borderRadius: "12px",
      fontSize: "16px",
      maxWidth: "600px",
      width: "90%",
      zIndex: 101,
      border: "2px solid rgba(255, 255, 255, 0.5)",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
    } as React.CSSProperties,
    name: {
      fontWeight: "bold" as const,
      marginBottom: "12px",
      fontSize: "18px",
      color: "#a8dadc",
    } as React.CSSProperties,
    text: {
      lineHeight: "1.6",
      minHeight: "40px",
    } as React.CSSProperties,
    hint: {
      fontSize: "12px",
      marginTop: "16px",
      color: "rgba(255, 255, 255, 0.6)",
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      <div style={styles.name}>{name}</div>
      <div style={styles.text}>{displayed_text}</div>
      <div style={styles.hint}>Press F to close</div>
    </div>
  );
};
