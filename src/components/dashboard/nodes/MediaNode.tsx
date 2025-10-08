import { Handle, Position, NodeProps } from 'reactflow';
import { Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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

type MediaNodeData = {
  imageUrl: string;
  color?: string;
  borderColor?: string;
  onChange: (data: Partial<MediaNodeData>) => void;
};

export function MediaNode({ data }: NodeProps<MediaNodeData>) {
  const { imageUrl, color, borderColor, onChange } = data;
  const displayBorderColor = borderColor || 'hsl(var(--border))';

  return (
    <div 
      className="p-4 border-2 rounded-lg shadow-md w-64 relative bg-background"
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
          <ImageIcon className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">Image Message</span>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs">Image URL *</Label>
          <Input
            value={imageUrl || ''}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
            className="nodrag"
            placeholder="https://example.com/image.jpg"
            type="url"
          />
        </div>

        {imageUrl && (
          <div className="border rounded overflow-hidden">
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="w-full h-32 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Supported formats: JPG, PNG, GIF
        </p>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-primary" />
    </div>
  );
}
