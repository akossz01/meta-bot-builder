import { Handle, Position, NodeProps } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, X } from 'lucide-react';

// Define the shape of our data for this node
type QuickReplyData = {
  message: string;
  replies: Array<{ title: string }>;
  onChange: (data: Partial<QuickReplyData>) => void;
};

export function QuickReplyNode({ data }: NodeProps<QuickReplyData>) {
  const { message, replies, onChange } = data;

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ message: e.target.value });
  };

  const handleReplyChange = (index: number, value: string) => {
    const newReplies = [...replies];
    newReplies[index] = { title: value };
    onChange({ replies: newReplies });
  };

  const addReply = () => {
    const newReplies = [...replies, { title: '' }];
    onChange({ replies: newReplies });
  };

  const removeReply = (index: number) => {
    const newReplies = replies.filter((_, i) => i !== index);
    onChange({ replies: newReplies });
  };

  return (
    <div className="p-4 border-2 bg-background rounded-lg shadow-md w-72">
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
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
      </div>
      {/* Render a source handle for each reply option */}
      {replies.map((reply, index) => (
        <div key={index} className="relative">
          <Handle 
            type="source" 
            position={Position.Right} 
            id={`handle-${index}`}
            style={{ top: `${150 + index * 48}px` }} 
            className="w-3 h-3"
          />
          <div className="text-xs text-muted-foreground absolute" style={{ top: `${142 + index * 48}px`, right: '-65px' }}>
            {reply.title || `Option ${index + 1}`}
          </div>
        </div>
      ))}
    </div>
  );
}