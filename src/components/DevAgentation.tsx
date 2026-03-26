import { useEffect, useState, type ComponentType } from "react";

export function DevAgentation() {
  const [AgentationComponent, setAgentationComponent] = useState<ComponentType | null>(
    null
  );

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    let isMounted = true;

    void import("agentation").then((module) => {
      if (isMounted) {
        setAgentationComponent(() => module.Agentation);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!import.meta.env.DEV || !AgentationComponent) {
    return null;
  }

  return <AgentationComponent />;
}
