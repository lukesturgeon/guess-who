import { useRef, useState, useCallback } from "react";

export function useWebRTC(fns: Record<string, (args: any) => any>, audioRef: React.RefObject<HTMLAudioElement | null>) {
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // Named handlers for data channel events
  const handleDataChannelOpen = useCallback((ev: Event) => {
    if (!dataChannelRef.current) return;
    const event = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        tools: [
          {
            type: 'function',
            name: 'changeBackgroundColor',
            description: 'Changes the background color of a web page',
            parameters: {
              type: 'object',
              properties: { color: { type: 'string', description: 'A hex value of the color' } },
            },
          },
          {
            type: 'function',
            name: 'changeTextColor',
            description: 'Changes the text color of a web page',
            parameters: {
              type: 'object',
              properties: { color: { type: 'string', description: 'A hex value of the color' } },
            },
          },
          {
            type: 'function',
            name: 'getPageHTML',
            description: 'Gets the HTML for the current page',
          },
        ],
      },
    };
    dataChannelRef.current?.send(JSON.stringify(event));
    dataChannelRef.current?.send(JSON.stringify({ type: "response.create" }));
  }, []);

  const handleDataChannelMessage = useCallback(async (ev: MessageEvent) => {
    const msg = JSON.parse(ev.data);
    if (msg.type === 'response.function_call_arguments.done') {
      const fn = fns[msg.name as keyof typeof fns];
      if (fn !== undefined) {
        const args = JSON.parse(msg.arguments);
        const result = await fn(args);
        const event = {
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: msg.call_id,
            output: JSON.stringify(result),
          },
        };
        dataChannelRef.current?.send(JSON.stringify(event));
        dataChannelRef.current?.send(JSON.stringify({ type: "response.create" }));
      }
    }
  }, [fns]);

  const startWebRTCConnection = useCallback(async () => {
    if (isConnected) return;
    peerConnectionRef.current = new RTCPeerConnection();

    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = (event) => {
        if (audioRef.current) {
          audioRef.current.srcObject = event.streams[0];
          audioRef.current.play();
        }
      };

      const dataChannel = peerConnectionRef.current.createDataChannel('oai-events');
      dataChannelRef.current = dataChannel;
      dataChannelRef.current.addEventListener('open', handleDataChannelOpen);
      dataChannelRef.current.addEventListener('message', handleDataChannelMessage);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => peerConnectionRef.current?.addTransceiver(track, { direction: 'sendrecv' }));

        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);

        const tokenResponse = await fetch('/api/session', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await tokenResponse.json();
        const EPHEMERAL_KEY = data.result.client_secret.value;
        const baseUrl = 'https://api.openai.com/v1/realtime';
        const model = 'gpt-4o-realtime-preview-2024-12-17';
        const answer = await fetch(`${baseUrl}?model=${model}`, {
          method: 'POST',
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${EPHEMERAL_KEY}`,
            'Content-Type': 'application/sdp',
          },
        }).then((r) => r.text());
        await peerConnectionRef.current.setRemoteDescription({
          sdp: answer,
          type: 'answer',
        });
        setIsConnected(true);
      } catch (err) {
        setError('Failed to start WebRTC connection');
      }
    }
  }, [isConnected, handleDataChannelOpen, handleDataChannelMessage]);

  const stopWebRTCConnection = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.removeEventListener('open', handleDataChannelOpen);
      dataChannelRef.current.removeEventListener('message', handleDataChannelMessage);
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setIsConnected(false);
  }, [handleDataChannelOpen, handleDataChannelMessage]);

  return {
    isConnected,
    error,
    startWebRTCConnection,
    stopWebRTCConnection
  };
}
