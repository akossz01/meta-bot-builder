import { Handle, Position, NodeProps } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, X, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

// Color palette for nodes
const NODE_COLORS = [
  { name: 'Default', value: '', border: '' },
  { name: 'Blue', value: 'rgba(59, 130, 246, 0.1)', border: 'rgb(59, 130, 246)' },
  { name: 'Green', value: 'rgba(34, 197, 94, 0.1)', border: 'rgb(34, 197, 94)' },
  { name: 'Purple', value: 'rgba(168, 85, 247, 0.1)', border: 'rgb(168, 85, 247)' },
  { name: 'Orange', value: 'rgba(249, 115, 22, 0.1)', border: 'rgb(249, 115, 22)' },
  { name: 'Pink', value: 'rgba(236, 72, 153, 0.1)', border: 'rgb(236, 72, 153)' },
  { name: 'Yellow', value: 'rgba(234, 179, 8, 0.1)', border: 'rgb(234, 179, 8)' },
  { name: 'Red', value: 'rgba(239, 68, 68, 0.1)', border: 'rgb(239, 68, 68)' },
];

type CardButton = {
  title: string;
  type: 'web_url' | 'postback';
  url?: string;
};

type CarouselCard = {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  buttons: CardButton[];
};

type CarouselNodeData = {
  cards: CarouselCard[];
  color?: string;
  borderColor?: string;
  onChange: (data: Partial<CarouselNodeData>) => void;
};

