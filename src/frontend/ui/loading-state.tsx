import { CHARACTERS, get_character_model_url, get_character_preview_url } from "@/model/characters";
import React, { useState, useEffect } from "react";

interface LoadingStateProps {
  on_loading_complete: () => void;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ on_loading_complete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 30;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => on_loading_complete(), 300);
          return 100;
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [on_loading_complete]);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>❄️ Winter Wonderland</h1>
        <div style={styles.loadingBarContainer}>
          <div style={styles.loadingBarBackground}>
            <div
              style={{
                ...styles.loadingBarFill,
                width: `${Math.min(progress, 100)}%`,
              }}
            />
          </div>
          <p style={styles.percentage}>{Math.round(Math.min(progress, 100))}%</p>
        </div>
      </div>
      {CHARACTERS.map((character) => {
        return (
          <div key={character.id}>
            <link rel="prefetch" href={get_character_preview_url(character)}></link>
            <link rel="prefetch" href={get_character_model_url(character.id)}></link>
          </div>
        );
      })}
      <link rel="prefetch" href={"/assets/Wonderland.glb"}></link>
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
    backgroundColor: "#191922",
  } as React.CSSProperties,
  content: {
    textAlign: "center" as const,
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
  } as React.CSSProperties,
  title: {
    fontSize: "1.8rem",
    marginBottom: "2rem",
    letterSpacing: "1px",
    fontWeight: 700,
  } as React.CSSProperties,
  loadingBarContainer: {
    display: "flex",
    flexDirection: "row" as const,
    alignItems: "center",
    gap: "1rem",
  } as React.CSSProperties,
  loadingBarBackground: {
    width: "200px",
    height: "8px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "4px",
    overflow: "hidden" as const,
  } as React.CSSProperties,
  loadingBarFill: {
    height: "100%",
    backgroundColor: "#00d4ff",
    borderRadius: "4px",
    transition: "width 0.2s ease",
  } as React.CSSProperties,
  percentage: {
    fontSize: "0.85rem",
    margin: 0,
    minWidth: "35px",
    fontWeight: 600,
  } as React.CSSProperties,
};
