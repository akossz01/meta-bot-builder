import { Handle, Position, NodeProps } from 'reactflow';
import { RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Color palette for nodes - only border colors
const NODE_COLORS = [
  { name: 'Default', value: 'rgb(59, 130, 246)' },
  { name: 'Blue', value: 'rgb(59, 130, 246)' },
  { name: 'Green', value: 'rgb(34, 197, 94)' },
  { name: 'Purple', value: 'rgb(168, 85, 247)' },
  { name: 'Orange', value: 'rgb(249, 115, 22)' },
  { name: 'Pink', value: 'rgb(236, 72, 153)' },
  { name: 'Yellow', value: 'rgb(234, 179, 8)' },
  { name: 'Red', value: 'rgb(239, 68, 68)' },
];

type LoopNodeData = {
  targetNodeId?: string;
  color?: string;
  onChange?: (data: Partial<LoopNodeData>) => void;
  availableNodes?: Array<{ id: string; label: string }>;
};

export function LoopNode({ data }: NodeProps<LoopNodeData>) {
  const { targetNodeId, color, onChange, availableNodes = [] } = data;
  const borderColor = color || 'rgb(59, 130, 246)';

  const handleTargetChange = (value: string) => {
    if (onChange) {
      onChange({ targetNodeId: value });
    }
  };

  return (
    <div 
      className="p-4 border-2 rounded-lg shadow-md w-56 relative bg-background"
      style={{ 
        borderColor: borderColor,
      }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" style={{ backgroundColor: borderColor }} />
      
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
                onClick={() => {
                  if (onChange) {
                    onChange({ color: colorOption.value });
                  }
                }}
                title={colorOption.name}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex flex-col items-center gap-3">
        <RotateCcw className="h-8 w-8" style={{ color: borderColor }} />
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
