import React from 'react';
import { MessageSquareText, MessageCircleQuestion, CircleOff, RotateCcw, CreditCard } from 'lucide-react';

export const FlowBuilderSidebar = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="border-r-2 p-4">
      <h3 className="text-lg font-bold mb-4">Nodes</h3>
      <div className="space-y-4">
        <div 
          className="bg-background border-2 p-3 rounded-md cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors" 
          onDragStart={(event) => onDragStart(event, 'messageNode')} 
          draggable
        >
          <MessageSquareText className="h-8 w-8 text-primary" />
          <span className="text-xs font-semibold">Message</span>
        </div>
        <div 
          className="bg-background border-2 p-3 rounded-md cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors" 
          onDragStart={(event) => onDragStart(event, 'quickReplyNode')} 
          draggable
        >
          <MessageCircleQuestion className="h-8 w-8 text-primary" />
          <span className="text-xs font-semibold">Quick Reply</span>
        </div>
        <div 
          className="bg-background border-2 p-3 rounded-md cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors" 
          onDragStart={(event) => onDragStart(event, 'cardNode')} 
          draggable
        >
          <CreditCard className="h-8 w-8 text-primary" />
          <span className="text-xs font-semibold">Card</span>
        </div>
        <div 
          className="bg-background border-2 border-blue-500 p-3 rounded-md cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors" 
          onDragStart={(event) => onDragStart(event, 'loopNode')} 
          draggable
        >
          <RotateCcw className="h-8 w-8 text-blue-500" />
          <span className="text-xs font-semibold">Loop</span>
        </div>
        <div 
          className="bg-background border-2 border-destructive p-3 rounded-md cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors" 
          onDragStart={(event) => onDragStart(event, 'endNode')} 
          draggable
        >
          <CircleOff className="h-8 w-8 text-destructive" />
          <span className="text-xs font-semibold">End</span>
        </div>
      </div>
    </aside>
  );
};