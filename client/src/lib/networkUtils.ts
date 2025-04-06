/**
 * Network Utilities
 * 
 * Helper functions for gathering network information
 */

/**
 * Detects network information using browser APIs
 * Note: This is limited by browser security restrictions
 * 
 * @returns Object with network information
 */
export async function detectNetworkInfo(): Promise<{
  ipAddress: string;
  lanIpAddress: string;
  isp: string;
  connectionType?: string;
  hostname?: string;
}> {
  try {
    // Get public IP address from an external service
    // In a real implementation, you'd use your own backend endpoint that proxies to these services
    const ipRes = await fetch('https://api.ipify.org?format=json', { method: 'GET' });
    const ipData = await ipRes.json();
    
    // Attempt to get more info from a secondary service
    let ipInfo = {
      ip: ipData.ip,
      org: 'Unknown ISP',
      hostname: 'Unknown',
      city: '',
      region: '',
      country: ''
    };
    
    try {
      const infoRes = await fetch(`https://ipapi.co/${ipData.ip}/json/`, { method: 'GET' });
      const infoData = await infoRes.json();
      
      if (infoData && !infoData.error) {
        ipInfo = {
          ip: ipData.ip,
          org: infoData.org || 'Unknown ISP',
          hostname: infoData.hostname || 'Unknown',
          city: infoData.city || '',
          region: infoData.region || '',
          country: infoData.country_name || ''
        };
      }
    } catch (error) {
      console.error('Error getting detailed IP info:', error);
    }
    
    // Try to detect connection type using Navigator API
    const connectionType = detectConnectionType();
    
    // Get local (LAN) IP address using WebRTC
    const lanIpAddress = await getLanIpAddress();
    
    return {
      ipAddress: ipInfo.ip,
      lanIpAddress,
      isp: ipInfo.org,
      connectionType,
      hostname: ipInfo.hostname,
    };
  } catch (error) {
    console.error('Error detecting network info:', error);
    return {
      ipAddress: 'Unable to detect',
      lanIpAddress: 'Not available',
      isp: 'Unknown',
      connectionType: 'Unknown',
      hostname: 'Unknown',
    };
  }
}

/**
 * Gets device information from the browser
 * 
 * @returns Object with device information
 */
export async function getDeviceInformation(): Promise<{
  userAgent: string;
  operatingSystem: string;
  browser: string;
}> {
  const userAgent = navigator.userAgent;
  
  // Detect OS
  let operatingSystem = 'Unknown';
  if (userAgent.indexOf('Win') !== -1) operatingSystem = 'Windows';
  else if (userAgent.indexOf('Mac') !== -1) operatingSystem = 'macOS';
  else if (userAgent.indexOf('Linux') !== -1) operatingSystem = 'Linux';
  else if (userAgent.indexOf('Android') !== -1) operatingSystem = 'Android';
  else if (userAgent.indexOf('iOS') !== -1 || userAgent.indexOf('iPhone') !== -1 || userAgent.indexOf('iPad') !== -1) operatingSystem = 'iOS';
  
  // Detect browser
  let browser = 'Unknown';
  if (userAgent.indexOf('Chrome') !== -1) browser = 'Chrome';
  else if (userAgent.indexOf('Firefox') !== -1) browser = 'Firefox';
  else if (userAgent.indexOf('Safari') !== -1) browser = 'Safari';
  else if (userAgent.indexOf('Edge') !== -1) browser = 'Edge';
  else if (userAgent.indexOf('MSIE') !== -1 || userAgent.indexOf('Trident/') !== -1) browser = 'Internet Explorer';
  
  return {
    userAgent,
    operatingSystem,
    browser,
  };
}

/**
 * Attempts to detect connection type using Navigator API
 * 
 * @returns Connection type string
 */
function detectConnectionType(): string {
  // @ts-ignore - NetworkInformation is not yet standardized
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) return 'Unknown';
  
  if (connection.effectiveType) {
    switch (connection.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'Slow (2G)';
      case '3g':
        return 'Average (3G)';
      case '4g':
        return 'Fast (4G/LTE)';
      default:
        return connection.effectiveType.toUpperCase();
    }
  }
  
  if (connection.type) {
    switch (connection.type) {
      case 'cellular':
        return 'Cellular';
      case 'wifi':
        return 'WiFi';
      case 'ethernet':
        return 'Ethernet';
      case 'none':
        return 'Offline';
      default:
        return connection.type.charAt(0).toUpperCase() + connection.type.slice(1);
    }
  }
  
  return 'Unknown';
}

/**
 * Gets local (LAN) IP address using WebRTC
 * 
 * @returns Promise resolving to LAN IP address or null if not available
 */
export async function getLanIpAddress(): Promise<string> {
  return new Promise((resolve) => {
    try {
      // Create dummy RTCPeerConnection to trigger ICE candidate gathering
      const pc = new RTCPeerConnection({
        iceServers: [{urls: "stun:stun.l.google.com:19302"}]
      });
      
      // Set a timeout in case WebRTC is not supported or fails
      const timeoutId = setTimeout(() => {
        if (pc.connectionState !== 'closed') {
          pc.close();
        }
        resolve('Not available');
      }, 5000);
      
      // Listen for candidate events
      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        
        // Parse the candidate string to find IPv4 local addresses
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
        const ipAddress = ipRegex.exec(event.candidate.candidate);
        
        // Check if it's a local IP (non-public)
        if (ipAddress && isLocalIpAddress(ipAddress[1])) {
          clearTimeout(timeoutId);
          if (pc.connectionState !== 'closed') {
            pc.close();
          }
          resolve(ipAddress[1]);
        }
      };
      
      // Create a data channel to trigger candidate gathering
      pc.createDataChannel('lanip');
      
      // Create offer to trigger ICE gathering
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => {
          clearTimeout(timeoutId);
          if (pc.connectionState !== 'closed') {
            pc.close();
          }
          resolve('Not available');
        });
    } catch (error) {
      console.error('Error getting LAN IP:', error);
      resolve('Not available');
    }
  });
}

/**
 * Checks if an IP address is a local/private IP
 * 
 * @param ip IP address to check
 * @returns Boolean indicating if it's a local IP
 */
function isLocalIpAddress(ip: string): boolean {
  // Check common private IP ranges
  return ip.startsWith('10.') || 
         ip.startsWith('192.168.') || 
         ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) !== null ||
         ip.startsWith('169.254.'); // Link-local addresses
}

/**
 * Estimates connection speed (very simplified)
 * 
 * @returns Promise resolving to estimated speed in Mbps
 */
export async function estimateConnectionSpeed(): Promise<number> {
  try {
    const startTime = Date.now();
    const response = await fetch('https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js', {
      method: 'GET',
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch test file');
    }
    
    const blob = await response.blob();
    const endTime = Date.now();
    
    // Calculate speed in Mbps
    const fileSizeInBits = blob.size * 8;
    const durationInSeconds = (endTime - startTime) / 1000;
    const speedInMbps = (fileSizeInBits / durationInSeconds) / 1000000;
    
    return parseFloat(speedInMbps.toFixed(2));
  } catch (error) {
    console.error('Error estimating connection speed:', error);
    return 0;
  }
}
