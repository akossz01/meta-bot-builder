import { Handle, Position, NodeProps } from 'reactflow';
import { CircleOff } from 'lucide-react';

type EndNodeData = {
  label?: string;
};

export function EndNode({ data }: NodeProps<EndNodeData>) {
  return (
    <div className="p-4 border-2 border-destructive bg-background rounded-lg shadow-md w-48">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-destructive" />
      <div className="flex flex-col items-center gap-2">
        <CircleOff className="h-8 w-8 text-destructive" />
        <span className="text-sm font-semibold text-center">End Conversation</span>
        <span className="text-xs text-muted-foreground text-center">
          Flow stops here
        </span>
      </div>
    </div>
  );
}
