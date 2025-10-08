import { Handle, Position, NodeProps } from 'reactflow';
import { RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type LoopNodeData = {
  targetNodeId?: string;
  onChange?: (data: Partial<LoopNodeData>) => void;
  availableNodes?: Array<{ id: string; label: string }>;
};

export function LoopNode({ data }: NodeProps<LoopNodeData>) {
  const { targetNodeId, onChange, availableNodes = [] } = data;

  const handleTargetChange = (value: string) => {
    if (onChange) {
      onChange({ targetNodeId: value });
    }
  };

  return (
    <div className="p-4 border-2 border-blue-500 bg-background rounded-lg shadow-md w-56">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-blue-500" />
      <div className="flex flex-col items-center gap-3">
        <RotateCcw className="h-8 w-8 text-blue-500" />
        <span className="text-sm font-semibold text-center">Loop Back</span>
        <div className="w-full">
          <label className="text-xs text-muted-foreground block mb-1">Jump to:</label>
          <Select value={targetNodeId || ''} onValueChange={handleTargetChange}>
            <SelectTrigger className="nodrag w-full">
              <SelectValue placeholder="Select node..." />
            </SelectTrigger>
            <SelectContent>
              {availableNodes.length === 0 ? (
                <SelectItem value="none" disabled>No nodes available</SelectItem>
              ) : (
                availableNodes.map((node) => (
                  <SelectItem key={node.id} value={node.id}>
                    {node.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs text-muted-foreground text-center">
          Restarts from selected node
        </span>
      </div>
    </div>
  );
}
