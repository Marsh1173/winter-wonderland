import { Engine } from "old-src-2/model/runtime/engine";
import { FrontendEnvironment } from "old-src-2/model/runtime/frontend/frontend-environment";
import React, { useEffect, useRef } from "react";

/**
 * GameCanvas component wraps the game engine and provides a canvas for rendering
 * Manages engine lifecycle within React component lifecycle
 */
export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const initEngine = async () => {
      // Create frontend environment
      const environment = new FrontendEnvironment(canvasRef.current!);

      // Create engine
      const engine = new Engine(environment);
      engineRef.current = engine;

      // Initialize and start
      await engine.init();
      engine.start();

      console.log("Game engine started");
    };

    initEngine().catch(console.error);

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.shutdown().catch(console.error);
        engineRef.current = null;
      }
    };
  }, []);

  return <canvas ref={canvasRef} />;
};
