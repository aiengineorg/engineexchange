"use client";

import { useEffect, useRef, useState } from "react";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "./tool";

type KnowledgeBaseToolProps = {
  part: any; // Using any for flexibility with AI SDK types
  toolCallId: string;
};

export function KnowledgeBaseTool({
  part,
  toolCallId,
}: KnowledgeBaseToolProps) {
  const [isOpen, setIsOpen] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Auto-collapse after 2 seconds
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Tool open={isOpen} onOpenChange={setIsOpen}>
      <ToolHeader state={part.state} type="tool-knowledgeBaseSearch" />
      <ToolContent>
        {part.state === "input-available" && part.input && (
          <ToolInput input={part.input} />
        )}
        {part.state === "output-available" && part.output && (
          <ToolOutput
            errorText={part.output.error}
            output={
              part.output.results && part.output.results.length > 0 ? (
                <div className="space-y-3 p-4">
                  <div className="text-muted-foreground text-xs">
                    Found {part.output.totalResults} relevant chunks for "
                    {part.output.query}"
                  </div>
                  <div className="space-y-3">
                    {part.output.results.map((result: any, index: number) => (
                      <div
                        className="rounded-lg border bg-muted/30 p-3 transition-colors"
                        key={index}
                      >
                        <div className="space-y-1">
                          <div className="text-foreground/90 text-sm">
                            {result.content}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <span>📚 {result.source}</span>
                            <span>•</span>
                            <span>
                              {Math.round(result.similarity * 100)}% match
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-muted-foreground text-sm">
                  {part.output.message ||
                    "No relevant information found in knowledge base"}
                </div>
              )
            }
          />
        )}
      </ToolContent>
    </Tool>
  );
}

