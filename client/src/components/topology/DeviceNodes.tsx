import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Router, 
  Shield, 
  Server, 
  Monitor, 
  Printer, 
  Wifi, 
  Network, 
  Cpu
} from 'lucide-react';

// Base device node styling
const deviceNodeStyle = {
  padding: '10px',
  borderRadius: '5px',
  width: '180px',
  fontSize: '12px',
};

// Basic component for node details display
const NodeDetails = ({ label, value }: { label: string, value?: string }) => {
  if (!value) return null;
  
  return (
    <div className="flex justify-between text-xs py-0.5">
      <span className="text-slate-400">{label}:</span>
      <span className="text-white font-medium truncate max-w-[110px]">{value}</span>
    </div>
  );
};

// Router Node
export const RouterNode = memo(({ data }: NodeProps) => {
  return (
    <div 
      className="bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-700 shadow-lg"
      style={deviceNodeStyle}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className="flex items-center mb-2">
        <div className="p-2 bg-blue-700 rounded-md mr-2">
          <Router className="h-4 w-4 text-blue-300" />
        </div>
        <div className="truncate">
          <div className="text-white font-medium truncate">{data.name}</div>
          <div className="text-blue-300 text-xs">{data.role || 'Network Gateway'}</div>
        </div>
      </div>
      
      <div className="border-t border-blue-700 pt-1 mt-1">
        <NodeDetails label="IP" value={data.ipAddress} />
        <NodeDetails label="Model" value={data.model} />
        <NodeDetails label="Location" value={data.location} />
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
});

// Firewall Node
export const FirewallNode = memo(({ data }: NodeProps) => {
  return (
    <div 
      className="bg-gradient-to-br from-orange-900 to-orange-800 border border-orange-700 shadow-lg"
      style={deviceNodeStyle}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className="flex items-center mb-2">
        <div className="p-2 bg-orange-700 rounded-md mr-2">
          <Shield className="h-4 w-4 text-orange-300" />
        </div>
        <div className="truncate">
          <div className="text-white font-medium truncate">{data.name}</div>
          <div className="text-orange-300 text-xs">{data.role || 'Security Device'}</div>
        </div>
      </div>
      
      <div className="border-t border-orange-700 pt-1 mt-1">
        <NodeDetails label="IP" value={data.ipAddress} />
        <NodeDetails label="Model" value={data.model} />
        <NodeDetails label="Location" value={data.location} />
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
});

// Switch Node
export const SwitchNode = memo(({ data }: NodeProps) => {
  return (
    <div 
      className="bg-gradient-to-br from-green-900 to-green-800 border border-green-700 shadow-lg"
      style={deviceNodeStyle}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className="flex items-center mb-2">
        <div className="p-2 bg-green-700 rounded-md mr-2">
          <Network className="h-4 w-4 text-green-300" />
        </div>
        <div className="truncate">
          <div className="text-white font-medium truncate">{data.name}</div>
          <div className="text-green-300 text-xs">{data.role || 'Network Switch'}</div>
        </div>
      </div>
      
      <div className="border-t border-green-700 pt-1 mt-1">
        <NodeDetails label="IP" value={data.ipAddress} />
        <NodeDetails label="Model" value={data.model} />
        <NodeDetails label="Location" value={data.location} />
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
});

// Server Node
export const ServerNode = memo(({ data }: NodeProps) => {
  return (
    <div 
      className="bg-gradient-to-br from-purple-900 to-purple-800 border border-purple-700 shadow-lg"
      style={deviceNodeStyle}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className="flex items-center mb-2">
        <div className="p-2 bg-purple-700 rounded-md mr-2">
          <Server className="h-4 w-4 text-purple-300" />
        </div>
        <div className="truncate">
          <div className="text-white font-medium truncate">{data.name}</div>
          <div className="text-purple-300 text-xs">{data.role || 'Application Server'}</div>
        </div>
      </div>
      
      <div className="border-t border-purple-700 pt-1 mt-1">
        <NodeDetails label="IP" value={data.ipAddress} />
        <NodeDetails label="Model" value={data.model} />
        <NodeDetails label="Location" value={data.location} />
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
});

// Workstation Node
export const WorkstationNode = memo(({ data }: NodeProps) => {
  return (
    <div 
      className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 shadow-lg"
      style={deviceNodeStyle}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className="flex items-center mb-2">
        <div className="p-2 bg-slate-600 rounded-md mr-2">
          <Monitor className="h-4 w-4 text-slate-300" />
        </div>
        <div className="truncate">
          <div className="text-white font-medium truncate">{data.name}</div>
          <div className="text-slate-300 text-xs">{data.role || 'User Computer'}</div>
        </div>
      </div>
      
      <div className="border-t border-slate-600 pt-1 mt-1">
        <NodeDetails label="IP" value={data.ipAddress} />
        <NodeDetails label="Model" value={data.model} />
        <NodeDetails label="Location" value={data.location} />
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
});

// Printer Node
export const PrinterNode = memo(({ data }: NodeProps) => {
  return (
    <div 
      className="bg-gradient-to-br from-red-900 to-red-800 border border-red-700 shadow-lg"
      style={deviceNodeStyle}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className="flex items-center mb-2">
        <div className="p-2 bg-red-700 rounded-md mr-2">
          <Printer className="h-4 w-4 text-red-300" />
        </div>
        <div className="truncate">
          <div className="text-white font-medium truncate">{data.name}</div>
          <div className="text-red-300 text-xs">{data.role || 'Printing Device'}</div>
        </div>
      </div>
      
      <div className="border-t border-red-700 pt-1 mt-1">
        <NodeDetails label="IP" value={data.ipAddress} />
        <NodeDetails label="Model" value={data.model} />
        <NodeDetails label="Location" value={data.location} />
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
});

// Access Point Node
export const AccessPointNode = memo(({ data }: NodeProps) => {
  return (
    <div 
      className="bg-gradient-to-br from-cyan-900 to-cyan-800 border border-cyan-700 shadow-lg"
      style={deviceNodeStyle}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className="flex items-center mb-2">
        <div className="p-2 bg-cyan-700 rounded-md mr-2">
          <Wifi className="h-4 w-4 text-cyan-300" />
        </div>
        <div className="truncate">
          <div className="text-white font-medium truncate">{data.name}</div>
          <div className="text-cyan-300 text-xs">{data.role || 'Wireless Access'}</div>
        </div>
      </div>
      
      <div className="border-t border-cyan-700 pt-1 mt-1">
        <NodeDetails label="IP" value={data.ipAddress} />
        <NodeDetails label="Model" value={data.model} />
        <NodeDetails label="Location" value={data.location} />
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
});

// Generic/Unknown Node
export const UnknownNode = memo(({ data }: NodeProps) => {
  return (
    <div 
      className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 shadow-lg"
      style={deviceNodeStyle}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className="flex items-center mb-2">
        <div className="p-2 bg-gray-700 rounded-md mr-2">
          <Cpu className="h-4 w-4 text-gray-400" />
        </div>
        <div className="truncate">
          <div className="text-white font-medium truncate">{data.name}</div>
          <div className="text-gray-400 text-xs">{data.role || 'Unknown Device'}</div>
        </div>
      </div>
      
      <div className="border-t border-gray-600 pt-1 mt-1">
        <NodeDetails label="IP" value={data.ipAddress} />
        <NodeDetails label="Type" value={data.deviceType} />
        <NodeDetails label="Location" value={data.location} />
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
});