"use client";

import React, { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
  Handle,
  Position,
  NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, ArrowLeft, Menu, X } from "lucide-react";
import { FlowBuilderSidebar } from "@/components/dashboard/FlowBuilderSidebar";
import { QuickReplyNode } from '@/components/dashboard/nodes/QuickReplyNode';
import { EndNode } from '@/components/dashboard/nodes/EndNode';
import { LoopNode } from '@/components/dashboard/nodes/LoopNode';
import { CardNode } from '@/components/dashboard/nodes/CardNode';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { MediaNode } from '@/components/dashboard/nodes/MediaNode';
import { CarouselNode } from '@/components/dashboard/nodes/CarouselNode';
import { useTranslations } from "next-intl";

// Color palette for nodes
const NODE_COLORS = [
  { name: 'Default', value: '', border: '' }, // Empty strings mean use defaults
  { name: 'Blue', value: 'rgba(59, 130, 246, 0.1)', border: 'rgb(59, 130, 246)' },
  { name: 'Green', value: 'rgba(34, 197, 94, 0.1)', border: 'rgb(34, 197, 94)' },
  { name: 'Purple', value: 'rgba(168, 85, 247, 0.1)', border: 'rgb(168, 85, 247)' },
  { name: 'Orange', value: 'rgba(249, 115, 22, 0.1)', border: 'rgb(249, 115, 22)' },
  { name: 'Pink', value: 'rgba(236, 72, 153, 0.1)', border: 'rgb(236, 72, 153)' },
  { name: 'Yellow', value: 'rgba(234, 179, 8, 0.1)', border: 'rgb(234, 179, 8)' },
  { name: 'Red', value: 'rgba(239, 68, 68, 0.1)', border: 'rgb(239, 68, 68)' },
];

