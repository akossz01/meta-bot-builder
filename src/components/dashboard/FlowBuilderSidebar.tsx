import React from 'react';
import { MessageSquareText, MessageCircleQuestion, CircleOff, RotateCcw, CreditCard, Image, Layers } from 'lucide-react';

type FlowBuilderSidebarProps = {
  onNodeTypeSelect?: (nodeType: string) => void;
};

export const FlowBuilderSidebar = ({ onNodeTypeSelect }: FlowBuilderSidebarProps) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleNodeClick = (nodeType: string) => {
    // On mobile, use click to select, on desktop, dragging is preferred
    if (onNodeTypeSelect && window.innerWidth < 768) {
      onNodeTypeSelect(nodeType);
    }
  };

  return (
    <aside className="p-4 h-full overflow-y-auto">
      <h3 className="text-lg font-bold mb-4 hidden md:block">Nodes</h3>
      <div className="space-y-3 md:space-y-4">
        <div 
          className="bg-background border-2 p-3 rounded-md cursor-pointer md:cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors active:bg-muted" 
          onDragStart={(event) => onDragStart(event, 'messageNode')} 
          onClick={() => handleNodeClick('messageNode')}
          draggable
        >
          <MessageSquareText className="h-8 w-8 text-primary" />
          <span className="text-xs font-semibold text-center">Message</span>
        </div>
        <div 
          className="bg-background border-2 p-3 rounded-md cursor-pointer md:cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors active:bg-muted" 
          onDragStart={(event) => onDragStart(event, 'quickReplyNode')} 
          onClick={() => handleNodeClick('quickReplyNode')}
          draggable
        >
          <MessageCircleQuestion className="h-8 w-8 text-primary" />
          <span className="text-xs font-semibold text-center">Quick Reply</span>
        </div>
        <div 
          className="bg-background border-2 p-3 rounded-md cursor-pointer md:cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors active:bg-muted" 
          onDragStart={(event) => onDragStart(event, 'cardNode')} 
          onClick={() => handleNodeClick('cardNode')}
          draggable
        >
          <CreditCard className="h-8 w-8 text-primary" />
          <span className="text-xs font-semibold text-center">Card</span>
        </div>
        <div 
          className="bg-background border-2 border-blue-500 p-3 rounded-md cursor-pointer md:cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors active:bg-muted" 
          onDragStart={(event) => onDragStart(event, 'loopNode')} 
          onClick={() => handleNodeClick('loopNode')}
          draggable
        >
          <RotateCcw className="h-8 w-8 text-blue-500" />
          <span className="text-xs font-semibold text-center">Loop</span>
        </div>
        <div 
          className="bg-background border-2 border-destructive p-3 rounded-md cursor-pointer md:cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors active:bg-muted" 
          onDragStart={(event) => onDragStart(event, 'endNode')} 
          onClick={() => handleNodeClick('endNode')}
          draggable
        >
          <CircleOff className="h-8 w-8 text-destructive" />
          <span className="text-xs font-semibold text-center">End</span>
        </div>
        <div 
          className="bg-background border-2 p-3 rounded-md cursor-pointer md:cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors active:bg-muted" 
          onDragStart={(event) => onDragStart(event, 'mediaNode')} 
          onClick={() => handleNodeClick('mediaNode')}
          draggable
        >
          <Image className="h-8 w-8 text-primary" />
          <span className="text-xs font-semibold text-center">Image</span>
        </div>
        <div 
          className="bg-background border-2 p-3 rounded-md cursor-pointer md:cursor-grab flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors active:bg-muted" 
          onDragStart={(event) => onDragStart(event, 'carouselNode')} 
          onClick={() => handleNodeClick('carouselNode')}
          draggable
        >
          <Layers className="h-8 w-8 text-primary" />
          <span className="text-xs font-semibold text-center">Carousel</span>
        </div>
      </div>
    </aside>
  );
};