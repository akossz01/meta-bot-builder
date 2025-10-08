import { Handle, Position, NodeProps } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, X, CreditCard } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  payload?: string;
};

type CardNodeData = {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  buttons: CardButton[];
  color?: string;
  borderColor?: string;
  onChange: (data: Partial<CardNodeData>) => void;
};

export function CardNode({ data, id }: NodeProps<CardNodeData>) {
  const { title, subtitle, imageUrl, buttons, color, borderColor, onChange } = data;
  const displayBorderColor = borderColor || 'hsl(var(--border))';

  const handleButtonChange = (index: number, field: keyof CardButton, value: string) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    onChange({ buttons: newButtons });
  };

  const handleButtonTypeChange = (index: number, newType: 'web_url' | 'postback') => {
    const newButtons = [...buttons];
    if (newType === 'postback') {
      // Switching to postback - remove url, add payload
      newButtons[index] = {
        title: newButtons[index].title,
        type: 'postback',
        payload: `BUTTON_${index}_CLICKED`
      };
    } else {
      // Switching to web_url - remove payload, add url
      newButtons[index] = {
        title: newButtons[index].title,
        type: 'web_url',
        url: ''
      };
    }
    onChange({ buttons: newButtons });
  };

  const addButton = () => {
    if (buttons.length < 3) { // Messenger allows max 3 buttons per card
      const newButtons = [...buttons, { title: '', type: 'web_url' as const, url: '' }];
      onChange({ buttons: newButtons });
    }
  };

  const removeButton = (index: number) => {
    const newButtons = buttons.filter((_, i) => i !== index);
    onChange({ buttons: newButtons });
  };

  // Calculate base position for first button handle
  // Account for: title input + subtitle textarea + image input + buttons label + first button container padding
  const handleBaseTop = 380; // Adjusted to align with first button center
  const handleSpacing = 100; // Height of each button container (approx 96px) + gap
  
  // Check if there are any postback buttons
  const hasPostbackButtons = buttons.some(btn => btn.type === 'postback');

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
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">Card Message</span>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs">Title *</Label>
          <Input
            value={title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="nodrag"
            placeholder="Card title"
            maxLength={80}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs">Subtitle (optional)</Label>
          <Textarea
            value={subtitle || ''}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            className="nodrag"
            placeholder="Card description"
            rows={2}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs">Image URL (optional)</Label>
          <Input
            value={imageUrl || ''}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
            className="nodrag"
            placeholder="https://example.com/image.jpg"
            type="url"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold">
            Buttons ({buttons.length} / 3)
          </Label>
          <div className="flex flex-col gap-3 mt-2">
            {buttons.map((button, index) => (
              <div key={index} className="border rounded p-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={button.title}
                    onChange={(e) => handleButtonChange(index, 'title', e.target.value)}
                    className="nodrag flex-1"
                    placeholder="Button text"
                    maxLength={20}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 shrink-0" 
                    onClick={() => removeButton(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <Select 
                  value={button.type} 
                  onValueChange={(value: 'web_url' | 'postback') => {
                    handleButtonTypeChange(index, value);
                  }}
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
                    onChange={(e) => handleButtonChange(index, 'url', e.target.value)}
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
            onClick={addButton} 
            disabled={buttons.length >= 3}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Button
          </Button>
        </div>
      </div>

      {/* Source handles for postback buttons - aligned with button centers */}
      {buttons.map((button, index) => {
        if (button.type === 'postback') {
          return (
            <Handle 
              key={`button-${index}`}
              type="source" 
              position={Position.Right} 
              id={`button-${index}`}
              style={{ top: `${handleBaseTop + index * handleSpacing}px` }} 
              className="w-3 h-3 !bg-primary"
            />
          );
        }
        return null;
      })}
      
      {/* Default output handle at bottom - always visible */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="default-output"
        className="w-3 h-3 !bg-primary" 
      />
    </div>
  );
}
