"use client";

import React, { useState } from 'react';
import { useTranslations } from "next-intl";
import { RotateCcw, CircleOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FlowBuilderSidebarProps = {
  onNodeTypeSelect: (nodeType: string) => void;
};

type NodeCategory = 'all' | 'reply' | 'functional';

type NodeTypeCard = {
  type: string;
  imagePath: string;
  borderColor?: string;
  category: 'reply' | 'functional';
};

export function FlowBuilderSidebar({ onNodeTypeSelect }: FlowBuilderSidebarProps) {
  const [selectedCategory, setSelectedCategory] = useState<NodeCategory>('all');
  const t = useTranslations("FlowSidebar");

  const nodeTypes: NodeTypeCard[] = [
    {
      type: 'messageNode',
      imagePath: '/img/text_reply.png',
      category: 'reply',
    },
    {
      type: 'quickReplyNode',
      imagePath: '/img/options_reply.png',
      category: 'reply',
    },
    {
      type: 'cardNode',
      imagePath: '/img/card_reply.png',
      category: 'reply',
    },
    {
      type: 'carouselNode',
      imagePath: '/img/carousel_reply.png',
      category: 'reply',
    },
    {
      type: 'mediaNode',
      imagePath: '/img/img_reply.png',
      category: 'reply',
    },
    {
      type: 'loopNode',
      imagePath: '',
      borderColor: 'border-blue-500',
      category: 'functional',
    },
    {
      type: 'endNode',
      imagePath: '',
      borderColor: 'border-destructive',
      category: 'functional',
    },
  ];

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleNodeClick = (nodeType: string) => {
    if (onNodeTypeSelect && window.innerWidth < 768) {
      onNodeTypeSelect(nodeType);
    }
  };

  const renderNodeIcon = (nodeType: string) => {
    if (nodeType === 'loopNode') {
      return <RotateCcw className="w-20 h-20 text-blue-500" />;
    }
    if (nodeType === 'endNode') {
      return <CircleOff className="w-20 h-20 text-destructive" />;
    }
    return null;
  };

  const filteredNodes = nodeTypes.filter(node => {
    if (selectedCategory === 'all') return true;
    return node.category === selectedCategory;
  });

  return (
    <aside className="h-full flex flex-col overflow-hidden p-4 bg-background">
      {/* Header - stays fixed */}
      <div className="sticky top-0 z-10 bg-background pb-4">
        <h3 className="text-xl font-bold hidden md:block mb-2">{t("title")}</h3>
        <p className="text-sm text-muted-foreground mb-4 hidden lg:block">
          {t("placementMode")}
        </p>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="flex-1 min-w-[80px]"
          >
            All
            <span className="ml-1.5 text-xs opacity-70">({nodeTypes.length})</span>
          </Button>
          <Button
            variant={selectedCategory === 'reply' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('reply')}
            className="flex-1 min-w-[80px]"
          >
            Reply
            <span className="ml-1.5 text-xs opacity-70">
              ({nodeTypes.filter(n => n.category === 'reply').length})
            </span>
          </Button>
          <Button
            variant={selectedCategory === 'functional' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('functional')}
            className="flex-1 min-w-[80px]"
          >
            Control
            <span className="ml-1.5 text-xs opacity-70">
              ({nodeTypes.filter(n => n.category === 'functional').length})
            </span>
          </Button>
        </div>
      </div>

      {/* Scrollable nodes list */}
      <div className="flex-1 overflow-y-auto pr-2">
        {filteredNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No nodes in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {filteredNodes.map((node) => (
              <div
                key={node.type}
                className={`bg-background border-2 ${node.borderColor || 'border-border'} rounded-xl cursor-pointer md:cursor-grab hover:shadow-lg hover:border-primary/50 transition-all active:scale-95 overflow-hidden group`}
                onDragStart={(event) => onDragStart(event, node.type)}
                onClick={() => handleNodeClick(node.type)}
                draggable
              >
                <div className="relative w-full bg-muted/20 flex items-center justify-center overflow-hidden" style={{ paddingBottom: '60%' }}>
                  {node.imagePath ? (
                    <img
                      src={node.imagePath}
                      alt={t(`nodes.${node.type.replace('Node', '')}.name`)}
                      className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Cpath d="M9 9h6v6H9z"/%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {renderNodeIcon(node.type)}
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h4 className="font-semibold text-base mb-1">
                    {t(`nodes.${node.type.replace('Node', '')}.name`)}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {t(`nodes.${node.type.replace('Node', '')}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}