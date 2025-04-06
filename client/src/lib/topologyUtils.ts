/**
 * Network Topology Utilities
 * 
 * Helper functions for generating network topology visualizations
 */
import { MarkerType, Node, Edge, Position } from 'reactflow';

// Node types for network topology
export enum DeviceNodeType {
  ROUTER = 'router',
  FIREWALL = 'firewall',
  SWITCH = 'switch',
  SERVER = 'server',
  WORKSTATION = 'workstation',
  PRINTER = 'printer',
  ACCESS_POINT = 'accessPoint',
  UNKNOWN = 'unknown'
}

// Network device interface
export interface NetworkDevice {
  id?: string;
  name: string;
  deviceType: string;
  ipAddress?: string;
  macAddress?: string;
  model?: string;
  manufacturer?: string;
  role?: string;
  location?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  services?: string[];
  vulnerabilities?: string[];
}

// Network connection interface
export interface NetworkConnection {
  id?: string;
  source: string;
  target: string;
  connectionType?: 'wired' | 'wireless' | 'vpn' | 'unknown';
  bandwidth?: string;
  isActive?: boolean;
  latency?: number;
  protocol?: string;
}

// Function to convert device type to node type
export function getNodeType(deviceType: string): DeviceNodeType {
  switch (deviceType.toLowerCase()) {
    case 'router':
      return DeviceNodeType.ROUTER;
    case 'firewall':
      return DeviceNodeType.FIREWALL;
    case 'switch':
      return DeviceNodeType.SWITCH;
    case 'server':
      return DeviceNodeType.SERVER;
    case 'workstation':
      return DeviceNodeType.WORKSTATION;
    case 'printer':
      return DeviceNodeType.PRINTER;
    case 'access point':
      return DeviceNodeType.ACCESS_POINT;
    default:
      return DeviceNodeType.UNKNOWN;
  }
}

