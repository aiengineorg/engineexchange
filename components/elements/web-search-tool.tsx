"use client";

import { useEffect, useRef, useState } from "react";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "./tool";

type WebSearchToolProps = {
  part: any; // Using any for flexibility with AI SDK types
  toolCallId: string;
};

export function WebSearchTool({ part, toolCallId }: WebSearchToolProps) {
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
      <ToolHeader state={part.state} type="tool-webSearch" />
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
                    Found {part.output.totalResults} results for "
                    {part.output.query}"
                  </div>
                  <div className="space-y-3">
                    {part.output.results.map((result: any, index: number) => (
                      <div
                        className="rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                        key={index}
                      >
                        <a
                          className="block space-y-1"
                          href={result.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <div className="font-medium text-sm text-blue-600 hover:underline dark:text-blue-400">
                            {result.title}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {result.url}
                          </div>
                          <div className="text-foreground/80 text-xs">
                            {result.description}
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-muted-foreground text-sm">
                  No results found
                </div>
              )
            }
          />
        )}
      </ToolContent>
    </Tool>
  );
}

