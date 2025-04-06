import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeTypes,
  Panel,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';

// Import custom node types
import {
  RouterNode,
  FirewallNode,
  SwitchNode,
  ServerNode,
  WorkstationNode,
  PrinterNode,
  AccessPointNode,
  UnknownNode
} from './DeviceNodes';

// Import topology utilities
import { 
  DeviceNodeType, 
  NetworkDevice, 
  generateTopologyFromDevices,
  generateDemoTopology
} from '@/lib/topologyUtils';

// Import UI components
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Download
} from 'lucide-react';

// Define custom node types configuration
const nodeTypes: NodeTypes = {
  [DeviceNodeType.ROUTER]: RouterNode,
  [DeviceNodeType.FIREWALL]: FirewallNode,
  [DeviceNodeType.SWITCH]: SwitchNode,
  [DeviceNodeType.SERVER]: ServerNode,
  [DeviceNodeType.WORKSTATION]: WorkstationNode,
  [DeviceNodeType.PRINTER]: PrinterNode,
  [DeviceNodeType.ACCESS_POINT]: AccessPointNode,
  [DeviceNodeType.UNKNOWN]: UnknownNode,
};

interface NetworkTopologyVisualizerProps {
  devices?: NetworkDevice[];
  height?: string;
  isDemoMode?: boolean;
  onNodeClick?: (device: NetworkDevice) => void;
}

/**
 * Inner component that uses the React Flow hooks
 */
function NetworkTopologyVisualizerInner({
  devices = [],
  height,
  isDemoMode = false,
  onNodeClick
}: NetworkTopologyVisualizerProps) {
  // Get topology data
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (isDemoMode || !devices.length) {
      return generateDemoTopology();
    }
    return generateTopologyFromDevices(devices);
  }, [devices, isDemoMode]);
  
  // Set up React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // Handle node click event
  const handleNodeClick = useCallback((e: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    if (onNodeClick && node.data) {
      onNodeClick(node.data);
    }
  }, [onNodeClick]);
  
  // Reset the view to fit all nodes (will be connected to instance in useEffect)
  const fitView = () => {
    const instance = document.querySelector('.react-flow');
    if (instance) {
      setTimeout(() => {
        const fitViewButton = document.querySelector('.react-flow__controls-fitview');
        if (fitViewButton) {
          (fitViewButton as HTMLElement).click();
        }
      }, 100);
    }
  };
  
  // Regenerate the topology layout
  const regenerateLayout = useCallback(() => {
    if (isDemoMode || !devices.length) {
      const { nodes: newNodes, edges: newEdges } = generateDemoTopology();
      setNodes(newNodes);
      setEdges(newEdges);
    } else {
      const { nodes: newNodes, edges: newEdges } = generateTopologyFromDevices(devices);
      setNodes(newNodes);
      setEdges(newEdges);
    }
    
    fitView();
  }, [devices, isDemoMode, setNodes, setEdges]);
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.2}
      maxZoom={1.5}
      proOptions={{ hideAttribution: true }}
    >
      {/* Background */}
      <Background color="#475569" gap={24} />
      
      {/* MiniMap for navigation */}
      <MiniMap 
        nodeStrokeWidth={3}
        zoomable 
        pannable
        nodeColor={(node) => {
          switch (node.type) {
            case DeviceNodeType.ROUTER:
              return '#3b82f6'; // blue
            case DeviceNodeType.FIREWALL:
              return '#f97316'; // orange
            case DeviceNodeType.SWITCH:
              return '#10b981'; // green
            case DeviceNodeType.SERVER:
              return '#8b5cf6'; // purple
            case DeviceNodeType.WORKSTATION:
              return '#64748b'; // slate
            case DeviceNodeType.PRINTER:
              return '#ef4444'; // red
            case DeviceNodeType.ACCESS_POINT:
              return '#06b6d4'; // cyan
            default:
              return '#94a3b8'; // gray
          }
        }}
      />
      
      {/* Controls */}
      <Controls />
      
      {/* Custom controls panel */}
      <Panel position="top-right" className="bg-slate-800 border border-slate-700 rounded-md p-2 shadow-lg">
        <div className="flex flex-col gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            onClick={fitView}
            title="Fit View"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => {
              const zoomInButton = document.querySelector('.react-flow__controls-zoomin');
              if (zoomInButton) {
                (zoomInButton as HTMLElement).click();
              }
            }}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => {
              const zoomOutButton = document.querySelector('.react-flow__controls-zoomout');
              if (zoomOutButton) {
                (zoomOutButton as HTMLElement).click();
              }
            }}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Separator className="my-1" />
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            onClick={regenerateLayout}
            title="Regenerate Layout"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => {
              // Simple PNG export fallback
              const a = document.createElement('a');
              a.setAttribute('download', 'network-topology.png');
              a.setAttribute('href', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==');
              a.click();
            }}
            title="Export as PNG"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </Panel>
    </ReactFlow>
  );
}

/**
 * Main component that wraps the inner component with ReactFlowProvider
 */
export default function NetworkTopologyVisualizer(props: NetworkTopologyVisualizerProps) {
  const { height = '500px' } = props;
  
  return (
    <div style={{ height, width: '100%' }}>
      <ReactFlowProvider>
        <NetworkTopologyVisualizerInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}