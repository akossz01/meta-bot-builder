import { Handle, Position, NodeProps } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTranslations } from 'next-intl';

// Color palette for nodes - only border colors
const NODE_COLORS = [
  { name: 'Default', value: 'hsl(var(--border))' },
  { name: 'Blue', value: 'rgb(59, 130, 246)' },
  { name: 'Green', value: 'rgb(34, 197, 94)' },
  { name: 'Purple', value: 'rgb(168, 85, 247)' },
  { name: 'Orange', value: 'rgb(249, 115, 22)' },
  { name: 'Pink', value: 'rgb(236, 72, 153)' },
  { name: 'Yellow', value: 'rgb(234, 179, 8)' },
  { name: 'Red', value: 'rgb(239, 68, 68)' },
];

// Define the shape of our data for this node
type QuickReplyData = {
  message: string;
  replies: Array<{ title: string }>;
  waitForReply?: boolean;
  color?: string;
  onChange: (data: Partial<QuickReplyData>) => void;
};

export function QuickReplyNode({ data, id }: NodeProps<QuickReplyData>) {
  const { message, replies, waitForReply, color, onChange } = data;
  const borderColor = color || 'hsl(var(--border))';
  const t = useTranslations("FlowNodes.quickReply");

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ message: e.target.value });
  };

  const handleReplyChange = (index: number, value: string) => {
    const newReplies = [...replies];
    newReplies[index] = { title: value };
    onChange({ replies: newReplies });
  };

  const addReply = () => {
    if (replies.length < 6) {
        const newReplies = [...replies, { title: '' }];
        onChange({ replies: newReplies });
    }
  };

  const removeReply = (index: number) => {
    const newReplies = replies.filter((_, i) => i !== index);
    onChange({ replies: newReplies });
  };
  
  // Calculate handle position based on the actual position of each reply input
  // Base position starts after: label (12px) + textarea (variable) + replies label (20px) + mt-1 (4px)
  const handleBaseTop = 165; // Adjusted to align with first input field center
  const handleSpacing = 40; // Height of input (32px) + gap (8px)

  return (
    <div 
      className="p-4 border-2 rounded-lg shadow-md w-72 relative bg-background"
      style={{ 
        borderColor: borderColor,
      }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-primary" />
      
      {/* Color Picker Dot */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="absolute top-2 right-2 w-4 h-4 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform nodrag z-10"
            style={{ 
              backgroundColor: borderColor,
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
                  backgroundColor: colorOption.value,
                  borderColor: colorOption.value
                }}
                onClick={() => onChange({ color: colorOption.value })}
                title={colorOption.name}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold text-muted-foreground">{t("label")}</label>
        <Textarea
          value={message}
          onChange={handleMessageChange}
          className="nodrag"
          placeholder={t("placeholder")}
        />
        <div>
          <label className="text-xs font-semibold text-muted-foreground">
            {t("repliesLabel")} ({replies.length} / 6)
          </label>
          <div className="flex flex-col gap-2 mt-1">
            {replies.map((reply, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="text"
                  value={reply.title}
                  onChange={(e) => handleReplyChange(index, e.target.value)}
                  className="nodrag"
                  placeholder={`${t("replyPlaceholder")}${index + 1}`}
                  maxLength={20} // Facebook quick replies have a 20-char limit
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeReply(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={addReply} disabled={replies.length >= 6}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {t("addReply")}
          </Button>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <Label htmlFor={`wait-${id}`} className="text-xs cursor-pointer">
            {t("waitForReply")}
          </Label>
          <Switch
            id={`wait-${id}`}
            checked={waitForReply !== false}
            onCheckedChange={(checked) => onChange({ waitForReply: checked })}
            className="nodrag"
          />
        </div>
      </div>

      {/* Render a source handle for each reply option */}
      {replies.map((reply, index) => (
        <Handle 
          key={`handle-${index}`}
          type="source" 
          position={Position.Right} 
          id={`handle-${index}`}
          style={{ top: `${handleBaseTop + index * handleSpacing}px` }} 
          className="w-3 h-3 !bg-primary"
        />
      ))}
    </div>
  );
}