// Function to convert devices to ReactFlow nodes
export function convertDevicesToNodes(devices: NetworkDevice[]): Node[] {
  return devices.map((device, index) => {
    const id = device.id || `device-${index}`;
    const type = getNodeType(device.deviceType);
    
    return {
      id,
      type,
      position: { x: 0, y: 0 }, // Initial positions will be set by the layout
      data: { ...device },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });
}

// Function to convert connections to ReactFlow edges
export function convertConnectionsToEdges(connections: NetworkConnection[]): Edge[] {
  return connections.map((connection, index) => {
    const id = connection.id || `edge-${index}`;
    
    // Apply different styling based on connection type
    const edgeStyle = getEdgeStyle(connection.connectionType || 'unknown');
    
    return {
      id,
      source: connection.source,
      target: connection.target,
      type: 'smoothstep',
      animated: connection.isActive !== false, // Animate if active or not specified
      style: edgeStyle.style,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      data: { ...connection },
      label: connection.bandwidth || '',
    };
  });
}

// Function to get edge style based on connection type
function getEdgeStyle(connectionType: string): { style: React.CSSProperties } {
  switch (connectionType) {
    case 'wired':
      return {
        style: {
          strokeWidth: 2,
          stroke: '#3b82f6', // blue
        }
      };
    case 'wireless':
      return {
        style: {
          strokeWidth: 2,
          stroke: '#8b5cf6', // purple
          strokeDasharray: '5,5',
        }
      };
    case 'vpn':
      return {
        style: {
          strokeWidth: 2,
          stroke: '#10b981', // green
          strokeDasharray: '10,5',
        }
      };
    default:
      return {
        style: {
          strokeWidth: 1.5,
          stroke: '#64748b', // slate
        }
      };
  }
}

// Auto-generate connections between devices
export function generateAutoConnections(
  devices: NetworkDevice[], 
  routerFirst: boolean = true
): NetworkConnection[] {
  if (devices.length === 0) return [];
  
  const connections: NetworkConnection[] = [];
  const deviceIds = devices.map((device, idx) => device.id || `device-${idx}`);
  
  // Find routers and firewalls first
  const routerIds = devices
    .filter(d => d.deviceType.toLowerCase() === 'router' || 
                 d.deviceType.toLowerCase() === 'firewall')
    .map((device, idx) => device.id || `device-${idx}`);
  
  // If there are routers/firewalls, connect other devices to them
  if (routerIds.length > 0 && routerFirst) {
    // First connect all routers/firewalls to each other if there are multiple
    for (let i = 0; i < routerIds.length - 1; i++) {
      connections.push({
        source: routerIds[i],
        target: routerIds[i + 1],
        connectionType: 'wired',
      });
    }
    
    // Then connect other devices to the first router/firewall
    const mainRouterId = routerIds[0];
    const otherDeviceIds = deviceIds.filter(id => !routerIds.includes(id));
    
    for (const deviceId of otherDeviceIds) {
      connections.push({
        source: mainRouterId,
        target: deviceId,
        connectionType: 'wired',
      });
    }
  } else {
    // If no routers/firewalls or not prioritizing them, create a simple connected graph
    for (let i = 0; i < deviceIds.length - 1; i++) {
      connections.push({
        source: deviceIds[i],
        target: deviceIds[i + 1],
        connectionType: 'wired',
      });
    }
  }
  
  return connections;
}

// Apply auto-layout to position nodes in a meaningful way
export function applyAutoLayout(nodes: Node[]): Node[] {
  const HORIZONTAL_SPACING = 200;
  const VERTICAL_SPACING = 150;
  
  // First segment nodes by type
  const routersFirewalls = nodes.filter(n => 
    n.type === DeviceNodeType.ROUTER || n.type === DeviceNodeType.FIREWALL);
  const switches = nodes.filter(n => n.type === DeviceNodeType.SWITCH);
  const servers = nodes.filter(n => n.type === DeviceNodeType.SERVER);
  const workstations = nodes.filter(n => n.type === DeviceNodeType.WORKSTATION);
  const others = nodes.filter(n => 
    !routersFirewalls.includes(n) && 
    !switches.includes(n) && 
    !servers.includes(n) && 
    !workstations.includes(n));
  
  // Position routers/firewalls at the top center
  routersFirewalls.forEach((node, i) => {
    node.position = { 
      x: HORIZONTAL_SPACING * (i - (routersFirewalls.length - 1) / 2), 
      y: 0 
    };
  });
  
  // Position switches below routers
  switches.forEach((node, i) => {
    node.position = { 
      x: HORIZONTAL_SPACING * (i - (switches.length - 1) / 2), 
      y: VERTICAL_SPACING 
    };
  });
  
  // Position servers below switches
  servers.forEach((node, i) => {
    node.position = { 
      x: HORIZONTAL_SPACING * (i - (servers.length - 1) / 2), 
      y: VERTICAL_SPACING * 2 
    };
  });
  
  // Position workstations in a grid below servers
  const WORKSTATIONS_PER_ROW = 4;
  workstations.forEach((node, i) => {
    const row = Math.floor(i / WORKSTATIONS_PER_ROW);
    const col = i % WORKSTATIONS_PER_ROW;
    node.position = { 
      x: HORIZONTAL_SPACING * (col - (WORKSTATIONS_PER_ROW - 1) / 2), 
      y: VERTICAL_SPACING * (3 + row) 
    };
  });
  
  // Position other devices to the right side
  others.forEach((node, i) => {
    node.position = { 
      x: HORIZONTAL_SPACING * 2, 
      y: VERTICAL_SPACING * (i + 1) 
    };
  });
  
  return nodes;
}

// Auto-generate a simple network topology for demo purposes
export function generateDemoTopology(): {
  nodes: Node[],
  edges: Edge[]
} {
  // Create some example devices
  const devices: NetworkDevice[] = [
    {
      id: 'device-1',
      name: 'Main Firewall',
      deviceType: 'Firewall',
      ipAddress: '192.168.1.1',
      model: 'Cisco ASA 5506-X',
      role: 'Network Security',
    },
    {
      id: 'device-2',
      name: 'Core Router',
      deviceType: 'Router',
      ipAddress: '192.168.1.2',
      model: 'Cisco 4321',
      role: 'Internet Gateway',
    },
    {
      id: 'device-3',
      name: 'Main Switch',
      deviceType: 'Switch',
      ipAddress: '192.168.1.3',
      model: 'Cisco Catalyst 2960',
      role: 'Network Distribution',
    },
    {
      id: 'device-4',
      name: 'File Server',
      deviceType: 'Server',
      ipAddress: '192.168.1.10',
      model: 'Dell PowerEdge R740',
      role: 'File Storage',
    },
    {
      id: 'device-5',
      name: 'Database Server',
      deviceType: 'Server',
      ipAddress: '192.168.1.11',
      model: 'Dell PowerEdge R740',
      role: 'Database',
    },
    {
      id: 'device-6',
      name: 'Workstation 1',
      deviceType: 'Workstation',
      ipAddress: '192.168.1.101',
      model: 'Dell OptiPlex 7080',
      role: 'Employee Desktop',
    },
    {
      id: 'device-7',
      name: 'Workstation 2',
      deviceType: 'Workstation',
      ipAddress: '192.168.1.102',
      model: 'Dell OptiPlex 7080',
      role: 'Employee Desktop',
    },
    {
      id: 'device-8',
      name: 'Office Printer',
      deviceType: 'Printer',
      ipAddress: '192.168.1.201',
      model: 'HP LaserJet Pro M404n',
      role: 'Document Printing',
    },
    {
      id: 'device-9',
      name: 'WiFi Access Point',
      deviceType: 'Access Point',
      ipAddress: '192.168.1.250',
      model: 'Ubiquiti UniFi AP-AC-Pro',
      role: 'Wireless Access',
    },
  ];
  
  // Define manual connections for a more realistic topology
  const connections: NetworkConnection[] = [
    {
      source: 'device-1', // Firewall
      target: 'device-2', // Router
      connectionType: 'wired',
      bandwidth: '1 Gbps',
    },
    {
      source: 'device-2', // Router
      target: 'device-3', // Switch
      connectionType: 'wired',
      bandwidth: '1 Gbps',
    },
    {
      source: 'device-3', // Switch
      target: 'device-4', // File Server
      connectionType: 'wired',
      bandwidth: '1 Gbps',
    },
    {
      source: 'device-3', // Switch
      target: 'device-5', // Database Server
      connectionType: 'wired',
      bandwidth: '1 Gbps',
    },
    {
      source: 'device-3', // Switch
      target: 'device-6', // Workstation 1
      connectionType: 'wired',
      bandwidth: '1 Gbps',
    },
    {
      source: 'device-3', // Switch
      target: 'device-7', // Workstation 2
      connectionType: 'wired',
      bandwidth: '1 Gbps',
    },
    {
      source: 'device-3', // Switch
      target: 'device-8', // Office Printer
      connectionType: 'wired',
      bandwidth: '1 Gbps',
    },
    {
      source: 'device-3', // Switch
      target: 'device-9', // WiFi Access Point
      connectionType: 'wired',
      bandwidth: '1 Gbps',
    },
  ];
  
  // Convert devices and connections to ReactFlow format
  const nodes = convertDevicesToNodes(devices);
  const layoutedNodes = applyAutoLayout(nodes);
  const edges = convertConnectionsToEdges(connections);
  
  return { nodes: layoutedNodes, edges };
}

// Generate a network topology from device data
export function generateTopologyFromDevices(devices: NetworkDevice[]): {
  nodes: Node[],
  edges: Edge[]
} {
  if (!devices || devices.length === 0) {
    return generateDemoTopology();
  }
  
  // Add IDs if they don't exist
  const devicesWithIds = devices.map((device, idx) => ({
    ...device,
    id: device.id || `device-${idx + 1}`
  }));
  
  // Generate connections between devices
  const connections = generateAutoConnections(devicesWithIds, true);
  
  // Convert to ReactFlow format
  const nodes = convertDevicesToNodes(devicesWithIds);
  const layoutedNodes = applyAutoLayout(nodes);
  const edges = convertConnectionsToEdges(connections);
  
  return { nodes: layoutedNodes, edges };
}