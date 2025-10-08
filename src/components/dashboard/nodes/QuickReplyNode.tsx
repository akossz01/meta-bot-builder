import { Handle, Position, NodeProps } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Define the shape of our data for this node
type QuickReplyData = {
  message: string;
  replies: Array<{ title: string }>;
  waitForReply?: boolean;
  onChange: (data: Partial<QuickReplyData>) => void;
};

export function QuickReplyNode({ data, id }: NodeProps<QuickReplyData>) {
  const { message, replies, waitForReply, onChange } = data;

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
  
  // Base offset to position the first handle below the main content
  const handleBaseTop = 130; 
  // Vertical space between each handle
  const handleSpacing = 48;

  return (
    <div className="p-4 border-2 bg-background rounded-lg shadow-md w-72 relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-primary" />
      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold text-muted-foreground">Question / Message</label>
        <Textarea
          value={message}
          onChange={handleMessageChange}
          className="nodrag"
          placeholder="Ask a question..."
        />
        <div>
          <label className="text-xs font-semibold text-muted-foreground">
            Replies ({replies.length} / 6)
          </label>
          <div className="flex flex-col gap-2 mt-1">
            {replies.map((reply, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="text"
                  value={reply.title}
                  onChange={(e) => handleReplyChange(index, e.target.value)}
                  className="nodrag"
                  placeholder={`Reply #${index + 1}`}
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
            Add Reply
          </Button>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <Label htmlFor={`wait-${id}`} className="text-xs cursor-pointer">
            Wait for reply
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
        <div key={`handle-container-${index}`}>
            <div 
                className="absolute text-xs text-muted-foreground" 
                style={{ top: `${handleBaseTop + index * handleSpacing - 8}px`, right: '1.75rem' }}
            >
                {reply.title.substring(0, 15) || `Option ${index + 1}`}
            </div>
            <Handle 
                type="source" 
                position={Position.Right} 
                id={`handle-${index}`}
                style={{ top: `${handleBaseTop + index * handleSpacing}px` }} 
                className="w-3 h-3 !bg-primary"
            />
        </div>
      ))}
    </div>
  );
}