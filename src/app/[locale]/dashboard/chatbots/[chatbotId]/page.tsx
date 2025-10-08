"use client";

import React, { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Save, Loader2 } from "lucide-react";
import { FlowBuilderSidebar } from "@/components/dashboard/FlowBuilderSidebar";
import { QuickReplyNode } from '@/components/dashboard/nodes/QuickReplyNode';
import { EndNode } from '@/components/dashboard/nodes/EndNode';
import { LoopNode } from '@/components/dashboard/nodes/LoopNode';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Custom Node for displaying and editing a message
function MessageNode({ data }: NodeProps<{ message: string; waitForReply?: boolean; onChange: (data: { message?: string; waitForReply?: boolean }) => void }>) {
  return (
    <div className="p-4 border-2 bg-background rounded-lg shadow-md w-64">
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
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

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [chatbotName, setChatbotName] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Define custom node types
  const nodeTypes = useMemo(() => ({ 
    messageNode: MessageNode,
    quickReplyNode: QuickReplyNode,
    endNode: EndNode,
    loopNode: LoopNode,
  }), []);

  // Specific handler for updating node data
  const updateNodeData = useCallback((nodeId: string, newData: Partial<{ message: string; replies: any[]; targetNodeId: string; waitForReply: boolean }>) => {
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
        // Strip functions AND any non-standard properties from node data before saving
        const cleanedNodes = nodes.map(node => {
            let cleanedData: any;
            
            if (node.type === 'messageNode') {
                cleanedData = { 
                    message: node.data.message,
                    waitForReply: node.data.waitForReply !== false // Explicitly save the value
                };
            } else if (node.type === 'quickReplyNode') {
                cleanedData = { 
                    message: node.data.message, 
                    replies: node.data.replies,
                    waitForReply: node.data.waitForReply !== false // Explicitly save the value
                };
            } else if (node.type === 'endNode') {
                cleanedData = { label: node.data.label || 'End' };
            } else if (node.type === 'loopNode') {
                cleanedData = { targetNodeId: node.data.targetNodeId };
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
        // Add a toast notification here in a real app
    } catch (error) {
        console.error("Failed to save flow", error);
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

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      const newNodeId = (nodes.length + 1).toString();
      let newNode: Node;

      if (type === 'quickReplyNode') {
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
          data: { label: 'End' },
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="h-[calc(100vh-5rem)] w-full grid grid-cols-[200px_1fr]">
      <FlowBuilderSidebar />
      <div className="flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h1 className="text-2xl font-bold">{chatbotName}</h1>
          <Button onClick={handleSaveFlow} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Flow
          </Button>
        </div>
        <div className="flex-1" ref={reactFlowWrapper}>
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
          >
            <Controls />
            <Background />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}