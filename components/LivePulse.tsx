import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, X, Loader2, Volume2, MicOff } from 'lucide-react';
import { UserProfile } from '../types';

interface LivePulseProps {
  isOpen: boolean;
  onClose: () => void;
  context: string;
  profile: UserProfile;
}

export const LivePulse: React.FC<LivePulseProps> = ({ isOpen, onClose, context, profile }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('disconnected');
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const currentSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Initialize and connect
  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    const startSession = async () => {
      setStatus('connecting');
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash-native-audio-preview-12-2025';

        if (!apiKey) {
           console.error("VITE_GEMINI_API_KEY is missing");
           setStatus('error');
           return;
        }

        const ai = new GoogleGenAI({ apiKey });
        
        // Audio Contexts - Output at 24kHz
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
        
        // Input Stream - Input at 16kHz
        streamRef.current = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                channelCount: 1,
                sampleRate: 16000
            } 
        });

        // Gemini Live Connection
        const sessionPromise = ai.live.connect({
          model: model,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: `You are MessMate AI Voice Assistant. Context: ${context}. User Profile: ${profile.name}, ${profile.location}, ${profile.dietType}. Keep responses concise and helpful for a student.`,
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
            }
          },
          callbacks: {
            onopen: () => {
              setStatus('connected');
              
              // Start Input Processing
              if (!audioContextRef.current || !streamRef.current) return;
              
              const inputCtx = new AudioContextClass({ sampleRate: 16000 });
              sourceRef.current = inputCtx.createMediaStreamSource(streamRef.current);
              // Buffer size 4096, 1 input channel, 1 output channel
              processorRef.current = inputCtx.createScriptProcessor(4096, 1, 1);
              
              processorRef.current.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Calculate volume for UI visualization
                let sum = 0;
                for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                setVolume(Math.sqrt(sum / inputData.length));

                // Send to Gemini as 16-bit PCM, 16kHz
                const pcmBlob = createBlob(inputData);
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              
              sourceRef.current.connect(processorRef.current);
              processorRef.current.connect(inputCtx.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
              const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData && audioContextRef.current) {
                const ctx = audioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                // Decode assuming 24kHz output from model
                const audioBuffer = await decodeAudioData(
                  decode(audioData),
                  ctx,
                  24000,
                  1
                );
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
              }
            },
            onclose: () => {
              setStatus('disconnected');
            },
            onerror: (err) => {
              console.error(err);
              setStatus('error');
            }
          }
        });
        
        currentSessionRef.current = sessionPromise;

      } catch (err) {
        console.error("Failed to start live session:", err);
        setStatus('error');
      }
    };

    startSession();

    return () => cleanup();
  }, [isOpen, context]);

  const cleanup = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    // Close session if possible (wrapper handles it mostly via hook unmount logic usually, but here explicit close if we had the session object)
    // Note: The SDK doesn't expose a clean separate close on the promise result easily without awaiting.
    setStatus('disconnected');
    setVolume(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="flex flex-col items-center gap-6 pt-4">
           {/* Visualizer Circle */}
           <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 relative ${
             status === 'connected' ? 'bg-indigo-50 border-4 border-indigo-100' : 'bg-gray-50 border-4 border-gray-100'
           }`}>
             {/* Pulse Rings */}
             {status === 'connected' && (
                <>
                  <div className="absolute inset-0 rounded-full bg-indigo-500 opacity-20 animate-ping" style={{ transform: `scale(${1 + volume * 5})` }}></div>
                  <div className="absolute inset-0 rounded-full bg-indigo-400 opacity-20 animate-pulse" style={{ transform: `scale(${1 + volume * 2})` }}></div>
                </>
             )}
             
             {status === 'connecting' ? (
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
             ) : status === 'error' ? (
                <MicOff className="w-10 h-10 text-red-500" />
             ) : (
                <Mic className={`w-10 h-10 transition-colors ${status === 'connected' ? 'text-indigo-600' : 'text-gray-400'}`} />
             )}
           </div>

           <div className="text-center space-y-2">
             <h3 className="text-xl font-bold text-gray-800">
               {status === 'connecting' ? 'Connecting...' : 
                status === 'connected' ? 'Listening' : 
                status === 'error' ? 'Connection Error' : 'Ready'}
             </h3>
             <p className="text-sm text-gray-500 max-w-[200px] mx-auto leading-tight">
               {status === 'connected' 
                 ? "Speak naturally. I'm analyzing your request." 
                 : "Please wait while we establish the secure voice channel."}
             </p>
           </div>
           
           <div className="flex gap-2">
             <div className="w-1 h-4 bg-indigo-600 rounded-full animate-pulse delay-75"></div>
             <div className="w-1 h-6 bg-indigo-600 rounded-full animate-pulse delay-150"></div>
             <div className="w-1 h-8 bg-indigo-600 rounded-full animate-pulse delay-0"></div>
             <div className="w-1 h-6 bg-indigo-600 rounded-full animate-pulse delay-100"></div>
             <div className="w-1 h-4 bg-indigo-600 rounded-full animate-pulse delay-200"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

// Utils
function createBlob(data: Float32Array): any {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}