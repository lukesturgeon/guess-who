import { useRef, useState, useCallback } from "react";

export function useWebRTC(

  tools: Record<string, { fn: (args: any) => any; description: string; parameters?: object }>,
  audioRef: React.RefObject<HTMLAudioElement | null>
) {
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
        tools: Object.entries(tools).map(([name, { description, parameters }]) => ({
          type: 'function',
          name,
          description,
          ...(parameters ? { parameters } : {}),
        })),
      },
    };
    dataChannelRef.current?.send(JSON.stringify(event));
    dataChannelRef.current?.send(JSON.stringify({ type: "response.create" }));
  }, [tools]);

  const handleDataChannelMessage = useCallback(async (ev: MessageEvent) => {
    const msg = JSON.parse(ev.data);
    if (msg.type === 'response.function_call_arguments.done') {
      const tool = tools[msg.name as keyof typeof tools];
      if (tool && typeof tool.fn === 'function') {
        const args = JSON.parse(msg.arguments);
        const result = await tool.fn(args);
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
  }, [tools]);

  const startWebRTCConnection = useCallback(async (description: string) => {
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
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description }),
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
