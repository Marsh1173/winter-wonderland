import { CHARACTERS, get_character_preview_url } from "@/model/characters";
import { connect_to_server, type PlayerData } from "../networking/websocket-client";
import React, { useState } from "react";

interface CharacterSelectStateProps {
  on_character_selected: (ws: WebSocket, player_data: PlayerData) => void;
}

export const CharacterSelectState: React.FC<CharacterSelectStateProps> = ({ on_character_selected }) => {
  const [name, setName] = useState("Nate");
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(
    CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]!.id
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnter = async () => {
    if (!name.trim() || !selectedCharacter) return;

    setIsLoading(true);
    setError(null);

    try {
      const { ws, player_data } = await connect_to_server(name, selectedCharacter);
      on_character_selected(ws, player_data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Connection failed";
      setError(errorMessage);
      console.error("Connection error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = name.trim().length > 0 && selectedCharacter !== null;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Create Your Character</h1>

        {/* Name Input */}
        <div style={styles.section}>
          <label style={styles.label}>What's your name?</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            maxLength={30}
          />
        </div>

        {/* Character Selection */}
        <div style={styles.section}>
          <label style={styles.label}>Choose Your Character</label>
          <div style={styles.characterGrid}>
            {CHARACTERS.map((character) => (
              <button
                key={character.id}
                onClick={() => setSelectedCharacter(character.id)}
                style={{
                  ...styles.characterButton,
                  ...(selectedCharacter === character.id ? styles.characterButtonSelected : {}),
                }}
              >
                <img src={get_character_preview_url(character)} alt={character.name} style={styles.characterImage} />
                <span style={styles.characterLabel}>{character.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Enter Button */}
        <button
          onClick={handleEnter}
          disabled={!isFormValid || isLoading}
          style={{
            ...styles.enterButton,
            ...(!isFormValid || isLoading ? styles.enterButtonDisabled : {}),
          }}
        >
          {isLoading ? "Entering..." : "Enter"}
        </button>

        {/* Error Message */}
        {error && <div style={styles.errorMessage}>{error}</div>}
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as React.CSSProperties,
  content: {
    maxWidth: "600px",
    width: "calc(100% - 2rem)",
  } as React.CSSProperties,
  title: {
    fontSize: "2rem",
    marginBottom: "2rem",
    textAlign: "center" as const,
  } as React.CSSProperties,
  section: {
    marginBottom: "2.5rem",
  } as React.CSSProperties,
  label: {
    display: "block",
    marginBottom: "0.75rem",
    fontSize: "1.1rem",
    fontWeight: 600,
  } as React.CSSProperties,
  input: {
    width: "100%",
    padding: "0.75rem",
    fontSize: "1rem",
    border: "2px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "8px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
  characterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: "1rem",
  } as React.CSSProperties,
  characterButton: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.5rem",
    paddingBottom: "0.5rem",
    border: "2px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "8px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    cursor: "pointer",
  } as React.CSSProperties,
  characterButtonSelected: {
    backgroundColor: "rgba(0, 212, 255, 0.2)",
    border: "2px solid #00d4ff",
  } as React.CSSProperties,
  characterImage: {
    width: "64px",
    height: "64px",
    objectFit: "contain" as const,
  } as React.CSSProperties,
  characterLabel: {
    fontSize: "0.8rem",
    fontWeight: 500,
  } as React.CSSProperties,
  enterButton: {
    width: "100%",
    padding: "1rem",
    fontSize: "1.1rem",
    fontWeight: 600,
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#00d4ff",
    cursor: "pointer",
    marginTop: "1rem",
  } as React.CSSProperties,
  enterButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  } as React.CSSProperties,
  errorMessage: {
    marginTop: "1rem",
    padding: "0.75rem",
    backgroundColor: "rgba(255, 68, 68, 0.2)",
    border: "2px solid #ff4444",
    borderRadius: "8px",
    color: "#ff6b6b",
    fontSize: "0.9rem",
    textAlign: "center" as const,
  } as React.CSSProperties,
};