// Custom Node for displaying and editing a message
function MessageNode({ data }: NodeProps<{ message: string; waitForReply?: boolean; color?: string; borderColor?: string; onChange: (data: { message?: string; waitForReply?: boolean; color?: string; borderColor?: string }) => void }>) {
  const backgroundColor = data.color || 'hsl(var(--background))';
  const borderColor = data.borderColor || 'hsl(var(--border))';
  const displayBorderColor = data.borderColor || 'hsl(var(--border))';

  return (
    <div 
      className="p-4 border-2 rounded-lg shadow-md w-64 relative bg-background"
      style={{ 
        ...(data.color && { backgroundColor }),
        borderColor: displayBorderColor,
      }}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      
      {/* Color Picker Dot */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="absolute top-2 right-2 w-4 h-4 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform nodrag"
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
                onClick={() => data.onChange({ 
                  color: colorOption.value || undefined,
                  borderColor: colorOption.border || undefined
                })}
                title={colorOption.name}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-muted-foreground">Reply Message</label>
        <Textarea
          value={data.message || ''}
          onChange={(e) => data.onChange({ message: e.target.value })}
          className="nodrag" // Prevents dragging the node when interacting with the textarea
        />
        <div className="flex items-center justify-between pt-2 border-t">
          <Label htmlFor={`wait-${data.message}`} className="text-xs cursor-pointer">
            Wait for reply
          </Label>
          <Switch
            id={`wait-${data.message}`}
            checked={data.waitForReply !== false}
            onCheckedChange={(checked) => data.onChange({ waitForReply: checked })}
            className="nodrag"
          />
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  );
}

export default function ChatbotBuilderPage() {
  const params = useParams();
  const chatbotId = params.chatbotId as string;
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("ChatbotBuilder");

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [chatbotName, setChatbotName] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Define custom node types
  const nodeTypes = useMemo(() => ({ 
    messageNode: MessageNode,
    quickReplyNode: QuickReplyNode,
    cardNode: CardNode,
    mediaNode: MediaNode,
    carouselNode: CarouselNode,
    endNode: EndNode,
    loopNode: LoopNode,
  }), []);

  // Specific handler for updating node data
  const updateNodeData = useCallback((nodeId: string, newData: Partial<{ message: string; replies: any[]; targetNodeId: string; waitForReply: boolean; color: string; borderColor: string; sendMessage: boolean; label: string; title: string; subtitle: string; imageUrl: string; buttons: any[]; cards: any[] }>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  useEffect(() => {
    if (!chatbotId) return;

    async function fetchChatbot() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/chatbots/${chatbotId}`);
        if (!response.ok) throw new Error("Failed to fetch chatbot data");
        
        const data = await response.json();
        setChatbotName(data.name);

        // Get available nodes for loop node dropdown
        const availableNodes = data.flow_json.nodes
          .filter((n: Node) => n.type !== 'loopNode' && n.type !== 'endNode')
          .map((n: Node) => ({
            id: n.id,
            label: n.data.label || n.data.message?.substring(0, 20) || `Node ${n.id}`
          }));

        // Prepare nodes with the onChange handler
        const initialNodes = data.flow_json.nodes.map((node: Node) => {
            // Ensure waitForReply defaults to true for backwards compatibility
            if (node.type === 'messageNode') {
                if (node.data.waitForReply === undefined) {
                    node.data.waitForReply = true;
                }
                node.data.onChange = (newData: object) => updateNodeData(node.id, newData);
            }
            if (node.type === 'quickReplyNode') {
                if (node.data.waitForReply === undefined) {
                    node.data.waitForReply = true;
                }
                node.data.onChange = (newData: object) => updateNodeData(node.id, newData);
            }
            if (node.type === 'loopNode') {
                node.data.onChange = (newData: object) => updateNodeData(node.id, newData);
                node.data.availableNodes = availableNodes;
            }
            if (node.type === 'endNode') {
                // Set defaults for end node
                if (node.data.sendMessage === undefined) {
                    node.data.sendMessage = true;
                }
                if (!node.data.message) {
                    node.data.message = 'Thank you for chatting with us! Feel free to send another message if you need more help.';
                }
                node.data.onChange = (newData: object) => updateNodeData(node.id, newData);
            }
            if (node.type === 'cardNode') {
                node.data.onChange = (newData: object) => updateNodeData(node.id, newData);
            }
            if (node.type === 'mediaNode') {
                node.data.onChange = (newData: object) => updateNodeData(node.id, newData);
            }
            if (node.type === 'carouselNode') {
                node.data.onChange = (newData: object) => updateNodeData(node.id, newData);
            }
            return node;
        });

        setNodes(initialNodes);
        setEdges(data.flow_json.edges);
      } catch (error) {
        console.error(error);
        // Redirect if chatbot not found or access denied
        router.push("/dashboard/chatbots");
      } finally {
        setIsLoading(false);
      }
    }

    fetchChatbot();
  }, [chatbotId, router, updateNodeData]);

  // Update available nodes whenever nodes change (for loop node dropdown)
  useEffect(() => {
    const availableNodes = nodes
      .filter((n) => n.type !== 'loopNode' && n.type !== 'endNode')
      .map((n) => ({
        id: n.id,
        label: n.data.label || n.data.message?.substring(0, 20) || `Node ${n.id}`
      }));

    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === 'loopNode') {
          return { ...node, data: { ...node.data, availableNodes } };
        }
        return node;
      })
    );
  }, [nodes.length]); // Only run when node count changes
  
  const handleSaveFlow = async () => {
    setIsSaving(true);
    try {
        // Validate for duplicate node IDs before saving
        const nodeIds = nodes.map(n => n.id);
        const uniqueIds = new Set(nodeIds);
        if (nodeIds.length !== uniqueIds.size) {
            const duplicates = nodeIds.filter((id, index) => nodeIds.indexOf(id) !== index);
            console.error('Duplicate node IDs found:', duplicates);
            toast({
              title: "Error",
              description: `Duplicate node IDs detected (${duplicates.join(', ')}). Please refresh the page and try again.`,
              variant: "destructive"
            });
            return;
        }

        // Strip functions AND any non-standard properties from node data before saving
        const cleanedNodes = nodes.map(node => {
            let cleanedData: any;
            
            if (node.type === 'messageNode') {
                cleanedData = { 
                    message: node.data.message,
                    waitForReply: node.data.waitForReply !== false, // Explicitly save the value
                    color: node.data.color,
                    borderColor: node.data.borderColor
                };
            } else if (node.type === 'quickReplyNode') {
                cleanedData = { 
                    message: node.data.message, 
                    replies: node.data.replies,
                    waitForReply: node.data.waitForReply !== false, // Explicitly save the value
                    color: node.data.color,
                    borderColor: node.data.borderColor
                };
            } else if (node.type === 'endNode') {
                cleanedData = { 
                    label: node.data.label || 'End',
                    message: node.data.message,
                    sendMessage: node.data.sendMessage !== false
                };
            } else if (node.type === 'loopNode') {
                cleanedData = { 
                    targetNodeId: node.data.targetNodeId,
                    color: node.data.color,
                    borderColor: node.data.borderColor
                };
            } else if (node.type === 'cardNode') {
                cleanedData = { 
                    title: node.data.title,
                    subtitle: node.data.subtitle,
                    imageUrl: node.data.imageUrl,
                    buttons: node.data.buttons,
                    color: node.data.color,
                    borderColor: node.data.borderColor
                };
            } else if (node.type === 'mediaNode') {
                cleanedData = { 
                    imageUrl: node.data.imageUrl,
                    color: node.data.color,
                    borderColor: node.data.borderColor
                };
            } else if (node.type === 'carouselNode') {
                cleanedData = { 
                    cards: node.data.cards,
                    color: node.data.color,
                    borderColor: node.data.borderColor
                };
            } else {
                // For other nodes like 'input'
                cleanedData = { label: node.data.label };
            }

            // Create a new node object, keeping only essential properties
            const { id, type, position, width, height } = node;
            return { id, type, position, width, height, data: cleanedData };
        });

        const flowToSave = {
            nodes: cleanedNodes,
            edges,
        };

        await fetch(`/api/chatbots/${chatbotId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ flow_json: flowToSave })
        });
        
        toast({
          title: "Success",
          description: "Flow saved successfully",
        });
    } catch (error) {
        console.error("Failed to save flow", error);
        toast({
          title: "Error",
          description: "Failed to save flow. Please try again.",
          variant: "destructive"
        });
    } finally {
        setIsSaving(false);
    }
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance || !reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      // Generate a unique ID by finding the highest existing ID and adding 1
      const existingIds = nodes.map(n => parseInt(n.id)).filter(id => !isNaN(id));
      const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
      const newNodeId = (maxId + 1).toString();
      
      let newNode: Node;

      if (type === 'mediaNode') {
        newNode = {
            id: newNodeId,
            type,
            position,
            data: { 
                imageUrl: '',
                onChange: (data: object) => updateNodeData(newNodeId, data) 
            },
        };
      } else if (type === 'carouselNode') {
        newNode = {
            id: newNodeId,
            type,
            position,
            data: { 
                cards: [{
                    title: 'Card 1',
                    subtitle: '',
                    imageUrl: '',
                    buttons: [{ title: 'Learn More', type: 'web_url', url: '' }]
                }],
                onChange: (data: object) => updateNodeData(newNodeId, data) 
            },
        };
      } else if (type === 'cardNode') {
        newNode = {
            id: newNodeId,
            type,
            position,
            data: { 
                title: 'Card Title',
                subtitle: '',
                imageUrl: '',
                buttons: [{ title: 'Learn More', type: 'web_url', url: '' }],
                onChange: (data: object) => updateNodeData(newNodeId, data) 
            },
        };
      } else if (type === 'quickReplyNode') {
        newNode = {
            id: newNodeId,
            type,
            position,
            data: { 
                message: 'Ask a question', 
                replies: [{title: 'Option 1'}], 
                waitForReply: true,
                onChange: (data: object) => updateNodeData(newNodeId, data) 
            },
        };
      } else if (type === 'endNode') {
        newNode = {
          id: newNodeId,
          type,
          position,
          data: { 
            label: 'End',
            message: 'Thank you for chatting with us! Feel free to send another message if you need more help.',
            sendMessage: true,
            onChange: (data: object) => updateNodeData(newNodeId, data)
          },
        };
      } else if (type === 'loopNode') {
        const availableNodes = nodes
          .filter((n) => n.type !== 'loopNode' && n.type !== 'endNode')
          .map((n) => ({
            id: n.id,
            label: n.data.label || n.data.message?.substring(0, 20) || `Node ${n.id}`
          }));
        newNode = {
          id: newNodeId,
          type,
          position,
          data: { 
            targetNodeId: '', 
            availableNodes,
            onChange: (data: object) => updateNodeData(newNodeId, data) 
          },
        };
      } else { // Default to messageNode
        newNode = {
          id: newNodeId,
          type,
          position,
          data: { 
              message: `New message ${newNodeId}`, 
              waitForReply: true,
              onChange: (data: object) => updateNodeData(newNodeId, data) 
          },
        };
      }

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, nodes, updateNodeData]
  );
  
  return (
    <div className="h-screen w-full flex flex-col md:grid md:grid-cols-[200px_1fr]">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile: fixed overlay, Desktop: static */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-[280px] md:w-auto
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        bg-background border-r
      `}>
        {/* Mobile Close Button */}
        <div className="flex justify-between items-center p-4 border-b md:hidden">
          <h3 className="text-lg font-bold">Nodes</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <FlowBuilderSidebar />
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex justify-between items-center p-3 md:p-4 border-b gap-2 flex-wrap">
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/chatbots")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg md:text-2xl font-bold truncate">{chatbotName}</h1>
          </div>
          <Button onClick={handleSaveFlow} disabled={isSaving} className="shrink-0" size="sm">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">{t("saving")}</span>
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{t("saveButton")}</span>
              </>
            )}
          </Button>
        </div>
        <div className="flex-1 min-h-0" ref={reactFlowWrapper}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              fitView
              deleteKeyCode={['Backspace', 'Delete']}
              minZoom={0.1}
              maxZoom={4}
              defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            >
              <Controls className="!bottom-4 !left-4" />
              <Background />
            </ReactFlow>
          )}
        </div>
      </div>
    </div>
  );
}