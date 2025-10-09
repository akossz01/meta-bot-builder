import { Handle, Position, NodeProps } from 'reactflow';
import { CircleOff } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';

type EndNodeData = {
  label?: string;
  message?: string;
  sendMessage?: boolean;
  onChange?: (data: Partial<EndNodeData>) => void;
};

export function EndNode({ data }: NodeProps<EndNodeData>) {
  const { message, sendMessage, onChange } = data;
  const t = useTranslations("FlowNodes.end");

  return (
    <div className="p-4 border-2 border-destructive bg-background rounded-lg shadow-md w-64">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-destructive" />
      <div className="flex flex-col gap-3">
        <div className="flex flex-col items-center gap-2">
          <CircleOff className="h-8 w-8 text-destructive" />
          <span className="text-sm font-semibold text-center">{t("title")}</span>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <Label htmlFor="send-end-message" className="text-xs cursor-pointer">
            {t("sendMessage")}
          </Label>
          <Switch
            id="send-end-message"
            checked={sendMessage !== false}
            onCheckedChange={(checked) => onChange?.({ sendMessage: checked })}
            className="nodrag"
          />
        </div>

        {sendMessage !== false && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground">{t("messageLabel")}</label>
            <Textarea
              value={message || ''}
              onChange={(e) => onChange?.({ message: e.target.value })}
              className="nodrag"
              placeholder={t("messagePlaceholder")}
            />
          </div>
        )}

        {sendMessage === false && (
          <span className="text-xs text-muted-foreground text-center">
            {t("silentEnd")}
          </span>
        )}
      </div>
    </div>
  );
}