export function CarouselNode({ data, id }: NodeProps<CarouselNodeData>) {
  const { cards, color, borderColor, onChange } = data;
  const displayBorderColor = borderColor || 'hsl(var(--border))';
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const currentCard = cards[currentCardIndex] || cards[0];

  const updateCard = (index: number, updatedCard: Partial<CarouselCard>) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], ...updatedCard };
    onChange({ cards: newCards });
  };

  const updateButton = (cardIndex: number, buttonIndex: number, field: keyof CardButton, value: string) => {
    const newCards = [...cards];
    newCards[cardIndex].buttons[buttonIndex] = { 
      ...newCards[cardIndex].buttons[buttonIndex], 
      [field]: value 
    };
    onChange({ cards: newCards });
  };

  const updateButtonType = (cardIndex: number, buttonIndex: number, newType: 'web_url' | 'postback') => {
    const newCards = [...cards];
    if (newType === 'postback') {
      newCards[cardIndex].buttons[buttonIndex] = {
        title: newCards[cardIndex].buttons[buttonIndex].title,
        type: 'postback',
      };
    } else {
      newCards[cardIndex].buttons[buttonIndex] = {
        title: newCards[cardIndex].buttons[buttonIndex].title,
        type: 'web_url',
        url: ''
      };
    }
    onChange({ cards: newCards });
  };

  const addButton = (cardIndex: number) => {
    const newCards = [...cards];
    if (newCards[cardIndex].buttons.length < 3) {
      newCards[cardIndex].buttons.push({ title: '', type: 'web_url', url: '' });
      onChange({ cards: newCards });
    }
  };

  const removeButton = (cardIndex: number, buttonIndex: number) => {
    const newCards = [...cards];
    newCards[cardIndex].buttons = newCards[cardIndex].buttons.filter((_, i) => i !== buttonIndex);
    onChange({ cards: newCards });
  };

  const addCard = () => {
    if (cards.length < 10) {
      const newCards = [...cards, {
        title: 'Card Title',
        subtitle: '',
        imageUrl: '',
        buttons: [{ title: 'Button', type: 'web_url' as const, url: '' }]
      }];
      onChange({ cards: newCards });
      setCurrentCardIndex(newCards.length - 1);
    }
  };

  const removeCard = (index: number) => {
    if (cards.length > 1) {
      const newCards = cards.filter((_, i) => i !== index);
      onChange({ cards: newCards });
      if (currentCardIndex >= newCards.length) {
        setCurrentCardIndex(newCards.length - 1);
      }
    }
  };

  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  // Calculate handle positions for all postback buttons across all cards
  const handleBaseTop = 450; // Adjusted base position
  const handleSpacing = 100;
  let handleOffset = 0;

  return (
    <div 
      className="p-4 border-2 rounded-lg shadow-md w-80 relative bg-background"
      style={{ 
        ...(color && { backgroundColor: color }),
        borderColor: displayBorderColor,
      }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-primary" />
      
      {/* Color Picker Dot */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="absolute top-2 right-2 w-4 h-4 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform nodrag z-10"
            style={{ 
              backgroundColor: displayBorderColor,
              borderColor: 'hsl(var(--background))'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="end">
          <div className="grid grid-cols-4 gap-2">
            {NODE_COLORS.map((colorOption) => (
              <button
                key={colorOption.name}
                className="w-8 h-8 rounded-md border-2 hover:scale-110 transition-transform"
                style={{
                  backgroundColor: colorOption.value || 'hsl(var(--background))',
                  borderColor: colorOption.border || 'hsl(var(--border))'
                }}
                onClick={() => onChange({ 
                  color: colorOption.value || undefined,
                  borderColor: colorOption.border || undefined
                })}
                title={colorOption.name}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">Carousel</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={prevCard}
              disabled={currentCardIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs px-2">
              {currentCardIndex + 1} / {cards.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={nextCard}
              disabled={currentCardIndex === cards.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {currentCard && (
          <>
            <div className="flex flex-col gap-2">
              <Label className="text-xs">Title *</Label>
              <Input
                value={currentCard.title}
                onChange={(e) => updateCard(currentCardIndex, { title: e.target.value })}
                className="nodrag"
                placeholder="Card title"
                maxLength={80}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs">Subtitle (optional)</Label>
              <Textarea
                value={currentCard.subtitle || ''}
                onChange={(e) => updateCard(currentCardIndex, { subtitle: e.target.value })}
                className="nodrag"
                placeholder="Card description"
                rows={2}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs">Image URL (optional)</Label>
              <Input
                value={currentCard.imageUrl || ''}
                onChange={(e) => updateCard(currentCardIndex, { imageUrl: e.target.value })}
                className="nodrag"
                placeholder="https://example.com/image.jpg"
                type="url"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">
                Buttons ({currentCard.buttons.length} / 3)
              </Label>
              <div className="flex flex-col gap-3 mt-2">
                {currentCard.buttons.map((button, btnIndex) => (
                  <div key={btnIndex} className="border rounded p-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={button.title}
                        onChange={(e) => updateButton(currentCardIndex, btnIndex, 'title', e.target.value)}
                        className="nodrag flex-1"
                        placeholder="Button text"
                        maxLength={20}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 shrink-0" 
                        onClick={() => removeButton(currentCardIndex, btnIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Select 
                      value={button.type} 
                      onValueChange={(value: 'web_url' | 'postback') => 
                        updateButtonType(currentCardIndex, btnIndex, value)
                      }
                    >
                      <SelectTrigger className="nodrag w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web_url">Open URL</SelectItem>
                        <SelectItem value="postback">Next Step</SelectItem>
                      </SelectContent>
                    </Select>

                    {button.type === 'web_url' && (
                      <Input
                        value={button.url || ''}
                        onChange={(e) => updateButton(currentCardIndex, btnIndex, 'url', e.target.value)}
                        className="nodrag"
                        placeholder="https://example.com"
                        type="url"
                      />
                    )}
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full" 
                onClick={() => addButton(currentCardIndex)} 
                disabled={currentCard.buttons.length >= 3}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Button
              </Button>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={addCard}
                disabled={cards.length >= 10}
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Card
              </Button>
              {cards.length > 1 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeCard(currentCardIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Source handles for postback buttons across all cards */}
      {cards.map((card, cardIndex) => {
        return card.buttons.map((button, buttonIndex) => {
          if (button.type === 'postback') {
            const handle = (
              <Handle 
                key={`card-${cardIndex}-button-${buttonIndex}`}
                type="source" 
                position={Position.Right} 
                id={`card-${cardIndex}-button-${buttonIndex}`}
                style={{ top: `${handleBaseTop + handleOffset * handleSpacing}px` }} 
                className="w-3 h-3 !bg-primary"
              />
            );
            handleOffset++;
            return handle;
          }
          return null;
        });
      })}
      
      {/* Default output handle at bottom */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="default-output"
        className="w-3 h-3 !bg-primary" 
      />
    </div>
  );
}
