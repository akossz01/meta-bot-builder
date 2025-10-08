"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
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

// Custom Node for displaying and editing a message
function MessageNode({ data }: NodeProps<{ message: string; onChange: (message: string) => void }>) {
  return (
    <div className="p-4 border-2 bg-background rounded-lg shadow-md w-64">
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-muted-foreground">Reply Message</label>
        <Textarea
          value={data.message}
          onChange={(e) => data.onChange(e.target.value)}
          className="nodrag" // Prevents dragging the node when interacting with the textarea
        />
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

  // Define custom node types
  const nodeTypes = useMemo(() => ({ messageNode: MessageNode }), []);

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

  // Handler for updating message data within a node
  const updateNodeMessage = (nodeId: string, message: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, message } };
        }
        return node;
      })
    );
  };

  useEffect(() => {
    if (!chatbotId) return;

    async function fetchChatbot() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/chatbots/${chatbotId}`);
        if (!response.ok) throw new Error("Failed to fetch chatbot data");
        
        const data = await response.json();
        setChatbotName(data.name);

        // Prepare nodes with the onChange handler
        const initialNodes = data.flow_json.nodes.map((node: Node) => {
            if (node.type === 'messageNode') {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        onChange: (message: string) => updateNodeMessage(node.id, message),
                    },
                };
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
  }, [chatbotId, router]);
  
  const handleSaveFlow = async () => {
    setIsSaving(true);
    try {
        // Strip the onChange function from node data before saving
        const flowToSave = {
            nodes: nodes.map(({ data, ...node }) => ({ ...node, data: { message: data.message } })),
            edges
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="h-[calc(100vh-8rem)] w-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{chatbotName}</h1>
        <Button onClick={handleSaveFlow} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Flow
        </Button>
      </div>
      <div className="flex-1 rounded-lg border bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}