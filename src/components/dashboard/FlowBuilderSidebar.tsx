import React from 'react';
import { MessageSquareText, MessageCircleQuestion, CircleOff, RotateCcw, CreditCard, Image, Layers } from 'lucide-react';

export const FlowBuilderSidebar = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="p-4 h-full overflow-y-auto">
      <h3 className="text-lg font-bold mb-4 hidden md:block">Nodes</h3>
      <div className="space-y-3 md:space-y-4">
        <div 
          className="bg-background border-2 p-3 rounded-md cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors active:cursor-grabbing" 
          onDragStart={(event) => onDragStart(event, 'messageNode')} 
          draggable
        >
          <MessageSquareText className="h-8 w-8 text-primary" />
          <span className="text-xs font-semibold text-center">Message</span>
        </div>
        <div 
          className="bg-background border-2 p-3 rounded-md cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors active:cursor-grabbing" 
          onDragStart={(event) => onDragStart(event, 'quickReplyNode')} 
          draggable
        >
          <MessageCircleQuestion className="h-8 w-8 text-primary" />
          <span className="text-xs font-semibold text-center">Quick Reply</span>
        </div>
        <div 
          className="bg-background border-2 p-3 rounded-md cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors active:cursor-grabbing" 
          onDragStart={(event) => onDragStart(event, 'cardNode')} 
          draggable
        >
          <CreditCard className="h-8 w-8 text-primary" />
          <span className="text-xs font-semibold text-center">Card</span>
        </div>
        <div 
          className="bg-background border-2 border-blue-500 p-3 rounded-md cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors active:cursor-grabbing" 
          onDragStart={(event) => onDragStart(event, 'loopNode')} 
          draggable
        >
          <RotateCcw className="h-8 w-8 text-blue-500" />
          <span className="text-xs font-semibold text-center">Loop</span>
        </div>
        <div 
          className="bg-background border-2 border-destructive p-3 rounded-md cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors active:cursor-grabbing" 
          onDragStart={(event) => onDragStart(event, 'endNode')} 
          draggable
        >
          <CircleOff className="h-8 w-8 text-destructive" />
          <span className="text-xs font-semibold text-center">End</span>
        </div>
        <div 
          className="bg-background border-2 p-3 rounded-md cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors active:cursor-grabbing" 
          onDragStart={(event) => onDragStart(event, 'mediaNode')} 
          draggable
        >
          <Image className="h-8 w-8 text-primary" />
          <span className="text-xs font-semibold text-center">Image</span>
        </div>
        <div 
          className="bg-background border-2 p-3 rounded-md cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors active:cursor-grabbing" 
          onDragStart={(event) => onDragStart(event, 'carouselNode')} 
          draggable
        >
          <Layers className="h-8 w-8 text-primary" />
          <span className="text-xs font-semibold text-center">Carousel</span>
        </div>
      </div>
    </aside>
  );
};